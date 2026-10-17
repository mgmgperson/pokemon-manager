import { createHash } from 'crypto';
import sqlite3 from 'sqlite3';
import { runInTransaction } from '../../../infrastructure/database/sqlite';
import { loadCityNameBases } from '../../../infrastructure/reference/cityNameBases';
import { AZGAAR_NAME_STYLES, generateCityNames, isCityNameStyle, MAX_CITY_PROPOSAL_COUNT, resolveCityNameStyles,
  type CityNameBase, type CityNamingStyle } from '../../../generators/cityNameGenerator';
import { generateMunicipalityProposal, type MunicipalityOptions, type MunicipalityProposal, type ProposedMunicipality } from '../../../generators/municipalityGenerator';
import { findTerrainsForLocation, type TerrainAssociation } from '../locations/location.repository';
import { createCity } from './city.repository';
import { cityMapPoint, isLocationPolygon, isMapPoint, mapPointsOverlap, pointInsidePolygon } from './city-location-matching';
import { type LocationBudget } from './city-location.repository';
import { CityLocationError, getLocationBudget, requirePositiveInteger } from './city-location.service';
import { findGenerationMetadata, findRegionPlaceNames, findSavePlaceNames } from './city-generation.repository';

export interface MunicipalityReview extends LocationBudget {
  snapshot: string;
  regionNames: string[];
  existingPlaceNames: string[];
  description: string | null;
  terrains: TerrainAssociation[];
  namingStyles: CityNamingStyle[];
  maximumCityCount: number;
}

export interface ReviewedMunicipalities {
  snapshot: string;
  locationId: number;
  regionId: number;
  populationBudget: number;
  minimumPopulation: number;
  cities: ProposedMunicipality[];
  totalPopulation: number;
  remainingPopulation: number;
}

function object(value: unknown, label: string, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new CityLocationError(400, `${label} must be an object`);
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !keys.includes(key))) throw new CityLocationError(400, `${label} contains unsupported fields`);
  return input;
}

function namingSelection(value: unknown, mixed: unknown): Pick<MunicipalityOptions, 'namingStyle' | 'mixedStyles'> {
  const style = value === undefined ? 'pokemon' : value;
  if (style !== 'mixed' && !isCityNameStyle(style)) throw new CityLocationError(400, 'Unknown city naming style');
  if (mixed !== undefined && (!Array.isArray(mixed) || !mixed.every(isCityNameStyle))) {
    throw new CityLocationError(400, 'mixedStyles must contain supported city naming styles');
  }
  try {
    const styles = resolveCityNameStyles(style, mixed);
    return { namingStyle: style, ...(style === 'mixed' ? { mixedStyles: styles } : {}) };
  } catch (error) { throw new CityLocationError(400, error instanceof Error ? error.message : 'Invalid naming selection'); }
}

async function nameBases(selection: Pick<MunicipalityOptions, 'namingStyle' | 'mixedStyles'>): Promise<CityNameBase[]> {
  if (resolveCityNameStyles(selection.namingStyle ?? 'pokemon', selection.mixedStyles).every((style) => style === 'pokemon')) return [];
  try { return await loadCityNameBases(); }
  catch (error) { throw new CityLocationError(503, error instanceof Error ? error.message : 'City-name lists unavailable'); }
}

async function buildReview(database: sqlite3.Database, locationId: number): Promise<MunicipalityReview> {
  const budget = await getLocationBudget(database, locationId);
  const regionNames = await findRegionPlaceNames(database, budget.region_id);
  const { databaseFile, description } = await findGenerationMetadata(database, locationId);
  const snapshot = createHash('sha256').update(JSON.stringify({ databaseFile, budget, regionNames })).digest('hex');
  return { ...budget, snapshot, regionNames, existingPlaceNames: await findSavePlaceNames(database), description,
    terrains: await findTerrainsForLocation(database, locationId, true),
    namingStyles: ['pokemon', ...AZGAAR_NAME_STYLES, 'mixed'], maximumCityCount: MAX_CITY_PROPOSAL_COUNT };
}

function requireCurrentReview(review: MunicipalityReview, snapshot: unknown): void {
  if (typeof snapshot !== 'string' || !/^[a-f0-9]{64}$/.test(snapshot)) throw new CityLocationError(400, 'A valid location review snapshot is required');
  if (snapshot !== review.snapshot) throw new CityLocationError(409, 'Geography or selected save changed since review. Refresh and generate a new proposal.');
  if (review.remainingPopulation === null || review.remainingPopulation < 0
    || review.cities.some((city) => city.region_id !== review.region_id)) {
    throw new CityLocationError(409, 'Complete valid location and assigned-city populations/regions before generating cities');
  }
  if (!review.polygon || !isLocationPolygon(review.polygon)) throw new CityLocationError(409, 'A valid location polygon is required');
}

export function getMunicipalityReview(database: sqlite3.Database, locationId: number): Promise<MunicipalityReview> {
  return runInTransaction(database, () => buildReview(database, locationId));
}

export async function proposeMunicipalities(
  database: sqlite3.Database, locationId: number, body: unknown
): Promise<MunicipalityProposal & { snapshot: string }> {
  const input = object(body, 'Request body', ['snapshot', 'options']);
  const options = object(input.options, 'Options', ['cityCount', 'populationBudget', 'minimumPopulation', 'alpha', 'offset', 'namingStyle', 'mixedStyles', 'islandNamePercent']);
  const parameters: MunicipalityOptions = {
    cityCount: requirePositiveInteger(options.cityCount, 'cityCount'),
    populationBudget: requirePositiveInteger(options.populationBudget, 'populationBudget'),
    minimumPopulation: options.minimumPopulation === undefined ? 1000 : requirePositiveInteger(options.minimumPopulation, 'minimumPopulation'),
    ...namingSelection(options.namingStyle, options.mixedStyles),
  };
  for (const key of ['alpha', 'offset', 'islandNamePercent'] as const) {
    const value = options[key];
    if (value !== undefined) {
      if (typeof value !== 'number' || !Number.isFinite(value)) throw new CityLocationError(400, `${key} must be a finite number`);
      parameters[key] = value;
    }
  }
  const bases = await nameBases(parameters);
  return runInTransaction(database, async () => {
    const review = await buildReview(database, locationId);
    requireCurrentReview(review, input.snapshot);
    try {
      return { ...generateMunicipalityProposal({ location: review, assignedCities: review.cities, regionNames: review.regionNames,
        excludedNames: review.existingPlaceNames }, parameters, bases), snapshot: review.snapshot };
    } catch (error) { throw new CityLocationError(400, error instanceof Error ? error.message : 'Unable to generate municipalities'); }
  });
}

function validateCities(review: MunicipalityReview, input: Record<string, unknown>): ReviewedMunicipalities {
  requireCurrentReview(review, input.snapshot);
  const populationBudget = requirePositiveInteger(input.populationBudget, 'populationBudget');
  const minimumPopulation = requirePositiveInteger(input.minimumPopulation, 'minimumPopulation');
  if (populationBudget > review.remainingPopulation!) throw new CityLocationError(409, 'Municipality budget exceeds the available location population');
  if (!Array.isArray(input.cities) || input.cities.length < 1 || input.cities.length > MAX_CITY_PROPOSAL_COUNT) {
    throw new CityLocationError(400, `Review between 1 and ${MAX_CITY_PROPOSAL_COUNT} new cities`);
  }
  const points = review.cities.map(cityMapPoint).filter((point) => point !== null);
  let totalPopulation = 0;
  const cities = input.cities.map((value: unknown): ProposedMunicipality => {
    const city = object(value, 'City proposal', ['name', 'population', 'point']);
    if (typeof city.name !== 'string' || !city.name.trim() || city.name.trim().length > 200) throw new CityLocationError(400, 'City name must contain 1–200 characters');
    const name = city.name.trim();
    const population = requirePositiveInteger(city.population, 'City population');
    if (population < minimumPopulation) throw new CityLocationError(400, `City population must be at least ${minimumPopulation}`);
    totalPopulation += population;
    if (!Number.isSafeInteger(totalPopulation) || totalPopulation > populationBudget) throw new CityLocationError(409, 'Edited city populations exceed the reviewed municipality budget');
    const coordinates = object(city.point, 'City point', ['x', 'y']);
    if (typeof coordinates.x !== 'number' || typeof coordinates.y !== 'number') throw new CityLocationError(400, 'City coordinates must be numbers');
    const point = { x: coordinates.x, y: coordinates.y };
    if (!isMapPoint(point) || !pointInsidePolygon(point, review.polygon!)) throw new CityLocationError(400, `City "${name}" must be inside the selected location polygon`);
    if (points.some((other) => mapPointsOverlap(other, point))) throw new CityLocationError(409, 'New city points must not overlap existing or proposed cities');
    points.push(point);
    return { name, population, point };
  });
  return { snapshot: review.snapshot, locationId: review.id, regionId: review.region_id, populationBudget,
    minimumPopulation, cities, totalPopulation, remainingPopulation: review.remainingPopulation! - totalPopulation };
}

function reviewedInput(body: unknown): Record<string, unknown> {
  return object(body, 'Reviewed proposal', ['snapshot', 'populationBudget', 'minimumPopulation', 'cities']);
}

export function reviewMunicipalities(database: sqlite3.Database, locationId: number, body: unknown): Promise<ReviewedMunicipalities> {
  const input = reviewedInput(body);
  return runInTransaction(database, async () => validateCities(await buildReview(database, locationId), input));
}

export function applyMunicipalities(
  database: sqlite3.Database, locationId: number, body: unknown
): Promise<{ createdCities: Array<ProposedMunicipality & { id: number }>; remainingPopulation: number }> {
  const input = reviewedInput(body);
  return runInTransaction(database, async () => {
    const reviewed = validateCities(await buildReview(database, locationId), input);
    const createdCities: Array<ProposedMunicipality & { id: number }> = [];
    for (const city of reviewed.cities) {
      const inserted = await createCity(database, { name: city.name, population: city.population, region_id: reviewed.regionId,
        location_id: reviewed.locationId, x_coordinate: city.point.x, y_coordinate: city.point.y, description: null });
      if (inserted.changes !== 1) throw new CityLocationError(409, 'A city could not be created; the whole proposal was rolled back');
      createdCities.push({ ...city, id: inserted.lastInsertId });
    }
    return { createdCities, remainingPopulation: reviewed.remainingPopulation };
  });
}

export async function rerollMunicipalityName(database: sqlite3.Database, locationId: number, body: unknown): Promise<string> {
  const input = object(body, 'Name request', ['snapshot', 'namingStyle', 'mixedStyles', 'excludedNames', 'islandName']);
  if (input.islandName !== undefined && typeof input.islandName !== 'boolean') {
    throw new CityLocationError(400, 'islandName must be a boolean');
  }
  if (!Array.isArray(input.excludedNames) || input.excludedNames.length > MAX_CITY_PROPOSAL_COUNT
    || !input.excludedNames.every((name: unknown) => typeof name === 'string' && name.length <= 200)) {
    throw new CityLocationError(400, 'excludedNames must be an array of up to 100 city names');
  }
  const excludedNames = input.excludedNames as string[];
  const selection = namingSelection(input.namingStyle, input.mixedStyles);
  const bases = await nameBases(selection);
  return runInTransaction(database, async () => {
    const review = await buildReview(database, locationId);
    requireCurrentReview(review, input.snapshot);
    return generateCityNames(1, selection.namingStyle ?? 'pokemon', [...review.existingPlaceNames, ...excludedNames], bases, Math.random, selection.mixedStyles, input.islandName === true ? 100 : 0)[0];
  });
}
