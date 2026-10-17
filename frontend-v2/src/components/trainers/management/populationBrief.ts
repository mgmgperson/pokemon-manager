import { isInactiveBrief, specialKinds, type InactivePopulationBrief, type PopulationBrief, type PopulationInspection, type PopulationPlanningInput, type SpecialKind } from './populationData';

export interface PopulationBriefDraft {
  cohort: 'active' | 'inactive'; battleCounters: '' | 'unrecorded-zero';
  inactiveAgeMinimum: string; inactiveAgeMaximum: string; peakMinimum: string; peakMaximum: string;
  declineMinimum: string; declineMaximum: string; peakYearMode: '' | 'unknown' | 'range'; peakYearMinimum: string; peakYearMaximum: string;
  regionId: string; count: string;
  weights: Record<string, { population: string; culture: string }>;
  ageScope: '' | 'coverage' | 'all_active';
  ages: Array<{ minimum: string; maximum: string; percentage: string }>;
  ageRatingBias: string; nameGender: '' | 'random' | 'M' | 'F';
  preferenceMode: '' | 'none' | 'custom'; types: number[]; generations: number[]; fields: number[];
  specialist: string; dualType: string; rosterMode: '' | 'weighted' | 'range'; rosterMinimum: string; rosterMaximum: string;
  specials: Record<SpecialKind, { chance: string; count: string }>;
}
export function emptyPopulationBrief(): PopulationBriefDraft {
  return { cohort: 'active', battleCounters: '', inactiveAgeMinimum: '', inactiveAgeMaximum: '', peakMinimum: '', peakMaximum: '',
    declineMinimum: '', declineMaximum: '', peakYearMode: '', peakYearMinimum: '', peakYearMaximum: '', regionId: '', count: '', weights: {}, ageScope: '', ages: [{ minimum: '', maximum: '', percentage: '' }],
    ageRatingBias: '', nameGender: '', preferenceMode: '', types: [], generations: [], fields: [], specialist: '', dualType: '',
    rosterMode: '', rosterMinimum: '', rosterMaximum: '', specials: {
      legendary: { chance: '', count: '' }, mythical: { chance: '', count: '' }, mega: { chance: '', count: '' }, gmax: { chance: '', count: '' },
    } };
}
function requiredNumber(value: string, label: string): number {
  if (!value.trim() || !Number.isFinite(Number(value))) throw new Error(`${label} needs an explicit number.`);
  return Number(value);
}
export function populationPlanningInput(draft: PopulationBriefDraft, inspection: PopulationInspection): PopulationPlanningInput | InactivePopulationBrief {
  if (draft.cohort === 'inactive') {
    const brief = populationBriefInput(draft, inspection);
    if (isInactiveBrief(brief)) return brief;
  }
  if (!draft.ageScope) throw new Error('Choose which active population the age targets cover.');
  return {
    regionWeights: inspection.regions.map((region) => ({ regionId: region.id,
      populationMultiplier: requiredNumber(draft.weights[region.id]?.population ?? '', `${region.name} population multiplier`),
      cultureMultiplier: requiredNumber(draft.weights[region.id]?.culture ?? '', `${region.name} culture multiplier`) })),
    ageTargets: { scope: draft.ageScope, bands: draft.ages.map((band, index) => ({
      minimum: requiredNumber(band.minimum, `Age band ${index + 1} minimum`), maximum: requiredNumber(band.maximum, `Age band ${index + 1} maximum`),
      percentage: requiredNumber(band.percentage, `Age band ${index + 1} share`) })) },
    batch: { regionId: requiredNumber(draft.regionId, 'Batch region'), count: requiredNumber(draft.count, 'Batch count') },
  };
}
export function populationBriefInput(draft: PopulationBriefDraft, inspection: PopulationInspection): PopulationBrief {
  if (!draft.nameGender || !draft.preferenceMode || !draft.rosterMode) throw new Error('Choose name, Pokémon preference and roster-size settings explicitly.');
  const specialOwnership = {} as PopulationBrief['pokemon']['specialOwnership'];
  for (const kind of specialKinds) specialOwnership[kind] = {
    chancePercent: requiredNumber(draft.specials[kind].chance, `${kind} chance`), count: requiredNumber(draft.specials[kind].count, `${kind} count`),
  };
  const pokemon: PopulationBrief['pokemon'] = {
    types: draft.preferenceMode === 'none' ? [] : draft.types, generations: draft.preferenceMode === 'none' ? [] : draft.generations,
    fields: draft.preferenceMode === 'none' ? [] : draft.fields,
    specialistPercentage: requiredNumber(draft.specialist, 'Specialist share'), dualTypePercentage: requiredNumber(draft.dualType, 'Dual-type share'),
    rosterSize: draft.rosterMode === 'weighted' ? null : { minimum: requiredNumber(draft.rosterMinimum, 'Minimum roster size'), maximum: requiredNumber(draft.rosterMaximum, 'Maximum roster size') }, specialOwnership };
  if (draft.cohort === 'inactive') {
    if (!draft.battleCounters) throw new Error('Choose the Pokemon counter policy explicitly.');
    if (!draft.peakYearMode) throw new Error('Choose unknown or a range for estimated peak years.');
    return { cohort: 'inactive', battleCounters: draft.battleCounters, snapshot: inspection.snapshot, batch: { regionId: requiredNumber(draft.regionId, 'Batch region'), count: requiredNumber(draft.count, 'Batch count') },
      ageRange: { minimum: requiredNumber(draft.inactiveAgeMinimum, 'Inactive age minimum'), maximum: requiredNumber(draft.inactiveAgeMaximum, 'Inactive age maximum') },
      peakAbility: { minimum: requiredNumber(draft.peakMinimum, 'Peak ability minimum'), maximum: requiredNumber(draft.peakMaximum, 'Peak ability maximum') },
      declinePoints: { minimum: requiredNumber(draft.declineMinimum, 'Decline points minimum'), maximum: requiredNumber(draft.declineMaximum, 'Decline points maximum') },
      peakYear: draft.peakYearMode === 'unknown' ? null : { minimum: requiredNumber(draft.peakYearMinimum, 'Peak year minimum'), maximum: requiredNumber(draft.peakYearMaximum, 'Peak year maximum') },
      nameGender: draft.nameGender, pokemon };
  }
  const planning = populationPlanningInput(draft, inspection);
  if ('cohort' in planning) throw new Error('Choose an active planning brief.');
  return { snapshot: inspection.snapshot, planning, nameGender: draft.nameGender, ageRatingBias: requiredNumber(draft.ageRatingBias, 'Age/rating bias'), pokemon };
}

export function populationBriefDraft(brief: PopulationBrief): PopulationBriefDraft {
  const specials = {} as PopulationBriefDraft['specials'];
  for (const kind of specialKinds) specials[kind] = { chance: String(brief.pokemon.specialOwnership[kind].chancePercent), count: String(brief.pokemon.specialOwnership[kind].count) };
  const common = { ...emptyPopulationBrief(), nameGender: brief.nameGender,
    preferenceMode: brief.pokemon.types.length || brief.pokemon.generations.length || brief.pokemon.fields.length ? 'custom' as const : 'none' as const,
    types: brief.pokemon.types, generations: brief.pokemon.generations, fields: brief.pokemon.fields,
    specialist: String(brief.pokemon.specialistPercentage), dualType: String(brief.pokemon.dualTypePercentage),
    rosterMode: brief.pokemon.rosterSize === null ? 'weighted' as const : 'range' as const,
    rosterMinimum: String(brief.pokemon.rosterSize?.minimum ?? ''), rosterMaximum: String(brief.pokemon.rosterSize?.maximum ?? ''), specials };
  if (isInactiveBrief(brief)) return { ...common, cohort: 'inactive', battleCounters: brief.battleCounters, regionId: String(brief.batch.regionId), count: String(brief.batch.count),
    inactiveAgeMinimum: String(brief.ageRange.minimum), inactiveAgeMaximum: String(brief.ageRange.maximum),
    peakMinimum: String(brief.peakAbility.minimum), peakMaximum: String(brief.peakAbility.maximum),
    declineMinimum: String(brief.declinePoints.minimum), declineMaximum: String(brief.declinePoints.maximum),
    peakYearMode: brief.peakYear === null ? 'unknown' : 'range', peakYearMinimum: String(brief.peakYear?.minimum ?? ''), peakYearMaximum: String(brief.peakYear?.maximum ?? '') };
  return { ...common, regionId: String(brief.planning.batch.regionId), count: String(brief.planning.batch.count),
    weights: Object.fromEntries(brief.planning.regionWeights.map((weight) => [weight.regionId, { population: String(weight.populationMultiplier), culture: String(weight.cultureMultiplier) }])),
    ageScope: brief.planning.ageTargets.scope, ages: brief.planning.ageTargets.bands.map((band) => ({ minimum: String(band.minimum), maximum: String(band.maximum), percentage: String(band.percentage) })),
    ageRatingBias: String(brief.ageRatingBias) };

}
