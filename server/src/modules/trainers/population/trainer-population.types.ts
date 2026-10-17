export interface PopulationRegionWeight {
  regionId: number;
  populationMultiplier: number;
  cultureMultiplier: number;
}

export interface PopulationAgeBand {
  minimum: number;
  maximum: number;
  percentage: number;
}

export interface PopulationPlanningInput {
  regionWeights?: PopulationRegionWeight[];
  ageTargets?: {
    scope: 'coverage' | 'all_active';
    bands: PopulationAgeBand[];
  };
  batch?: { regionId: number; count: number };
}

export interface PopulationCounts {
  total: number;
  active: number;
  inactive: number;
  unknownStatus: number;
  activeRated: number;
  activeUnrated: number;
  activeInvalidPwtr: number;
  activeInCoverage: number;
  activeBelowFloor: number;
  activeInvalidBirthdate: number;
}

export interface PopulationRatingBand {
  id: string;
  minimum: number;
  maximumExclusive: number | null;
  referenceCount: number;
  existing: number;
  deficit: number;
  excess: number;
  generationMaximumExclusive: number | null;
  eligibleAdditions: number;
  protectedShortfall: number;
}

export interface PopulationRegionSummary {
  id: number;
  name: string;
  population: number | null;
  populationShare: number | null;
  counts: PopulationCounts;
  cities: number;
  weightedHometowns: number;
  linkedCities: number;
  locations: number;
  validPolygons: number;
  forenameWeightsPresent: boolean;
  surnameWeightsPresent: boolean;
  issues: string[];
}

export interface PopulationInspection {
  version: 1;
  mode: 'planning-only';
  snapshot: string;
  databaseFile: string;
  gameDate: string;
  ratingFloor: number;
  pokemonPreferences: Record<'types' | 'generations' | 'fields', Array<{ id: number; name: string }>>;
  referenceCount: number;
  counts: PopulationCounts;
  referenceProjection: { additions: number; active: number; inCoverage: number };
  protection: {
    requiredCount: number;
    members: Array<{ id: number; name: string; pwtr: number }>;
    ceilingExclusive: number | null;
    boundaryTie: boolean;
    ready: boolean;
  };
  ratingBands: PopulationRatingBand[];
  regions: PopulationRegionSummary[];
  ageCounts: Array<{ age: number; allActive: number; inCoverage: number }>;
  activeWithoutRegion: number;
  issues: string[];
}

export interface PopulationRegionalBandPlan {
  bandId: string;
  referenceCount: number;
  existing: number;
  deficit: number;
  excess: number;
  additionTarget: number;
  projected: number;
}

export interface PopulationPlan {
  inactiveCohort?: { beforeInactive: number; afterInactive: number; ageRange: { minimum: number; maximum: number }; };
  inspection: PopulationInspection;
  settings: PopulationPlanningInput;
  unresolvedInputs: string[];
  allocationMethod: string;
  regionalTargets: Array<{
    regionId: number;
    bands: PopulationRegionalBandPlan[];
    additionTarget: number;
    projectedActiveInCoverage: number;
  }> | null;
  ageTargets: {
    scope: 'coverage' | 'all_active';
    finalPopulation: number;
    outsideBands: number;
    invalidBirthdates: number;
    bands: Array<PopulationAgeBand & { target: number; existing: number; deficit: number; excess: number }>;
  } | null;
  batch: {
    regionId: number;
    count: number;
    ratingBands: Array<{ bandId: string; count: number }>;
    ageBands: Array<{ minimum: number; maximum: number; count: number }> | null;
    projectedActive: number;
    projectedActiveInCoverage: number;
    projectedWorldwideActive: number;
    projectedWorldwideActiveInCoverage: number;
    issues: string[];
  } | null;
}
