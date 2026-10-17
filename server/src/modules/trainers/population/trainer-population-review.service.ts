import { planInactivePopulationFromSource } from './trainer-population-inactive.service';
import { PEAK_SCHEMA_UPGRADE_MESSAGE, TRAINER_PEAK_SCHEMA_VERSION } from '../../../infrastructure/database/trainerPeakSchema';
import { createHash } from 'crypto';
import sqlite3 from 'sqlite3';
import { calculatePokemonStats } from '../../../generators/pokemonSetGenerator';
import { generateFieldRatings } from '../../../generators/fieldRatingGenerator';
import { generateFormatRatingsFixed } from '../../../generators/formatRatingGenerator';
import { generateMentalRatings } from '../../../generators/mentalRatingGenerator';
import { allSpecies } from '../../../reference-data/pokemon-species';
import { closeDatabase, openDatabase, queryAll, runInTransaction, runStatement } from '../../../infrastructure/database/sqlite';
import { addTrainerHometown, createGeneralRating, createManagementTrainer } from '../management/trainer-management.repository';
import { calculateAge, parseDateOnly } from '../management/trainer-management.service';
import { createGeneratedPokemonInstance } from '../pokemon/pokemon.repository';
import { FORMAT_RATING_COLUMNS, MENTAL_RATING_COLUMNS } from '../trainer/trainer.types';
import { parsePopulationArtifact, unwrapPopulationArtifact } from './trainer-population-artifact.validation';
import { populationObject } from './trainer-population-proposal.validation';
import { isInactiveBrief, SPECIAL_OWNERSHIP_KINDS, type PopulationProposal, type PopulationTrainerProposal } from './trainer-population-proposal.types';
import { readPopulationSource, type PopulationSource } from './trainer-population.repository';
import { planTrainerPopulationFromSource } from './trainer-population.service';
import { PopulationPlanningError } from './trainer-population.validation';
import { createPopulationRatingFamilies } from './trainer-population-write.repository';
import type { PopulationApplyResult, PopulationReview } from './trainer-population-review.types';

function orderedJson(value: unknown): string {
  return JSON.stringify(value, (_key, entry: unknown) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return entry;
    const record = entry as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort().map((key) => [key, record[key]]));
  });
}

function reviewToken(proposal: unknown): string {
  return createHash('sha256').update(orderedJson(proposal)).digest('hex');
}

function familyValues<Column extends string>(source: object, columns: readonly Column[]): Record<Column, number> {
  const values = source as Record<string, number>;
  return Object.fromEntries(columns.map((column) => [column, values[column]])) as Record<Column, number>;
}

function specialCounts(trainer: PopulationTrainerProposal): PopulationTrainerProposal['specialOwnership'] {
  return {
    legendary: trainer.pokemon.filter((member) => allSpecies.find((species) => species.id === member.speciesId)!.isLegendary).length,
    mythical: trainer.pokemon.filter((member) => allSpecies.find((species) => species.id === member.speciesId)!.isMythical).length,
    mega: trainer.pokemon.filter((member) => member.isMega).length,
    gmax: trainer.pokemon.filter((member) => member.isGigantamax).length,
  };
}

function buildReview(source: PopulationSource, value: unknown, refreshRatings: boolean): PopulationReview {
  populationObject(value, 'Population artifact', ['version', 'mode', 'proposalId', 'snapshot', 'brief', 'plan', 'trainers', 'summary', 'notices']);
  const gameDate = source.gameDate ? parseDateOnly(source.gameDate) : null;
  if (!gameDate) throw new PopulationPlanningError(409, 'A valid current game date is required');
  // Work on a detached JSON artifact: reviewing must never mutate a caller's draft.
  const proposal = parsePopulationArtifact(JSON.parse(JSON.stringify(value)) as unknown, gameDate);
  const inactive = isInactiveBrief(proposal.brief);
  const batch = isInactiveBrief(proposal.brief) ? proposal.brief.batch : proposal.brief.planning.batch!;
  const plan = isInactiveBrief(proposal.brief) ? planInactivePopulationFromSource(source, proposal.brief, proposal.trainers.length)
    : planTrainerPopulationFromSource(source, { ...proposal.brief.planning, batch: { ...batch, count: proposal.trainers.length } });
  if (plan.inspection.snapshot !== proposal.snapshot) throw new PopulationPlanningError(409, 'The proposal belongs to a different or changed save; generate a fresh proposal against the intended database');
  const changes: string[] = [];
  const warnings = new Set(plan.batch!.issues);
  const available = plan.regionalTargets?.find((region) => region.regionId === batch.regionId);
  const names = new Set(source.trainers.map((trainer) => `${trainer.fname ?? ''} ${trainer.lname ?? ''}`.trim().toLowerCase()));
  for (const trainer of proposal.trainers) {
    if (source.schemaVersion < TRAINER_PEAK_SCHEMA_VERSION
      && (trainer.profile.estimatedPeakAbility != null || trainer.profile.estimatedPeakAbilityYear != null)) {
      throw new PopulationPlanningError(409, PEAK_SCHEMA_UPGRADE_MESSAGE);
    }
    if (trainer.profile.regionId !== batch.regionId) throw new PopulationPlanningError(400, 'Every trainer must belong to the brief region');
    const city = source.cities.find((candidate) => candidate.id === trainer.profile.hometownCityId);
    if (!city || city.region_id !== batch.regionId || city.name !== trainer.profile.hometownName) {
      throw new PopulationPlanningError(400, 'A hometown must exist in the brief region and its name must match');
    }
    const age = calculateAge(parseDateOnly(trainer.profile.birthdate)!, gameDate);
    trainer.age = age;
    if (isInactiveBrief(proposal.brief)) {
      const cohort = proposal.brief;
      const peak = trainer.profile.estimatedPeakAbility!;
      if (age < cohort.ageRange.minimum || age > cohort.ageRange.maximum
        || peak < cohort.peakAbility.minimum || peak > cohort.peakAbility.maximum) {
        throw new PopulationPlanningError(400, 'Edited inactive ages and peak abilities must fit the explicit cohort ranges');
      }
      const decline = peak - trainer.generalRatings.overallRating;
      if (decline < cohort.declinePoints.minimum || decline > cohort.declinePoints.maximum) throw new PopulationPlanningError(400, 'Reviewed current ability must fit the chosen peak minus decline-points range');
      if (trainer.declinePoints !== decline) changes.push(`${trainer.key}: decline points updated from reviewed peak and current ability`);
      trainer.declinePoints = decline;
      const peakYear = trainer.profile.estimatedPeakAbilityYear;
      if (cohort.peakYear === null ? peakYear != null : peakYear == null || peakYear < cohort.peakYear.minimum || peakYear > cohort.peakYear.maximum) {
        throw new PopulationPlanningError(400, 'Estimated peak years must match the explicit known/unknown cohort choice');
      }
      trainer.ageBand = { ...cohort.ageRange }; trainer.ratingBandId = 'inactive';
    } else {
      const pwtr = trainer.profile.pwtrRating!;
      if (age < 12) throw new PopulationPlanningError(400, 'Active competitors must be at least 12');
      if (pwtr < plan.inspection.ratingFloor || pwtr >= plan.inspection.protection.ceilingExclusive!
        || Math.abs(pwtr * 100 - Math.round(pwtr * 100)) > 1e-7) {
        throw new PopulationPlanningError(400, 'Current PWTR must be a two-decimal value at or above the coverage floor and strictly below the protected elite');
      }
      const ageBand = proposal.brief.planning.ageTargets!.bands.find((band) => age >= band.minimum && age <= band.maximum);
      trainer.ageBand = ageBand ? { minimum: ageBand.minimum, maximum: ageBand.maximum } : { minimum: age, maximum: age };
      trainer.ratingBandId = plan.inspection.ratingBands.find((band) => pwtr >= band.minimum && (band.maximumExclusive === null || pwtr < band.maximumExclusive))!.id;
    }
    const range = proposal.brief.pokemon.rosterSize;
    if (trainer.pokemon.length < (range?.minimum ?? 6) || trainer.pokemon.length > (range?.maximum ?? 24)) {
      throw new PopulationPlanningError(400, 'An edited roster must fit the explicit brief range');
    }
    trainer.specialOwnership = specialCounts(trainer);
    for (const kind of SPECIAL_OWNERSHIP_KINDS) {
      const setting = proposal.brief.pokemon.specialOwnership[kind];
      if (trainer.specialOwnership[kind] > (setting.chancePercent > 0 ? setting.count : 0)) {
        throw new PopulationPlanningError(400, `Edited ${kind} ownership exceeds the brief; review the brief explicitly`);
      }
    }
    const general = trainer.generalRatings;
    const basis = trainer.ratingBasis ?? { ...general, overallRating: trainer.fieldRatings.neutral_field_rating };
    if (basis.overallRating !== general.overallRating) {
      if (!refreshRatings) throw new PopulationPlanningError(409, 'Ability edits need a new review before application');
      trainer.formatRatings = familyValues(generateFormatRatingsFixed(general.overallRating, 0, 0), FORMAT_RATING_COLUMNS);
      trainer.mentalRatings = familyValues(generateMentalRatings(general.overallRating), MENTAL_RATING_COLUMNS);
      changes.push(`${trainer.key}: format and mental ratings refreshed for overall ${basis.overallRating} → ${general.overallRating}`);
    }
    trainer.ratingBasis = { ...general };
    for (let index = 0; index < trainer.pokemon.length; index += 1) {
      const member = trainer.pokemon[index];
      const stats = calculatePokemonStats(member.pokemonId, member.level, member.details);
      if (Object.entries(stats).some(([key, stat]) => member.details[key as keyof typeof stats] !== stat)) {
        changes.push(`${trainer.key}: Pokemon ${index + 1} stats recalculated from form, level, nature, IVs and EVs`);
      }
      Object.assign(member.details, stats);
    }
    const fieldRatings = generateFieldRatings(trainer.pokemon.map((member) => ({ species_id: member.speciesId,
      pokemon_id: member.pokemonId, level: member.level, is_mega: Number(member.isMega), is_gigantamax: Number(member.isGigantamax) })),
    { overall: general.overallRating, typing: general.typingRating, mixed: general.mixedRating, special: general.specialRating });
    if (orderedJson(fieldRatings) !== orderedJson(trainer.fieldRatings)) changes.push(`${trainer.key}: field ratings recalculated from the reviewed roster and general ratings`);
    trainer.fieldRatings = fieldRatings as PopulationTrainerProposal['fieldRatings'];
    trainer.notices = [];
    const name = `${trainer.profile.fname} ${trainer.profile.lname}`.trim().toLowerCase();
    if (names.has(name)) trainer.notices.push('Duplicate name: inspect identity before approval.');
    names.add(name);
    if (SPECIAL_OWNERSHIP_KINDS.some((kind) => trainer.specialOwnership[kind] > 0)) trainer.notices.push('Exceptional ownership: inspect special Pokemon before approval.');
    trainer.notices.forEach((notice) => warnings.add(notice));
    if (inactive && trainer.pokemon.some((member) => member.details.battlesWon + member.details.battlesLost + member.details.kills + member.details.deaths > 0)) {
      warnings.add('Inactive Pokemon counters include manually authored estimates; inspect them before approval. They are not event records.');
    }
  }
  const ratings = (inactive ? [] : plan.inspection.ratingBands).map((band) => ({ bandId: band.id,
    count: proposal.trainers.filter((trainer) => trainer.ratingBandId === band.id).length }));
  for (const band of ratings) {
    if (available && band.count > available.bands.find((candidate) => candidate.bandId === band.bandId)!.additionTarget) {
      throw new PopulationPlanningError(400, 'Edited ratings exceed the available regional rating-band budget');
    }
  }
  const ages = (isInactiveBrief(proposal.brief) ? [proposal.brief.ageRange] : proposal.brief.planning.ageTargets!.bands).map((band) => ({ minimum: band.minimum, maximum: band.maximum,
    count: proposal.trainers.filter((trainer) => trainer.age >= band.minimum && trainer.age <= band.maximum).length }));
  const outsideAgeBands = proposal.trainers.length - ages.reduce((sum, band) => sum + band.count, 0);
  if (outsideAgeBands > 0) warnings.add('Edited trainers fall outside the brief age bands; inspect their ages.');
  if (orderedJson(ratings) !== orderedJson(plan.batch!.ratingBands) || orderedJson(ages) !== orderedJson(plan.batch!.ageBands)) {
    warnings.add('Reviewed rating/age distributions differ from the generator allocation; exact edited values are shown.');
  }
  plan.unresolvedInputs = [];
  plan.batch!.ratingBands = ratings;
  plan.batch!.ageBands = ages;
  proposal.plan = plan;
  const specials = {} as PopulationProposal['summary']['specials'];
  for (const kind of SPECIAL_OWNERSHIP_KINDS) specials[kind] = {
    expectedTrainers: proposal.trainers.length * proposal.brief.pokemon.specialOwnership[kind].chancePercent / 100,
    actualTrainers: proposal.trainers.filter((trainer) => trainer.specialOwnership[kind] > 0).length,
    pokemonCount: proposal.trainers.reduce((sum, trainer) => sum + trainer.specialOwnership[kind], 0),
  };
  proposal.summary = { trainerCount: proposal.trainers.length,
    pokemonCount: proposal.trainers.reduce((sum, trainer) => sum + trainer.pokemon.length, 0),
    exceptionalTrainers: proposal.trainers.filter((trainer) => SPECIAL_OWNERSHIP_KINDS.some((kind) => trainer.specialOwnership[kind] > 0)).length,
    specials };
  proposal.notices = ['Unsaved population proposal. Apply only after reviewing these exact values.',
    'Local trainer keys bind database IDs at apply time; no existing trainers or history will be replaced.',
    inactive ? 'Pokemon counters started unrecorded at zero. Reviewed manual edits are authored estimates, not official historical results.'
      : 'Pokemon counters and acquisition dates are synthetic details, not official historical results.',
    'Displayed targets, ages, ownership counts and reports are rebuilt from validated records; Mythical competition eligibility remains undecided.'];
  parsePopulationArtifact(proposal, gameDate);
  return { version: 1, mode: 'review-only', proposal, reviewToken: reviewToken(proposal), changes, warnings: [...warnings],
    distributions: { ratings, ages, outsideAgeBands,
      strongest: [...proposal.trainers].sort((first, second) => inactive
        ? second.generalRatings.overallRating - first.generalRatings.overallRating : second.profile.pwtrRating! - first.profile.pwtrRating!).slice(0, 10)
        .map((trainer) => ({ key: trainer.key, name: `${trainer.profile.fname} ${trainer.profile.lname}`, pwtr: trainer.profile.pwtrRating,
          ...(inactive ? { ability: trainer.generalRatings.overallRating, estimatedPeakAbility: trainer.profile.estimatedPeakAbility, declinePoints: trainer.declinePoints } : {}) })),
      beforeActive: plan.inspection.counts.active, afterActive: plan.inspection.counts.active + (inactive ? 0 : proposal.trainers.length),
      ...(inactive ? { beforeInactive: source.trainers.filter((trainer) => trainer.active_status === 0).length,
        afterInactive: plan.inspection.counts.inactive + proposal.trainers.length,
        unknownOfficial: { currentPwtr: proposal.trainers.filter((trainer) => trainer.profile.pwtrRating === null).length,
          peakPwtr: proposal.trainers.filter((trainer) => trainer.profile.peakRating === null).length,
          peakRank: proposal.trainers.filter((trainer) => trainer.profile.peakRank === null).length,
          peakYear: proposal.trainers.filter((trainer) => trainer.profile.estimatedPeakAbilityYear == null).length } } : {}),
      protectedTrainers: plan.inspection.protection.members.length, ceilingExclusive: plan.inspection.protection.ceilingExclusive } };

}

export async function reviewPopulationProposal(database: sqlite3.Database, value: unknown): Promise<PopulationReview> {
  return buildReview(await readPopulationSource(database), unwrapPopulationArtifact(value), true);
}

export async function applySelectedPopulationProposal(selectedDatabase: sqlite3.Database, value: unknown): Promise<PopulationApplyResult> {
  const databases = await queryAll<{ name: string; file: string }>(selectedDatabase, 'PRAGMA database_list');
  const file = databases.find((database) => database.name === 'main')?.file;
  if (!file) throw new PopulationPlanningError(409, 'Population application requires a file-backed save');
  // Other requests use the selected handle. Their writes must not join this transaction.
  const database = await openDatabase(file, sqlite3.OPEN_READWRITE);
  try {
    await runStatement(database, 'PRAGMA foreign_keys = ON');
    return await applyPopulationProposal(database, value);
  } finally {
    await closeDatabase(database);
  }
}

export async function applyPopulationProposal(database: sqlite3.Database, value: unknown): Promise<PopulationApplyResult> {
  const input = populationObject(value, 'Apply input', ['proposal', 'reviewToken']);
  if (typeof input.reviewToken !== 'string' || !/^[a-f0-9]{64}$/.test(input.reviewToken)) {
    throw new PopulationPlanningError(400, 'A review token from the exact reviewed proposal is required');
  }
  if (input.proposal === undefined || reviewToken(input.proposal) !== input.reviewToken) {
    throw new PopulationPlanningError(409, 'The proposal changed after review; review the edited values again');
  }
  try {
    return await runInTransaction(database, async () => {
      const review = buildReview(await readPopulationSource(database), input.proposal, false);
      if (review.reviewToken !== input.reviewToken) throw new PopulationPlanningError(409, 'Derived values changed; review the proposal again before applying');
      const created: PopulationApplyResult['created'] = [];
      for (const trainer of review.proposal.trainers) {
        const trainerId = (await createManagementTrainer(database, trainer.profile)).lastInsertId;
        await addTrainerHometown(database, trainerId, trainer.profile.hometownCityId!);
        const ratingId = (await createGeneralRating(database, trainerId, trainer.ratingYear, trainer.generalRatings)).lastInsertId;
        await createPopulationRatingFamilies(database, ratingId, trainer);
        const pokemonIds: number[] = [];
        for (const member of trainer.pokemon) pokemonIds.push((await createGeneratedPokemonInstance(database, {
          trainerId, speciesId: member.speciesId, pokemonId: member.pokemonId, level: member.level,
          isMega: member.isMega, isGigantamax: member.isGigantamax, details: { ...member.details, otId: trainerId },
        })).lastInsertId);
        created.push({ key: trainer.key, trainerId, ratingId, pokemonIds });
      }
      return { mode: 'applied', proposalId: review.proposal.proposalId, reviewToken: input.reviewToken as string, created };
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && ['SQLITE_BUSY', 'SQLITE_LOCKED'].includes(String(error.code))) {
      throw new PopulationPlanningError(409, 'The database changed or is busy; inspect and review again');
    }
    throw error;
  }
}
