import sqlite3 from 'sqlite3';
import { findCityRecord, type City, type CityWriteInput } from './city.repository';
import { findLocationBudget, findLocationPolygons, type LocationBudget } from './city-location.repository';
import { cityMapPoint, findCityLocationCandidates, type MapPoint, type MatchableLocation, type LocationCandidate } from './city-location-matching';

export interface CityLocationReview {
  city: City;
  point: MapPoint | null;
  locations: MatchableLocation[];
  candidates: LocationCandidate[];
}

export class CityLocationError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export function requirePositiveInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new CityLocationError(400, `${label} must be a positive integer`);
  }
  return value;
}

export function parseGeographyId(value: string): number {
  if (!/^\d+$/.test(value)) throw new CityLocationError(400, 'id must be a positive integer');
  return requirePositiveInteger(Number(value), 'id');
}

export async function getLocationBudget(database: sqlite3.Database, locationId: number): Promise<LocationBudget> {
  const budget = await findLocationBudget(database, locationId);
  if (!budget) throw new CityLocationError(404, 'Location not found');
  return budget;
}

export async function getCityLocationReview(database: sqlite3.Database, cityId: number): Promise<CityLocationReview> {
  const city = await findCityRecord(database, cityId);
  if (!city) throw new CityLocationError(404, 'City not found');
  const locations = await findLocationPolygons(database, city.region_id);
  const point = cityMapPoint(city);
  return { city, point, locations, candidates: findCityLocationCandidates({ ...city, point }, locations) };
}

export async function validateCityLocation(
  database: sqlite3.Database,
  city: Required<CityWriteInput>,
  cityId?: number
): Promise<void> {
  if (city.location_id === null) return;
  const budget = await findLocationBudget(database, city.location_id, cityId);
  if (!budget) throw new CityLocationError(404, 'Location not found');
  if (city.region_id !== budget.region_id || budget.cities.some((assigned) => assigned.region_id !== budget.region_id)) {
    throw new CityLocationError(409, 'City and location must belong to the same region');
  }
  if (city.population === null || !Number.isSafeInteger(city.population) || city.population <= 0) {
    throw new CityLocationError(409, 'A linked city must have a known positive population');
  }
  if (budget.remainingPopulation === null) {
    throw new CityLocationError(409, 'Complete the location and assigned city populations before linking');
  }
  if (city.population > budget.remainingPopulation) {
    throw new CityLocationError(409, `City population exceeds the location's remaining budget of ${budget.remainingPopulation}`);
  }
}

export async function validateLocationCityBudget(
  database: sqlite3.Database,
  locationId: number,
  changes: { population?: number | null; region_id?: number }
): Promise<void> {
  const budget = await getLocationBudget(database, locationId);
  if (budget.cities.length === 0) return;
  const population = changes.population === undefined ? budget.population : changes.population;
  const regionId = changes.region_id === undefined ? budget.region_id : changes.region_id;
  if (budget.cities.some((city) => city.region_id !== regionId)) {
    throw new CityLocationError(409, 'Unlink or reassign the cities before changing their location region');
  }
  if (population === null || !Number.isSafeInteger(population) || population < 0 || budget.assignedPopulation === null) {
    throw new CityLocationError(409, 'A location with linked cities must have known valid populations');
  }
  if (budget.assignedPopulation > population) {
    throw new CityLocationError(409, 'Location population cannot be below its assigned city population');
  }
}
