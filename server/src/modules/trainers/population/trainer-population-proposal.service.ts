import { randomUUID } from 'crypto';
import sqlite3 from 'sqlite3';
import { generateGeneralRatings } from '../../../generators/generalRatingGenerator';
import { generateFormatRatingsFixed } from '../../../generators/formatRatingGenerator';
import { generateMentalRatings } from '../../../generators/mentalRatingGenerator';
import { generateFieldRatings } from '../../../generators/fieldRatingGenerator';
import { generateName } from '../../../generators/nameGenerator';
import { generateTrainerCareerPeak } from '../../../generators/trainerGenerator';
import { weightedSampleTypes } from '../../../generators/populateTrainerGenerator';
import { generatePokemonTeam, generatePokemonTeamSize, type PokemonGenerationSlot } from '../../../generators/pokemonGenerator';
import { generatePokemonDetails } from '../../../generators/pokemonSetGenerator';
import { allSpecies } from '../../../reference-data/pokemon-species';
import { calculateAge, generateBirthdate } from '../management/trainer-management.service';
import type { GeneralRatingProposal, NewTrainerProfileProposal, TrainerProfileProposal, NumericRange } from '../management/trainer-management.types';
import { FIELD_RATING_COLUMNS, FORMAT_RATING_COLUMNS, MENTAL_RATING_COLUMNS } from '../trainer/trainer.types';
import { readPopulationSource, type PopulationSource } from './trainer-population.repository';
import { inspectTrainerPopulation, planTrainerPopulationFromSource } from './trainer-population.service';
import { PopulationPlanningError } from './trainer-population.validation';
import { parseActivePopulationProposalInput } from './trainer-population-proposal.validation';
import { isInactiveBrief, SPECIAL_OWNERSHIP_KINDS, type PopulationProposal, type ActivePopulationProposalInput,
  type PopulationTrainerProposal, type PopulationProposalInput, type SpecialOwnershipKind } from './trainer-population-proposal.types';
import type { PopulationPlan, PopulationRatingBand } from './trainer-population.types';

export function chooseWeighted<T>(choices: readonly T[], weights: readonly number[]): T {
  const maximum = Math.max(...weights);
  if (choices.length === 0 || maximum <= 0 || !Number.isFinite(maximum)) throw new PopulationPlanningError(409, 'No usable weighted generation choices remain');
  const normalized = weights.map((weight) => weight / maximum);
  let draw = Math.random() * normalized.reduce((sum, weight) => sum + weight, 0);
  for (let index = 0; index < choices.length; index += 1) {
    draw -= normalized[index];
    if (draw < 0) return choices[index];
  }
  return choices[choices.length - 1];
}

function ratingValues<Column extends string>(source: object, columns: readonly Column[]): Record<Column, number> {
  const values = {} as Record<Column, number>;
  const record = source as Record<string, unknown>;
  for (const column of columns) {
    const value = record[column];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 99) {
      throw new PopulationPlanningError(409, `The rating generator returned an invalid ${column}`);
    }
    values[column] = value;
  }
  return values;
}

function drawSpecials(input: Pick<ActivePopulationProposalInput, 'pokemon'>): Record<SpecialOwnershipKind, number> {
  const counts = {} as Record<SpecialOwnershipKind, number>;
  for (const kind of SPECIAL_OWNERSHIP_KINDS) {
    const setting = input.pokemon.specialOwnership[kind];
    counts[kind] = Math.random() * 100 < setting.chancePercent ? setting.count : 0;
  }
  return counts;
}

function rosterSlots(input: Pick<ActivePopulationProposalInput, 'pokemon'>, counts: Record<SpecialOwnershipKind, number>): PokemonGenerationSlot[] {
  const specialCount = SPECIAL_OWNERSHIP_KINDS.reduce((sum, kind) => sum + counts[kind], 0);
  const minimum = Math.max(6 + counts.legendary + counts.mythical, specialCount);
  const range = input.pokemon.rosterSize;
  const size = range ? Math.max(range.minimum, minimum)
    + Math.floor(Math.random() * (range.maximum - Math.max(range.minimum, minimum) + 1))
    : generatePokemonTeamSize(minimum, 24);
  const slots: PokemonGenerationSlot[] = [];
  // Allocate the restricted form pools before ordinary selections consume them.
  for (const kind of ['mega', 'gmax', 'legendary', 'mythical'] as const) {
    for (let index = 0; index < counts[kind]; index += 1) slots.push({
      rarity: kind === 'legendary' || kind === 'mythical' ? kind : 'normal',
      mega: kind === 'mega', gmax: kind === 'gmax',
    });
  }
  while (slots.length < size) slots.push({ rarity: 'normal', mega: false, gmax: false });
  return slots;
}

export function nameCache(source: PopulationSource): { nameFrequenciesByRegion: Map<string, Array<{ country: string; frequency: number }>> } {
  const frequencies = new Map<string, Array<{ country: string; frequency: number }>>();
  for (const frequency of source.nameFrequencies) {
    const key = `${frequency.region_id}_${frequency.type}`;
    const rows = frequencies.get(key) ?? [];
    rows.push({ country: frequency.country, frequency: frequency.frequency });
    frequencies.set(key, rows);
  }
  return { nameFrequenciesByRegion: frequencies };
}

export function normalizedName(first: string | null, last: string | null): string {
  return [first, last].filter(Boolean).join(' ').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function requireReadyRegion(source: PopulationSource, plan: PopulationPlan): void {
  const region = plan.inspection.regions.find((candidate) => candidate.id === plan.batch!.regionId)!;
  if (!region.forenameWeightsPresent || !region.surnameWeightsPresent || region.weightedHometowns === 0) {
    throw new PopulationPlanningError(409, 'The selected region needs usable hometown populations and regional name weights');
  }
  if (source.nameFrequencies.some((row) => row.region_id === region.id
    && (!Number.isFinite(row.frequency) || row.frequency < 0 || !row.country?.trim()))) {
    throw new PopulationPlanningError(409, 'The selected region has invalid naming weights');
  }
}

export function pairPopulationAgeBands(plan: PopulationPlan, bias: number): Array<{ ratingBand: PopulationRatingBand; ageBand: NumericRange }> {
  if (!plan.batch?.ageBands || !Number.isFinite(bias) || bias < 0 || bias > 1) {
    throw new PopulationPlanningError(400, 'Age/rating pairing requires age counts and a bias between 0 and 1');
  }
  const availableAges = plan.batch.ageBands.map((band) => ({ ...band }));
  const minimumAge = Math.min(...availableAges.map((band) => band.minimum));
  const maximumAge = Math.max(...availableAges.map((band) => band.maximum));
  return plan.batch.ratingBands.flatMap((count) => {
    const ratingBand = plan.inspection.ratingBands.find((band) => band.id === count.bandId)!;
    const strength = Math.max(0, Math.min(1, (ratingBand.minimum - plan.inspection.ratingFloor)
      / Math.max(1, plan.inspection.protection.ceilingExclusive! - plan.inspection.ratingFloor)));
    return Array.from({ length: count.count }, () => {
      const age = chooseWeighted(availableAges, availableAges.map((band) => band.count * Math.exp(bias * strength
        * ((band.minimum + band.maximum) / 2 - minimumAge) / Math.max(1, maximumAge - minimumAge))));
      age.count -= 1;
      return { ratingBand, ageBand: { minimum: age.minimum, maximum: age.maximum } };
    });
  });
}

export function generatePopulationRatings(pwtr: number | null, year: number, currentAbility?: number): Pick<PopulationTrainerProposal, 'generalRatings' | 'ratingBasis' | 'formatRatings' | 'mentalRatings'> {
  const general = generateGeneralRatings(0, pwtr, year, currentAbility);
  const generalRatings = { overallRating: general.overall_rating, typingRating: general.typing_rating,
    mixedRating: general.mixed_rating, specialRating: general.special_rating };
  const formatRatings = ratingValues(generateFormatRatingsFixed(general.overall_rating, 0, 0), FORMAT_RATING_COLUMNS);
  const mentalRatings = ratingValues(generateMentalRatings(general.overall_rating), MENTAL_RATING_COLUMNS);
  return { generalRatings, ratingBasis: { ...generalRatings }, formatRatings, mentalRatings };
}

export function generatePopulationRoster(profile: TrainerProfileProposal, gameDate: string, brief: PopulationProposalInput,
  general: GeneralRatingProposal): Pick<PopulationTrainerProposal, 'typePreferences' | 'specialOwnership' | 'pokemon' | 'fieldRatings'> {
  const specialist = Math.random() * 100 < brief.pokemon.specialistPercentage;
  const typePreferences = specialist ? (brief.pokemon.types.length > 0 ? [...brief.pokemon.types]
    : weightedSampleTypes(Math.random() * 100 < brief.pokemon.dualTypePercentage ? 2 : 1)) : [];
  const specialOwnership = drawSpecials(brief);
  const teamSlots = rosterSlots(brief, specialOwnership);
  let team;
  try {
    team = generatePokemonTeam(general.overallRating, typePreferences, brief.pokemon.generations, brief.pokemon.fields,
      { teamSize: teamSlots.length, uniqueSpecies: true, specialSlots: teamSlots });
  } catch (error) {
    throw new PopulationPlanningError(409, error instanceof Error ? error.message : 'The configured roster could not be generated');
  }
  if (team.length !== teamSlots.length) throw new PopulationPlanningError(409, 'The roster generator returned an incomplete team');
  const pokemon = team.map((member) => {
    const { otId: _unassignedTrainerId, ...details } = generatePokemonDetails({
      trainerId: 0, trainerFirstName: profile.fname, trainerLastName: profile.lname, trainerBirthdate: profile.birthdate,
      trainerPwtrRating: profile.pwtrRating, gameDate, speciesId: member.species_id,
      ...(isInactiveBrief(brief) ? { battleCounterMode: brief.battleCounters } : {}),
      pokemonId: member.pokemon_id, level: member.level, rosterLevels: team.map((candidate) => candidate.level),
    });
    return { speciesId: member.species_id, pokemonId: member.pokemon_id, name: member.name,
      level: member.level, typeIds: member.types, isMega: member.is_mega, isGigantamax: member.is_gigantamax, details };
  });
  const ordinaryCount = team.filter((member) => {
    const species = allSpecies.find((candidate) => candidate.id === member.species_id)!;
    return !species.isLegendary && !species.isMythical;
  }).length;
  if (ordinaryCount < 6) throw new PopulationPlanningError(409, 'The proposed rotation needs at least six ordinary Pokemon');
  const fieldRatings = ratingValues(generateFieldRatings(team.map((member) => ({ ...member,
    is_mega: Number(member.is_mega), is_gigantamax: Number(member.is_gigantamax) })), {
    overall: general.overallRating, typing: general.typingRating, mixed: general.mixedRating, special: general.specialRating,
  }), FIELD_RATING_COLUMNS);
  return { typePreferences, specialOwnership, pokemon, fieldRatings };
}

export async function generatePopulationTrainer(database: sqlite3.Database, source: PopulationSource, plan: PopulationPlan,
  brief: ActivePopulationProposalInput, band: PopulationRatingBand, ageBand: NumericRange, key: string, usedNames: Set<string>): Promise<PopulationTrainerProposal> {
  requireReadyRegion(source, plan);
  const gameDate = new Date(`${plan.inspection.gameDate}T00:00:00.000Z`);
  const gameYear = gameDate.getUTCFullYear();
  const regionId = plan.batch!.regionId;
  const cities = source.cities.filter((city) => city.region_id === regionId
    && Number.isSafeInteger(city.population) && city.population! > 0);
  const cache = nameCache(source);

  const birthdate = generateBirthdate(ageBand, gameDate);
  const age = calculateAge(new Date(`${birthdate}T00:00:00.000Z`), gameDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate) || age < ageBand.minimum || age > ageBand.maximum) {
    throw new PopulationPlanningError(400, 'The configured age range cannot be represented as valid birthdates in this save');
  }
  const lower = Math.ceil(band.minimum * 100);
  const upper = Math.ceil(band.generationMaximumExclusive! * 100) - 1;
  if (upper < lower) throw new PopulationPlanningError(409, 'A planned rating band has no available two-decimal PWTR values');
  const pwtr = (lower + Math.floor(Math.random() * (upper - lower + 1))) / 100;
  const gender = brief.nameGender === 'random' ? (Math.random() < 0.5 ? 'M' : 'F') : brief.nameGender;
  const name = await generateName(database, regionId, gender, cache);
  if (!name.fname?.trim() || !name.lname?.trim()) {
    throw new PopulationPlanningError(409, 'The region produced an incomplete name; check its configured countries against the static names database');
  }
  const hometown = chooseWeighted(cities, cities.map((city) => city.population!));
  const careerPeak = generateTrainerCareerPeak(age, pwtr);
  const profile: NewTrainerProfileProposal = { fname: name.fname, lname: name.lname, regionId, hometownCityId: hometown.id, hometownName: hometown.name,
    birthdate, pwtrRating: pwtr, peakRating: careerPeak.peak_rating, peakRank: careerPeak.peak_rank, activeStatus: true };
  const { generalRatings, formatRatings, mentalRatings, ratingBasis } = generatePopulationRatings(pwtr, gameYear);
  const { typePreferences, specialOwnership, pokemon, fieldRatings } = generatePopulationRoster(profile, plan.inspection.gameDate, brief, generalRatings);
  const notices: string[] = [];
  const fullName = normalizedName(name.fname, name.lname);
  if (usedNames.has(fullName)) notices.push('This name matches another trainer; inspect identity before approval.');
  usedNames.add(fullName);
  if (SPECIAL_OWNERSHIP_KINDS.some((kind) => specialOwnership[kind] > 0)) notices.push('Exceptional ownership: inspect every special Pokemon before approval.');
  return { key, profile, nameGender: gender, age, ageBand: { minimum: ageBand.minimum, maximum: ageBand.maximum },
  ratingBandId: band.id, typePreferences, ratingYear: gameYear, generalRatings, ratingBasis, formatRatings, mentalRatings,
  fieldRatings, pokemon, specialOwnership, notices };
}

export async function createActivePopulationProposal(database: sqlite3.Database, value: unknown): Promise<PopulationProposal> {
  const brief = parseActivePopulationProposalInput(value);
  const source = await readPopulationSource(database);
  const plan = planTrainerPopulationFromSource(source, brief.planning);
  if (plan.inspection.snapshot !== brief.snapshot) throw new PopulationPlanningError(409, 'The population planning snapshot is stale; inspect and review again');
  if (!plan.batch?.ageBands || !plan.ageTargets || !plan.inspection.protection.ready) {
    throw new PopulationPlanningError(409, 'A complete, protected rating/age plan is required');
  }
  plan.unresolvedInputs = [];
  requireReadyRegion(source, plan);
  const usedNames = new Set(source.trainers.map((trainer) => normalizedName(trainer.fname, trainer.lname)));
  const pairs = pairPopulationAgeBands(plan, brief.ageRatingBias);
  const proposalId = randomUUID();
  const trainers: PopulationTrainerProposal[] = [];
  for (const { ratingBand, ageBand } of pairs) {
    trainers.push(await generatePopulationTrainer(database, source, plan, brief, ratingBand, ageBand, `${proposalId}:${trainers.length + 1}`, usedNames));
  }
  if ((await inspectTrainerPopulation(database)).snapshot !== brief.snapshot) {
    throw new PopulationPlanningError(409, 'The save changed during proposal generation; inspect and review again');
  }
  const specials = {} as PopulationProposal['summary']['specials'];
  for (const kind of SPECIAL_OWNERSHIP_KINDS) specials[kind] = {
    expectedTrainers: trainers.length * brief.pokemon.specialOwnership[kind].chancePercent / 100,
    actualTrainers: trainers.filter((trainer) => trainer.specialOwnership[kind] > 0).length,
    pokemonCount: trainers.reduce((sum, trainer) => sum + trainer.specialOwnership[kind], 0),
  };
  return { version: 1, mode: 'preview-only', proposalId, snapshot: brief.snapshot, brief, plan, trainers,
    summary: { trainerCount: trainers.length, pokemonCount: trainers.reduce((sum, trainer) => sum + trainer.pokemon.length, 0),
      exceptionalTrainers: trainers.filter((trainer) => SPECIAL_OWNERSHIP_KINDS.some((kind) => trainer.specialOwnership[kind] > 0)).length,
      specials },
    notices: [
      'No trainer, rating or Pokemon has been saved. Review these generated estimates before approval.',
      'Local trainer keys bind ownership later; database trainer/rating/OT ids have not been allocated.',
      'Special-category draws are independent per trainer; each category count is explicit and categories occupy distinct Pokemon.',
      'Age/rating bias softly weights the remaining age-band counts by exp(bias * rating position * relative age). It preserves both planned margins and has no hard youth ceiling or veteran penalty.',
      brief.pokemon.rosterSize === null
        ? 'The existing weighted roster distribution is conditioned on enough room for six ordinary Pokemon and the drawn special slots.'
        : 'The explicit roster-size range is sampled uniformly after reserving room for six ordinary Pokemon and the drawn special slots.',
      'Pokemon acquisition dates and battle counters are generated details, not official historical competition records.',
      'Review/export this proposal through the population review workflow before applying; this generation endpoint does not save records.',
    ] };
}

export async function reviewPopulationBrief(database: sqlite3.Database, value: unknown): Promise<{ brief: ActivePopulationProposalInput; plan: PopulationPlan }> {
  const brief = parseActivePopulationProposalInput(value);
  const plan = planTrainerPopulationFromSource(await readPopulationSource(database), brief.planning);
  if (plan.inspection.snapshot !== brief.snapshot) throw new PopulationPlanningError(409, 'The save changed; refresh inspection before loading a brief');
  return { brief, plan };
}
