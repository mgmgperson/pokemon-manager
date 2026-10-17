import type { PopulationPlanningInput } from './trainer-population.types';

export class PopulationPlanningError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

function object(value: unknown, label: string, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new PopulationPlanningError(400, `${label} must be an object`);
  }
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !keys.includes(key))) {
    throw new PopulationPlanningError(400, `${label} contains unsupported fields`);
  }
  return record;
}

function number(value: unknown, label: string, minimum: number, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum
    || (integer && !Number.isSafeInteger(value))) {
    throw new PopulationPlanningError(400, `${label} must be ${integer ? 'a safe integer' : 'finite'} >= ${minimum}`);
  }
  return value;
}

export function parsePopulationPlanningInput(value: unknown): PopulationPlanningInput {
  const input = object(value, 'Planning input', ['regionWeights', 'ageTargets', 'batch']);
  const parsed: PopulationPlanningInput = {};
  if (input.regionWeights !== undefined) {
    if (!Array.isArray(input.regionWeights) || input.regionWeights.length === 0) {
      throw new PopulationPlanningError(400, 'regionWeights must be a non-empty array');
    }
    parsed.regionWeights = input.regionWeights.map((entry: unknown) => {
      const weight = object(entry, 'Region weight', ['regionId', 'populationMultiplier', 'cultureMultiplier']);
      return {
        regionId: number(weight.regionId, 'regionId', 1, true),
        populationMultiplier: number(weight.populationMultiplier, 'populationMultiplier', 0),
        cultureMultiplier: number(weight.cultureMultiplier, 'cultureMultiplier', 0),
      };
    });
    if (new Set(parsed.regionWeights.map((weight) => weight.regionId)).size !== parsed.regionWeights.length) {
      throw new PopulationPlanningError(400, 'regionWeights contains duplicate regions');
    }
  }
  if (input.ageTargets !== undefined) {
    const ageTargets = object(input.ageTargets, 'ageTargets', ['scope', 'bands']);
    if (ageTargets.scope !== 'coverage' && ageTargets.scope !== 'all_active') {
      throw new PopulationPlanningError(400, 'Age scope must be coverage or all_active');
    }
    if (!Array.isArray(ageTargets.bands) || ageTargets.bands.length === 0) {
      throw new PopulationPlanningError(400, 'Age bands must be a non-empty array');
    }
    const bands = ageTargets.bands.map((entry: unknown) => {
      const band = object(entry, 'Age band', ['minimum', 'maximum', 'percentage']);
      const minimum = number(band.minimum, 'Minimum age', 12, true);
      const maximum = number(band.maximum, 'Maximum age', minimum, true);
      const percentage = number(band.percentage, 'Age percentage', 0);
      if (percentage > 100) throw new PopulationPlanningError(400, 'Age percentage must be <= 100');
      return { minimum, maximum, percentage };
    }).sort((left, right) => left.minimum - right.minimum);
    if (bands.some((band, index) => index > 0 && band.minimum <= bands[index - 1].maximum)) {
      throw new PopulationPlanningError(400, 'Age bands must not overlap');
    }
    if (Math.abs(bands.reduce((sum, band) => sum + band.percentage, 0) - 100) > 1e-6) {
      throw new PopulationPlanningError(400, 'Age percentages must total 100');
    }
    parsed.ageTargets = { scope: ageTargets.scope, bands };
  }
  if (input.batch !== undefined) {
    const batch = object(input.batch, 'batch', ['regionId', 'count']);
    parsed.batch = {
      regionId: number(batch.regionId, 'Batch regionId', 1, true),
      count: number(batch.count, 'Batch count', 1, true),
    };
  }
  return parsed;
}
