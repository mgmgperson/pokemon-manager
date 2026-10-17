import { populationNumber, populationObject, parseActivePopulationProposalInput, parsePopulationPokemonSettings } from './trainer-population-proposal.validation';
import type { InactivePopulationProposalInput, PopulationProposalInput } from './trainer-population-proposal.types';
import type { NumericRange } from '../management/trainer-management.types';
import { PopulationPlanningError } from './trainer-population.validation';

export function populationRange(value: unknown, label: string, minimum: number, maximum: number): NumericRange {
  const range = populationObject(value, label, ['minimum', 'maximum']);
  const lower = populationNumber(range.minimum, `${label} minimum`, minimum, maximum, true);
  return { minimum: lower, maximum: populationNumber(range.maximum, `${label} maximum`, lower, maximum, true) };
}

export function parsePopulationProposalInput(value: unknown): PopulationProposalInput {
  if (!value || typeof value !== 'object' || !('cohort' in value)) return parseActivePopulationProposalInput(value);
  const input = populationObject(value, 'Inactive brief', ['cohort', 'battleCounters', 'snapshot', 'batch', 'ageRange', 'peakAbility', 'declinePoints', 'peakYear', 'nameGender', 'pokemon']);
  if (input.cohort !== 'inactive') throw new PopulationPlanningError(400, 'Unsupported population cohort');
  if (typeof input.snapshot !== 'string' || !/^[a-f0-9]{64}$/.test(input.snapshot)) throw new PopulationPlanningError(400, 'A valid reviewed population snapshot is required');
  if (input.nameGender !== 'random' && input.nameGender !== 'M' && input.nameGender !== 'F') throw new PopulationPlanningError(400, 'Choose nameGender explicitly');
  if (input.battleCounters !== 'unrecorded-zero') throw new PopulationPlanningError(400, 'Choose the unrecorded-zero Pokemon counter policy explicitly; estimates can be authored during review');
  const batch = populationObject(input.batch, 'Inactive batch', ['regionId', 'count']);
  const peakAbility = populationRange(input.peakAbility, 'Peak ability', 0, 99);
  const declinePoints = populationRange(input.declinePoints, 'Decline points', 0, 99);
  if (declinePoints.maximum > peakAbility.minimum) throw new PopulationPlanningError(400, 'Maximum decline points cannot exceed minimum peak ability; no negative current ability is generated');
  const brief: InactivePopulationProposalInput = { cohort: 'inactive', battleCounters: input.battleCounters, snapshot: input.snapshot,
    batch: { regionId: populationNumber(batch.regionId, 'Region', 1, Number.MAX_SAFE_INTEGER, true), count: populationNumber(batch.count, 'Batch count', 1, 100, true) },
    ageRange: populationRange(input.ageRange, 'Inactive ages', 0, 9999), peakAbility, declinePoints,
    peakYear: input.peakYear === null ? null : populationRange(input.peakYear, 'Estimated peak years', 0, 9999),
    nameGender: input.nameGender, pokemon: parsePopulationPokemonSettings(input.pokemon) };
  return brief;
}
