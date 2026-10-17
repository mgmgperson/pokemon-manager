import { parsePopulationProposalInput } from './trainer-population-inactive.validation';
import { Abilities } from '../../../reference-data/enums/abilities';
import { Items } from '../../../reference-data/enums/items';
import { Natures } from '../../../reference-data/enums/natures';
import { Pokemon } from '../../../reference-data/enums/pokemon';
import { Types } from '../../../reference-data/enums/types';
import { allPokemon } from '../../../reference-data/pokemon';
import { allSpecies } from '../../../reference-data/pokemon-species';
import { parseDateOnly, TrainerManagementError, validateNewTrainerProfile, validateRatingProposal,
  validateRosterPokemon } from '../management/trainer-management.service';
import { FIELD_RATING_COLUMNS, FORMAT_RATING_COLUMNS, MENTAL_RATING_COLUMNS } from '../trainer/trainer.types';
import { populationNumber, populationObject } from './trainer-population-proposal.validation';
import { isInactiveBrief, type PopulationProposal, type PopulationTrainerProposal, type PopulationProposalInput } from './trainer-population-proposal.types';
import { PopulationPlanningError } from './trainer-population.validation';

const DETAIL_KEYS = ['otName', 'nickname', 'happiness', 'gender', 'shiny', 'pokeballId', 'heldItemId',
  'experiencePoints', 'dateMetAt', 'levelMetAt', 'currentHp', 'currentStrength', 'statusId', 'battlesWon',
  'battlesLost', 'kills', 'deaths', 'trainingEfficiency', 'abilityId', 'natureId',
  'evHp', 'evAttack', 'evDefense', 'evSpecialAttack', 'evSpecialDefense', 'evSpeed',
  'ivHp', 'ivAttack', 'ivDefense', 'ivSpecialAttack', 'ivSpecialDefense', 'ivSpeed',
  'hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const;
const GENERAL_KEYS = ['overallRating', 'typingRating', 'mixedRating', 'specialRating'] as const;

export function unwrapPopulationArtifact(value: unknown): unknown {
  if (value && typeof value === 'object' && 'mode' in value && value.mode === 'review-only') {
    const review = populationObject(value, 'Review file', ['version', 'mode', 'proposal', 'reviewToken', 'changes', 'warnings', 'distributions']);
    if (review.version !== 1) throw new PopulationPlanningError(400, 'Unsupported population review version');
    return review.proposal;
  }
  return value;
}

function requiredObject(value: unknown, label: string, keys: readonly string[], optional: readonly string[] = []): Record<string, unknown> {
  const record = populationObject(value, label, keys);
  if (keys.some((key) => !optional.includes(key) && !Object.prototype.hasOwnProperty.call(record, key))) {
    throw new PopulationPlanningError(400, `${label} is incomplete`);
  }
  return record;
}

function text(value: unknown, label: string, maximum = 100): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum) {
    throw new PopulationPlanningError(400, `${label} must be non-empty text of at most ${maximum} characters`);
  }
  return value;
}

function ratings(value: unknown, columns: readonly string[], integer: boolean): void {
  const record = requiredObject(value, 'Rating family', columns);
  for (const column of columns) populationNumber(record[column], column, 0, 99, integer);
}

function trainerShape(value: unknown, gameDate: Date, brief: PopulationProposalInput): PopulationTrainerProposal {
  const record = requiredObject(value, 'Trainer', ['key', 'profile', 'nameGender', 'age', 'ratingBandId', 'ageBand',
    'typePreferences', 'ratingYear', 'generalRatings', 'ratingBasis', 'formatRatings', 'mentalRatings',
    'fieldRatings', 'pokemon', 'specialOwnership', 'notices', 'declinePoints'], ['ratingBasis', 'declinePoints']);
  const profile = requiredObject(record.profile, 'Profile', ['fname', 'lname', 'regionId', 'hometownCityId',
    'hometownName', 'birthdate', 'pwtrRating', 'peakRating', 'peakRank', 'activeStatus', 'estimatedPeakAbility', 'estimatedPeakAbilityYear'],
  ['estimatedPeakAbility', 'estimatedPeakAbilityYear']);
  text(record.key, 'Trainer key', 120);
  text(profile.fname, 'First name'); text(profile.lname, 'Last name');
  text(profile.hometownName, 'Hometown name', 1000); text(profile.birthdate, 'Birthdate');
  populationNumber(profile.hometownCityId, 'Hometown ID', 1, Number.MAX_SAFE_INTEGER, true);
  populationNumber(profile.regionId, 'Region ID', 1, Number.MAX_SAFE_INTEGER, true);
  if (profile.peakRank !== null || !isInactiveBrief(brief)) populationNumber(profile.peakRank, 'Peak rank', 1, Number.MAX_SAFE_INTEGER, true);
  if (record.nameGender !== 'M' && record.nameGender !== 'F') throw new PopulationPlanningError(400, 'Trainer nameGender must be M or F');
  if (!Array.isArray(record.typePreferences) || new Set(record.typePreferences).size !== record.typePreferences.length) {
    throw new PopulationPlanningError(400, 'Trainer type preferences must be an array of distinct IDs');
  }
  record.typePreferences.forEach((id: unknown) => populationNumber(id, 'Type preference', 1, Types.STELLAR, true));
  ratings(record.generalRatings, GENERAL_KEYS, true);
  if (record.ratingBasis !== undefined) ratings(record.ratingBasis, GENERAL_KEYS, true);
  ratings(record.formatRatings, FORMAT_RATING_COLUMNS, true);
  ratings(record.mentalRatings, MENTAL_RATING_COLUMNS, true);
  ratings(record.fieldRatings, FIELD_RATING_COLUMNS, false);
  populationNumber(record.ratingYear, 'Rating year', gameDate.getUTCFullYear(), gameDate.getUTCFullYear(), true);
  if (!Array.isArray(record.pokemon) || record.pokemon.length < 6 || record.pokemon.length > 24) {
    throw new PopulationPlanningError(400, 'Each trainer needs 6–24 complete Pokemon');
  }
  for (const pokemon of record.pokemon) {
    const member = requiredObject(pokemon, 'Pokemon', ['speciesId', 'pokemonId', 'name', 'level', 'typeIds', 'isMega', 'isGigantamax', 'details']);
    const details = requiredObject(member.details, 'Pokemon details', DETAIL_KEYS);
    text(details.otName, 'OT name', 201); text(details.nickname, 'Nickname');
    for (const entry of Object.values(details)) {
      if (typeof entry === 'number' && !Number.isSafeInteger(entry)) throw new PopulationPlanningError(400, 'Pokemon details require safe integer numbers');
    }
    if (typeof Abilities[details.abilityId as number] !== 'string' || typeof Natures[details.natureId as number] !== 'string'
      || typeof Items[details.pokeballId as number] !== 'string'
      || (details.pokeballId as number) > Items.CHERISH_BALL || (details.pokeballId as number) < Items.MASTER_BALL
      || (details.heldItemId !== 0 && typeof Items[details.heldItemId as number] !== 'string')) {
      throw new PopulationPlanningError(400, 'Pokemon details contain an unknown ability, nature, ball or held-item ID');
    }
  }
  // Shapes and primitive guards precede reuse of the existing domain validators.
  const trainer = record as unknown as PopulationTrainerProposal;
  validateNewTrainerProfile(trainer.profile, gameDate, isInactiveBrief(brief));
  validateRatingProposal(trainer.generalRatings);
  if (trainer.profile.activeStatus !== !isInactiveBrief(brief)) throw new PopulationPlanningError(400, 'Trainer activity must match the selected cohort');
  if (isInactiveBrief(brief)) {
    if (trainer.profile.estimatedPeakAbility == null) throw new PopulationPlanningError(400, 'An inactive proposal needs an estimated peak ability');
    populationNumber(record.declinePoints, 'Decline points', 0, 99, true);
    if (trainer.generalRatings.overallRating > trainer.profile.estimatedPeakAbility) throw new PopulationPlanningError(400, 'Current overall ability cannot exceed the estimated peak ability');
  } else if (record.declinePoints !== undefined) throw new PopulationPlanningError(400, 'Decline points apply to inactive proposals only');
  const speciesIds = new Set<number>();
  let ordinary = 0;
  for (const member of trainer.pokemon) {
    validateRosterPokemon(0, { id: 0, fname: trainer.profile.fname, lname: trainer.profile.lname,
      region_id: trainer.profile.regionId, birthdate: trainer.profile.birthdate, pwtr_rating: trainer.profile.pwtrRating,
      peak_rating: trainer.profile.peakRating, peak_rank: trainer.profile.peakRank, active_status: trainer.profile.activeStatus }, gameDate,
    { ...member, details: { ...member.details, otId: 0 } });
    const entity = allPokemon.find((candidate) => candidate.id === member.pokemonId)!;
    const species = allSpecies.find((candidate) => candidate.id === member.speciesId)!;
    if (speciesIds.has(member.speciesId)) throw new PopulationPlanningError(400, 'A trainer cannot have duplicate proposed species');
    speciesIds.add(member.speciesId);
    if (!species.isLegendary && !species.isMythical) ordinary += 1;
    if (JSON.stringify(member.typeIds) !== JSON.stringify(entity.types)
      || /_(MEGA(?:_|$)|GMAX$)/.test(Pokemon[member.pokemonId] ?? '')
      || (member.isMega && member.isGigantamax)
      || ((species.isLegendary || species.isMythical) && (member.isMega || member.isGigantamax))) {
      throw new PopulationPlanningError(400, 'Pokemon types or transformation flags are incompatible with this population roster contract');
    }
    for (const [enabled, kind] of [[member.isMega, 'MEGA'], [member.isGigantamax, 'GMAX']] as const) {
      if (enabled && (!entity.isDefault || !species.varieties.some((id) => (Pokemon[id] ?? '').includes(`_${kind}`)))) {
        throw new PopulationPlanningError(400, `Pokemon does not support ${kind}`);
      }
    }
    if (member.details.dateMetAt < trainer.profile.birthdate) throw new PopulationPlanningError(400, 'Pokemon acquisition cannot predate its trainer birthdate');
  }
  if (ordinary < 6) throw new PopulationPlanningError(400, 'The owned rotation needs six ordinary Pokemon; Mythical eligibility remains undecided');
  return trainer;
}

export function parsePopulationArtifact(value: unknown, gameDate: Date): PopulationProposal {
  try {
    const record = requiredObject(value, 'Population artifact', ['version', 'mode', 'proposalId', 'snapshot', 'brief', 'plan', 'trainers', 'summary', 'notices']);
    if ((record.version !== 1 && record.version !== 2) || record.mode !== 'preview-only') throw new PopulationPlanningError(400, 'Unsupported population artifact version or mode');
    text(record.proposalId, 'Proposal ID', 36);
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(record.proposalId as string)) {
      throw new PopulationPlanningError(400, 'Proposal ID must be a UUID');
    }
    const brief = parsePopulationProposalInput(record.brief);
    if (record.version !== (isInactiveBrief(brief) ? 2 : 1)) throw new PopulationPlanningError(400, 'The artifact version does not match its cohort');
    if (record.snapshot !== brief.snapshot) throw new PopulationPlanningError(400, 'Artifact and brief snapshots must agree');
    if (!Array.isArray(record.trainers) || record.trainers.length < 1 || record.trainers.length > (isInactiveBrief(brief) ? brief.batch.count : brief.planning.batch!.count)) {
      throw new PopulationPlanningError(400, 'Keep between one and the requested number of trainers; removal is allowed');
    }
    const trainers = record.trainers.map((trainer: unknown) => trainerShape(trainer, gameDate, brief));
    const keys = new Set<string>();
    for (const trainer of trainers) {
      if (!trainer.key.startsWith(`${record.proposalId}:`) || keys.has(trainer.key)) throw new PopulationPlanningError(400, 'Trainer keys must be unique and belong to this proposal');
      keys.add(trainer.key);
    }
    // Reports/notices/age-band metadata are display-only. Review rebuilds them from
    // current source facts and these validated records rather than trusting JSON.
    return { ...record, brief, trainers } as unknown as PopulationProposal;
  } catch (error) {
    if (error instanceof TrainerManagementError) throw new PopulationPlanningError(error.status, error.message);
    throw error;
  }
}
