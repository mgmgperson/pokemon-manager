import { Fields } from '../../../reference-data/enums/fields';
import { Types } from '../../../reference-data/enums/types';
import { parsePopulationPlanningInput, PopulationPlanningError } from './trainer-population.validation';
import { SPECIAL_OWNERSHIP_KINDS, type ActivePopulationProposalInput, type SpecialOwnershipSettings } from './trainer-population-proposal.types';

export function populationObject(value: unknown, label: string, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new PopulationPlanningError(400, `${label} must be an object`);
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !keys.includes(key))) throw new PopulationPlanningError(400, `${label} contains unsupported fields`);
  return input;
}

export function populationNumber(value: unknown, label: string, minimum: number, maximum: number, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum
    || (integer && !Number.isInteger(value))) throw new PopulationPlanningError(400, `${label} must be ${integer ? 'a whole number' : 'finite'} between ${minimum} and ${maximum}`);
  return value;
}

const object = populationObject;
const bounded = populationNumber;

function ids(value: unknown, label: string, maximum: number): number[] {
  if (!Array.isArray(value)) throw new PopulationPlanningError(400, `${label} must be an explicit array; use [] for no preference`);
  const values = value.map((id: unknown) => bounded(id, label, 1, maximum, true));
  if (new Set(values).size !== values.length) throw new PopulationPlanningError(400, `${label} contains duplicate IDs`);
  return values;
}

export function parseActivePopulationProposalInput(value: unknown): ActivePopulationProposalInput {
  const input = object(value, 'Proposal input', ['snapshot', 'planning', 'ageRatingBias', 'nameGender', 'pokemon']);
  if (typeof input.snapshot !== 'string' || !/^[a-f0-9]{64}$/.test(input.snapshot)) throw new PopulationPlanningError(400, 'A valid reviewed planning snapshot is required');
  const planning = parsePopulationPlanningInput(input.planning);
  if (!planning.regionWeights || !planning.ageTargets || !planning.batch) throw new PopulationPlanningError(400, 'Complete regional, age and batch planning settings are required');
  if (planning.batch.count > 100) throw new PopulationPlanningError(400, 'Preview at most 100 trainers per proposal');
  if (input.nameGender !== 'random' && input.nameGender !== 'M' && input.nameGender !== 'F') throw new PopulationPlanningError(400, 'nameGender must be random, M or F');
  return {
    snapshot: input.snapshot, planning,
    ageRatingBias: bounded(input.ageRatingBias, 'ageRatingBias', 0, 1),
    nameGender: input.nameGender,
    pokemon: parsePopulationPokemonSettings(input.pokemon),
  };
}

export function parsePopulationPokemonSettings(value: unknown): ActivePopulationProposalInput['pokemon'] {
  const pokemon = object(value, 'Pokemon settings', ['types', 'generations', 'fields', 'specialistPercentage', 'dualTypePercentage', 'rosterSize', 'specialOwnership']);
  let rosterSize: ActivePopulationProposalInput['pokemon']['rosterSize'] = null;
  if (pokemon.rosterSize !== null) {
    const range = object(pokemon.rosterSize, 'rosterSize', ['minimum', 'maximum']);
    const minimum = bounded(range.minimum, 'Minimum roster size', 6, 24, true);
    rosterSize = { minimum, maximum: bounded(range.maximum, 'Maximum roster size', minimum, 24, true) };
  }
  const specialInput = object(pokemon.specialOwnership, 'specialOwnership', SPECIAL_OWNERSHIP_KINDS);
  const specialOwnership = {} as SpecialOwnershipSettings;
  for (const kind of SPECIAL_OWNERSHIP_KINDS) {
    const choice = object(specialInput[kind], kind, ['chancePercent', 'count']);
    specialOwnership[kind] = {
      chancePercent: bounded(choice.chancePercent, `${kind} chancePercent`, 0, 100),
      count: bounded(choice.count, `${kind} count`, 0, 24, true),
    };
    if (specialOwnership[kind].chancePercent > 0 && specialOwnership[kind].count === 0) throw new PopulationPlanningError(400, `${kind} needs a positive count when its chance is positive`);
  }
  const possible = (kind: typeof SPECIAL_OWNERSHIP_KINDS[number]): number => specialOwnership[kind].chancePercent > 0 ? specialOwnership[kind].count : 0;
  const requiredRoster = Math.max(6 + possible('legendary') + possible('mythical'),
    SPECIAL_OWNERSHIP_KINDS.reduce((sum, kind) => sum + possible(kind), 0));
  if (requiredRoster > (rosterSize?.maximum ?? 24)) throw new PopulationPlanningError(400, 'The roster limit cannot fit all permitted special slots and six ordinary Pokemon');
  return {
      types: ids(pokemon.types, 'types', Types.STELLAR) as Types[],
      generations: ids(pokemon.generations, 'generations', 9),
      fields: ids(pokemon.fields, 'fields', Fields.NEW_WORLD) as Fields[],
      specialistPercentage: bounded(pokemon.specialistPercentage, 'specialistPercentage', 0, 100),
      dualTypePercentage: bounded(pokemon.dualTypePercentage, 'dualTypePercentage', 0, 100),
      rosterSize, specialOwnership,
  };
}
