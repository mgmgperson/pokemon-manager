import { createHash } from 'crypto';
import sqlite3 from 'sqlite3';
import { RANK_BREAKPOINTS } from '../../../reference-data/conversions/conversions';
import { Types } from '../../../reference-data/enums/types';
import { Fields } from '../../../reference-data/enums/fields';
import { parseLocationPolygon } from '../../geography/cities/city-location-matching';
import { readPopulationSource, type PopulationSource, type PopulationTrainer } from './trainer-population.repository';
import { parsePopulationPlanningInput, PopulationPlanningError } from './trainer-population.validation';
import type {
  PopulationCounts, PopulationInspection, PopulationPlan, PopulationPlanningInput,
  PopulationRatingBand, PopulationRegionSummary,
} from './trainer-population.types';

const RATING_FLOOR = 3000;
const PROTECTED_COUNT = 200;

function preferenceOptions(values: Record<string, string | number>, maximum: number): Array<{ id: number; name: string }> {
  return Object.entries(values).flatMap(([name, id]) => typeof id === 'number' && id >= 1 && id <= maximum
    ? [{ id, name: name.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }] : []);
}

function validDate(value: string | null): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

function trainerAge(trainer: PopulationTrainer, gameDate: Date): number | null {
  const born = validDate(trainer.birthdate);
  if (!born || born > gameDate) return null;
  const beforeBirthday = gameDate.getUTCMonth() < born.getUTCMonth()
    || (gameDate.getUTCMonth() === born.getUTCMonth() && gameDate.getUTCDate() < born.getUTCDate());
  return gameDate.getUTCFullYear() - born.getUTCFullYear() - Number(beforeBirthday);
}

function validPwtr(trainer: PopulationTrainer): boolean {
  return trainer.pwtr_rating !== null && Number.isFinite(trainer.pwtr_rating) && trainer.pwtr_rating >= 0;
}

function countsFor(trainers: readonly PopulationTrainer[], gameDate: Date): PopulationCounts {
  const active = trainers.filter((trainer) => trainer.active_status === 1);
  const rated = active.filter(validPwtr);
  return {
    total: trainers.length, active: active.length,
    inactive: trainers.filter((trainer) => trainer.active_status === 0).length,
    unknownStatus: trainers.filter((trainer) => trainer.active_status !== 0 && trainer.active_status !== 1).length,
    activeRated: rated.length,
    activeUnrated: active.filter((trainer) => trainer.pwtr_rating === null).length,
    activeInvalidPwtr: active.filter((trainer) => trainer.pwtr_rating !== null && !validPwtr(trainer)).length,
    activeInCoverage: rated.filter((trainer) => trainer.pwtr_rating! >= RATING_FLOOR).length,
    activeBelowFloor: rated.filter((trainer) => trainer.pwtr_rating! < RATING_FLOOR).length,
    activeInvalidBirthdate: active.filter((trainer) => trainerAge(trainer, gameDate) === null).length,
  };
}

function withinBand(trainer: PopulationTrainer, band: PopulationRatingBand): boolean {
  return trainer.active_status === 1 && validPwtr(trainer)
    && trainer.pwtr_rating! >= band.minimum
    && (band.maximumExclusive === null || trainer.pwtr_rating! < band.maximumExclusive);
}

function referenceBands(): PopulationRatingBand[] {
  return RANK_BREAKPOINTS.filter(([, rating]) => rating >= RATING_FLOOR).map(([rank, rating], index) => ({
    id: `pwtr_${rating}`, minimum: rating,
    maximumExclusive: index === 0 ? null : RANK_BREAKPOINTS[index - 1][1],
    referenceCount: index === 0 ? rank : rank - RANK_BREAKPOINTS[index - 1][0],
    existing: 0, deficit: 0, excess: 0, generationMaximumExclusive: null,
    eligibleAdditions: 0, protectedShortfall: 0,
  }));
}

function validPopulation(population: number | null): population is number {
  return population !== null && Number.isSafeInteger(population) && population >= 0;
}

function summarizeRegions(source: PopulationSource, gameDate: Date): PopulationRegionSummary[] {
  const allKnown = source.regions.every((region) => validPopulation(region.population));
  const totalPopulation = source.regions.reduce((sum, region) => sum + (validPopulation(region.population) ? region.population : 0), 0);
  const locationsById = new Map(source.locations.map((location) => [location.id, location]));
  return source.regions.map((region) => {
    const cities = source.cities.filter((city) => city.region_id === region.id);
    const locations = source.locations.filter((location) => location.region_id === region.id);
    const weightedHometowns = cities.filter((city) => validPopulation(city.population) && city.population > 0).length;
    const linkedCities = cities.filter((city) => city.location_id !== null
      && locationsById.get(city.location_id)?.region_id === region.id).length;
    const validPolygons = locations.filter((location) => parseLocationPolygon(location.area_coordinates) !== null).length;
    const frequencyPresent = (kind: string): boolean => source.nameFrequencies.some((frequency) => (
      frequency.region_id === region.id && frequency.type === kind && typeof frequency.country === 'string'
      && frequency.country.trim().length > 0 && Number.isFinite(frequency.frequency) && frequency.frequency > 0
    ));
    const forenameWeightsPresent = frequencyPresent('F');
    const surnameWeightsPresent = frequencyPresent('S');
    const issues: string[] = [];
    if (!validPopulation(region.population)) issues.push('Region population is missing or invalid; no allocation weight was inferred.');
    if (weightedHometowns === 0) issues.push('No city has a positive, valid population for weighted hometown selection.');
    if (weightedHometowns < cities.length) issues.push('Some city populations cannot be used as hometown weights.');
    if (locations.length === 0) issues.push('No location baseline; regional geography is uncovered.');
    if (validPolygons < locations.length) issues.push('Some location polygons are missing or invalid.');
    if (linkedCities < cities.length) issues.push('Some cities are unlinked or have invalid location links.');
    if (!forenameWeightsPresent || !surnameWeightsPresent) issues.push('Regional forename/surname weights are incomplete.');
    return {
      ...region, populationShare: allKnown && totalPopulation > 0 && Number.isSafeInteger(totalPopulation)
        ? region.population! / totalPopulation : null,
      counts: countsFor(source.trainers.filter((trainer) => trainer.region_id === region.id), gameDate),
      cities: cities.length, weightedHometowns, linkedCities, locations: locations.length,
      validPolygons, forenameWeightsPresent, surnameWeightsPresent, issues,
    };
  });
}

function buildInspection(source: PopulationSource): PopulationInspection {
  const gameDate = validDate(source.gameDate);
  if (!gameDate) throw new PopulationPlanningError(409, 'The save needs a valid YYYY-MM-DD current game date');
  const activeRated = source.trainers.filter((trainer) => trainer.active_status === 1 && validPwtr(trainer))
    .sort((left, right) => right.pwtr_rating! - left.pwtr_rating! || left.id - right.id);
  const protectedTrainers = activeRated.slice(0, PROTECTED_COUNT);
  const ceiling = protectedTrainers.length === PROTECTED_COUNT ? protectedTrainers[PROTECTED_COUNT - 1].pwtr_rating : null;
  const boundaryTie = ceiling !== null && activeRated[PROTECTED_COUNT]?.pwtr_rating === ceiling;
  const ready = ceiling !== null && !boundaryTie;
  const ratingBands = referenceBands().map((band) => {
    const existing = activeRated.filter((trainer) => withinBand(trainer, band)).length;
    const deficit = Math.max(0, band.referenceCount - existing);
    const maximum = ceiling === null ? null : Math.min(band.maximumExclusive ?? Infinity, ceiling);
    const canAdd = ready && maximum !== null && band.minimum < maximum;
    return { ...band, existing, deficit, excess: Math.max(0, existing - band.referenceCount),
      generationMaximumExclusive: canAdd ? maximum : null,
      eligibleAdditions: canAdd ? deficit : 0, protectedShortfall: canAdd ? 0 : deficit };
  });
  const ages = new Map<number, { age: number; allActive: number; inCoverage: number }>();
  for (const trainer of source.trainers.filter((trainer) => trainer.active_status === 1)) {
    const age = trainerAge(trainer, gameDate);
    if (age === null) continue;
    const count = ages.get(age) ?? { age, allActive: 0, inCoverage: 0 };
    count.allActive += 1;
    if (validPwtr(trainer) && trainer.pwtr_rating! >= RATING_FLOOR) count.inCoverage += 1;
    ages.set(age, count);
  }
  const regionIds = new Set(source.regions.map((region) => region.id));
  const activeWithoutRegion = source.trainers.filter((trainer) => trainer.active_status === 1
    && (trainer.region_id === null || !regionIds.has(trainer.region_id))).length;
  const issues: string[] = [];
  if (ceiling === null) issues.push('Fewer than 200 rated active trainers: the protected elite needs author review before planning additions.');
  if (boundaryTie) issues.push('A tie crosses the protected top-200 boundary; resolve the protected membership before planning additions.');
  if (activeWithoutRegion > 0) issues.push('Some active trainers have no valid region; they still count toward worldwide targets.');
  if (ratingBands.some((band) => band.protectedShortfall > 0)) issues.push('Protected rating-band gaps are advisory and are not generation slots.');
  const counts = countsFor(source.trainers, gameDate);
  const additions = ratingBands.reduce((sum, band) => sum + band.eligibleAdditions, 0);
  if (counts.activeInvalidPwtr > 0) issues.push('Invalid active PWTR values are excluded from rating targets and need review.');
  if (counts.activeInvalidBirthdate > 0) issues.push('Some active ages are unknown; age targets cannot establish their missing birthdates.');
  return {
    version: 1, mode: 'planning-only', snapshot: createHash('sha256').update(JSON.stringify(source)).digest('hex'),
    databaseFile: source.databaseFile, gameDate: source.gameDate!, ratingFloor: RATING_FLOOR,
    pokemonPreferences: { types: preferenceOptions(Types, Types.STELLAR), fields: preferenceOptions(Fields, Fields.NEW_WORLD),
      generations: Array.from({ length: 9 }, (_value, index) => ({ id: index + 1, name: `Generation ${index + 1}` })) },
    referenceCount: ratingBands.reduce((sum, band) => sum + band.referenceCount, 0), counts,
    referenceProjection: { additions, active: counts.active + additions, inCoverage: counts.activeInCoverage + additions },
    protection: { requiredCount: PROTECTED_COUNT, ceilingExclusive: ceiling, boundaryTie, ready,
      members: protectedTrainers.map((trainer) => ({ id: trainer.id,
        name: [trainer.fname, trainer.lname].filter(Boolean).join(' ') || `Trainer ${trainer.id}`, pwtr: trainer.pwtr_rating! })) },
    ratingBands, regions: summarizeRegions(source, gameDate),
    ageCounts: [...ages.values()].sort((left, right) => left.age - right.age), activeWithoutRegion, issues,
  };
}

// Largest remainders preserve integer totals; input order breaks equal remainders.
function allocateCounts(total: number, weights: readonly number[]): number[] {
  if (total === 0) return weights.map(() => 0);
  const maximum = Math.max(...weights);
  if (!Number.isFinite(maximum) || maximum <= 0 || weights.some((weight) => !Number.isFinite(weight) || weight < 0)) {
    throw new PopulationPlanningError(400, 'Allocation needs finite non-negative weights and a positive total weight');
  }
  const normalized = weights.map((weight) => weight / maximum);
  const sum = normalized.reduce((subtotal, weight) => subtotal + weight, 0);
  const exact = normalized.map((weight) => total * weight / sum);
  const counts = exact.map(Math.floor);
  const order = exact.map((value, index) => ({ index, remainder: value - counts[index] }))
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index);
  for (let remaining = total - counts.reduce((subtotal, count) => subtotal + count, 0), index = 0;
    remaining > 0; remaining -= 1, index += 1) counts[order[index].index] += 1;
  return counts;
}

function regionalTargets(source: PopulationSource, inspection: PopulationInspection,
  input: PopulationPlanningInput): PopulationPlan['regionalTargets'] {
  if (!input.regionWeights) return null;
  const weightsById = new Map(input.regionWeights.map((weight) => [weight.regionId, weight]));
  if (weightsById.size !== inspection.regions.length || inspection.regions.some((region) => !weightsById.has(region.id))) {
    throw new PopulationPlanningError(400, 'Supply explicit weights for every region, including unfinished regions');
  }
  if (inspection.regions.some((region) => !validPopulation(region.population))) {
    throw new PopulationPlanningError(409, 'Regional allocation needs known, valid region populations');
  }
  const plans: NonNullable<PopulationPlan['regionalTargets']> = inspection.regions.map((region) => ({
    regionId: region.id, bands: [], additionTarget: 0, projectedActiveInCoverage: 0,
  }));
  const strongestMinimum = inspection.ratingBands.find((band) => band.generationMaximumExclusive !== null
    && band.minimum < band.generationMaximumExclusive)?.minimum ?? RATING_FLOOR;
  for (const band of inspection.ratingBands) {
    const strength = Math.max(0, Math.min(1, (band.minimum - RATING_FLOOR) / Math.max(1, strongestMinimum - RATING_FLOOR)));
    const weights = inspection.regions.map((region) => {
      const chosen = weightsById.get(region.id)!;
      return region.population! * chosen.populationMultiplier * (1 + strength * (chosen.cultureMultiplier - 1));
    });
    const references = allocateCounts(band.referenceCount, weights);
    const existing = inspection.regions.map((region) => source.trainers.filter((trainer) => trainer.region_id === region.id && withinBand(trainer, band)).length);
    const deficits = references.map((reference, index) => Math.max(0, reference - existing[index]));
    const additions = allocateCounts(band.eligibleAdditions, deficits);
    plans.forEach((plan, index) => plan.bands.push({ bandId: band.id,
      referenceCount: references[index], existing: existing[index], deficit: deficits[index],
      excess: Math.max(0, existing[index] - references[index]), additionTarget: additions[index],
      projected: existing[index] + additions[index] }));
  }
  return plans.map((plan, index) => ({ ...plan,
    additionTarget: plan.bands.reduce((sum, band) => sum + band.additionTarget, 0),
    projectedActiveInCoverage: inspection.regions[index].counts.activeInCoverage
      + plan.bands.reduce((sum, band) => sum + band.additionTarget, 0),
  }));
}

function ageTargets(source: PopulationSource, inspection: PopulationInspection,
  input: PopulationPlanningInput): PopulationPlan['ageTargets'] {
  if (!input.ageTargets) return null;
  const { scope, bands } = input.ageTargets;
  const gameDate = validDate(inspection.gameDate)!;
  if (bands.some((band) => band.maximum > gameDate.getUTCFullYear())) {
    throw new PopulationPlanningError(400, 'Age bounds cannot require a birth year before year zero');
  }
  const trainers = source.trainers.filter((trainer) => trainer.active_status === 1
    && (scope === 'all_active' || (validPwtr(trainer) && trainer.pwtr_rating! >= RATING_FLOOR)));
  const additions = inspection.ratingBands.reduce((sum, band) => sum + band.eligibleAdditions, 0);
  const targets = allocateCounts(trainers.length + additions, bands.map((band) => band.percentage));
  const plannedBands = bands.map((band, index) => {
    const existing = trainers.filter((trainer) => {
      const age = trainerAge(trainer, gameDate);
      return age !== null && age >= band.minimum && age <= band.maximum;
    }).length;
    return { ...band, target: targets[index], existing, deficit: Math.max(0, targets[index] - existing),
      excess: Math.max(0, existing - targets[index]) };
  });
  const invalidBirthdates = trainers.filter((trainer) => trainerAge(trainer, gameDate) === null).length;
  return { scope, finalPopulation: trainers.length + additions, invalidBirthdates,
    outsideBands: trainers.length - invalidBirthdates - plannedBands.reduce((sum, band) => sum + band.existing, 0),
    bands: plannedBands };
}

export async function inspectTrainerPopulation(database: sqlite3.Database): Promise<PopulationInspection> {
  return buildInspection(await readPopulationSource(database));
}

export function planTrainerPopulationFromSource(source: PopulationSource, value: unknown = {}): PopulationPlan {
  const settings = parsePopulationPlanningInput(value);
  const inspection = buildInspection(source);
  const regional = regionalTargets(source, inspection, settings);
  const ages = ageTargets(source, inspection, settings);
  const unresolvedInputs: string[] = [];
  if (!settings.regionWeights) unresolvedInputs.push('Worldwide regional allocation and culture weights');
  if (!settings.ageTargets) unresolvedInputs.push('Age bands, target percentages and coverage/all-active denominator');
  if (!settings.batch) unresolvedInputs.push('Region and count for the next supervised batch');
  unresolvedInputs.push('Age/rating pairing, Pokemon preferences and special rates belong to the later generation stage; this report generates no trainers.');
  let batch: PopulationPlan['batch'] = null;
  if (settings.batch) {
    const request = settings.batch;
    const region = inspection.regions.find((candidate) => candidate.id === request.regionId);
    if (!region) throw new PopulationPlanningError(400, 'The batch region does not exist');
    if (!inspection.protection.ready) throw new PopulationPlanningError(409, 'Resolve elite protection before planning a batch');
    const target = regional?.find((candidate) => candidate.regionId === request.regionId);
    if (!target) throw new PopulationPlanningError(400, 'A batch needs explicit worldwide region weights');
    if (request.count > target.additionTarget) {
      throw new PopulationPlanningError(400, `Batch count exceeds this region\'s ${target.additionTarget} planned additions`);
    }
    const bandCounts = allocateCounts(request.count, target.bands.map((band) => band.additionTarget));
    const issues = [...region.issues];
    if (ages && ages.bands.reduce((sum, band) => sum + band.deficit, 0) < request.count) {
      throw new PopulationPlanningError(400, 'The requested batch exceeds the outstanding age targets');
    }
    const ageCounts = ages ? allocateCounts(request.count, ages.bands.map((band) => band.deficit)) : null;
    if (ages && (ages.outsideBands > 0 || ages.invalidBirthdates > 0)) {
      issues.push('Existing unknown/out-of-band ages prevent an exact age curve; preserve those trainers and review the projected targets.');
    }
    issues.push('Rating and age counts are separate planning totals; complete proposals pair these counts using the reviewed age/rating bias.');
    batch = { ...request, ratingBands: target.bands.map((band, index) => ({ bandId: band.bandId, count: bandCounts[index] })),
      ageBands: ages && ageCounts ? ages.bands.map((band, index) => ({ minimum: band.minimum, maximum: band.maximum, count: ageCounts[index] })) : null,
      projectedActive: region.counts.active + request.count,
      projectedActiveInCoverage: region.counts.activeInCoverage + request.count,
      projectedWorldwideActive: inspection.counts.active + request.count,
      projectedWorldwideActiveInCoverage: inspection.counts.activeInCoverage + request.count, issues };
  }
  return { inspection, settings, unresolvedInputs,
    allocationMethod: 'Largest remainders by region id. Weight = population * populationMultiplier * (1 + strength * (cultureMultiplier - 1)); strength runs from 0 at 3000 to 1 at the strongest unprotected band. Regional deficits share each worldwide deficit; authored excesses are retained. Unready regions retain their targets.',
    regionalTargets: regional, ageTargets: ages, batch };
}

export async function planTrainerPopulation(database: sqlite3.Database, value: unknown = {}): Promise<PopulationPlan> {
  const settings = parsePopulationPlanningInput(value);
  return planTrainerPopulationFromSource(await readPopulationSource(database), settings);
}
