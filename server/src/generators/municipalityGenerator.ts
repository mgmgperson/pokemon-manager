import { generateCityNames, MAX_CITY_PROPOSAL_COUNT, resolveCityNameStyles, type CityNameBase, type CityNameStyle, type CityNamingStyle } from './cityNameGenerator';
import { cityMapPoint, isLocationPolygon, mapPointsOverlap, pointInsidePolygon, type MapPoint, type MatchableLocation } from '../modules/geography/cities/city-location-matching';
import { type City } from '../modules/geography/cities/city.repository';

export interface MunicipalityContext {
  location: MatchableLocation;
  assignedCities: readonly Pick<City, 'population' | 'region_id' | 'x_coordinate' | 'y_coordinate'>[];
  regionNames: readonly string[];
  excludedNames?: readonly string[];
}

export interface MunicipalityOptions {
  cityCount: number;
  populationBudget: number;
  minimumPopulation?: number;
  alpha?: number;
  offset?: number;
  namingStyle?: CityNamingStyle;
  mixedStyles?: CityNameStyle[];
  islandNamePercent?: number;
}

export type NormalizedMunicipalityOptions = Required<Omit<MunicipalityOptions, 'mixedStyles'>> & Pick<MunicipalityOptions, 'mixedStyles'>;

export interface ProposedMunicipality {
  name: string;
  population: number;
  point: MapPoint;
}

export interface MunicipalityProposal {
  locationId: number;
  regionId: number;
  locationPopulation: number;
  assignedPopulation: number;
  availablePopulation: number;
  populationBudget: number;
  remainingPopulation: number;
  parameters: NormalizedMunicipalityOptions;
  cities: ProposedMunicipality[];
}

function positiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label} must be a positive safe integer`);
}

function normalizeOptions(options: MunicipalityOptions): NormalizedMunicipalityOptions {
  const { cityCount, populationBudget, minimumPopulation = 1000, alpha = 1.2, offset = 0, namingStyle = 'pokemon', islandNamePercent = 0 } = options;
  const styles = resolveCityNameStyles(namingStyle, options.mixedStyles);
  const parameters = { cityCount, populationBudget, minimumPopulation, alpha, offset, namingStyle, islandNamePercent,
    ...(namingStyle === 'mixed' ? { mixedStyles: styles } : {}) };
  positiveInteger(parameters.cityCount, 'City count');
  positiveInteger(parameters.populationBudget, 'Municipality population budget');
  positiveInteger(parameters.minimumPopulation, 'Minimum city population');
  if (parameters.cityCount > MAX_CITY_PROPOSAL_COUNT) throw new Error(`At most ${MAX_CITY_PROPOSAL_COUNT} municipalities can be proposed at once`);
  if (parameters.minimumPopulation > Math.floor(parameters.populationBudget / parameters.cityCount)) {
    throw new Error('Population budget is too small for the chosen count and minimum population');
  }
  if (!Number.isFinite(parameters.alpha) || parameters.alpha < 0.5 || parameters.alpha > 3
    || !Number.isFinite(parameters.offset) || parameters.offset < 0 || parameters.offset > 10) {
    throw new Error('Rank-size alpha must be 0.5–3 and offset must be 0–10');
  }
  if (!Number.isFinite(islandNamePercent) || islandNamePercent < 0 || islandNamePercent > 100) {
    throw new Error('Island name percentage must be between 0 and 100');
  }
  return parameters;
}

function allocatePopulations(parameters: NormalizedMunicipalityOptions, random: () => number): number[] {
  const { cityCount, populationBudget, minimumPopulation, alpha, offset } = parameters;
  const weights = Array.from({ length: cityCount }, (_, index) =>
    (0.85 + 0.3 * random()) / (index + 1 + offset) ** alpha).sort((left, right) => right - left);
  let remainingWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let remainingExtra = populationBudget - minimumPopulation * cityCount;
  const populations = weights.map((weight, index) => {
    // Allocate from the remaining integers so floating-point rounding cannot overspend the budget.
    const extra = index === cityCount - 1 ? remainingExtra
      : Math.min(remainingExtra, Math.floor(remainingExtra * weight / remainingWeight));
    remainingExtra -= extra;
    remainingWeight -= weight;
    return minimumPopulation + extra;
  });
  return populations.sort((left, right) => right - left);
}

function generatePoints(
  count: number, polygon: readonly MapPoint[], occupied: readonly MapPoint[], random: () => number
): MapPoint[] {
  const xs = polygon.map((point) => point.x);
  const ys = polygon.map((point) => point.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const points: MapPoint[] = [];
  const occupiedPoints = [...occupied];
  for (let attempt = 0; attempt < count * 10_000 && points.length < count; attempt += 1) {
    const point = { x: minX + random() * (maxX - minX), y: minY + random() * (maxY - minY) };
    if (!pointInsidePolygon(point, polygon) || occupiedPoints.some((other) => mapPointsOverlap(other, point))) continue;
    points.push(point);
    occupiedPoints.push(point);
  }
  if (points.length !== count) throw new Error('Could not place distinct cities inside the location polygon; review its shape or reduce the count');
  return points;
}

/** Generates new municipalities only; requires explicit budget/count and makes no database or file calls. */
export function generateMunicipalityProposal(
  context: MunicipalityContext,
  options: MunicipalityOptions,
  nameBases: readonly CityNameBase[] = [],
  random: () => number = Math.random
): MunicipalityProposal {
  const parameters = normalizeOptions(options);
  const { location, assignedCities, regionNames, excludedNames = [] } = context;
  positiveInteger(location.id, 'Location id');
  positiveInteger(location.region_id, 'Region id');
  if (location.population === null) throw new Error('Location population must be known before generating cities');
  positiveInteger(location.population, 'Location population');
  if (!location.polygon || !isLocationPolygon(location.polygon)) {
    throw new Error('A valid location polygon is required before generating cities');
  }
  let assignedPopulation = 0;
  for (const city of assignedCities) {
    if (city.region_id !== location.region_id) throw new Error('Assigned city and location regions do not match');
    if (city.population === null) throw new Error('Assigned city populations must be known before generating cities');
    positiveInteger(city.population, 'Assigned city population');
    assignedPopulation += city.population;
    if (!Number.isSafeInteger(assignedPopulation) || assignedPopulation > location.population) {
      throw new Error('Existing city populations exceed the location population');
    }
  }
  const availablePopulation = location.population - assignedPopulation;
  if (parameters.populationBudget > availablePopulation) throw new Error(`Municipality budget exceeds the remaining ${availablePopulation} people`);
  const populations = allocatePopulations(parameters, random);
  const occupied = assignedCities.map(cityMapPoint).filter((point): point is MapPoint => point !== null);
  const points = generatePoints(parameters.cityCount, location.polygon, occupied, random);
  const names = generateCityNames(parameters.cityCount, parameters.namingStyle, [...regionNames, ...excludedNames, location.name], nameBases, random, parameters.mixedStyles, parameters.islandNamePercent);
  return {
    locationId: location.id, regionId: location.region_id, locationPopulation: location.population,
    assignedPopulation, availablePopulation, populationBudget: parameters.populationBudget,
    remainingPopulation: availablePopulation - parameters.populationBudget, parameters,
    cities: populations.map((population, index) => ({ name: names[index], population, point: points[index] })),
  };
}
