import sqlite3 from 'sqlite3';
import { queryAll, queryOne, runStatement, type StatementResult } from '../../../infrastructure/database/sqlite';
import { findAllCities, type City } from './city.repository';
import { parseLocationPolygon, type MapPoint, type MatchableLocation } from './city-location-matching';

interface LocationRow {
  id: number;
  name: string;
  region_id: number;
  population: number | null;
  area_coordinates: unknown;
}

export interface LocationBudget {
  id: number;
  name: string;
  region_id: number;
  population: number | null;
  polygon: MapPoint[] | null;
  cities: City[];
  assignedPopulation: number | null;
  remainingPopulation: number | null;
}

export async function findLocationPolygons(
  database: sqlite3.Database,
  regionId?: number
): Promise<MatchableLocation[]> {
  const locations = await queryAll<LocationRow>(database,
    `SELECT id, name, region_id, population, area_coordinates FROM location
     WHERE (? IS NULL OR region_id = ?) ORDER BY name, id`,
    [regionId ?? null, regionId ?? null]);
  return locations.map(({ area_coordinates, ...location }) => ({
    ...location, polygon: parseLocationPolygon(area_coordinates),
  }));
}

function calculateLocationBudget(location: MatchableLocation, cities: City[]): LocationBudget {
  const total = cities.reduce((sum, city) => sum + (city.population ?? 0), 0);
  const assignedPopulation = Number.isSafeInteger(total) && cities.every((city) =>
    city.population !== null && Number.isSafeInteger(city.population) && city.population > 0) ? total : null;
  const remainingPopulation = location.population !== null && Number.isSafeInteger(location.population)
    && location.population >= 0 && assignedPopulation !== null ? location.population - assignedPopulation : null;
  return { ...location, cities, assignedPopulation, remainingPopulation };
}

export async function findCityLinkState(database: sqlite3.Database): Promise<{ cities: City[]; locations: LocationBudget[] }> {
  const cities = (await findAllCities(database)).sort((left, right) => left.id - right.id);
  const locations = await findLocationPolygons(database);
  return { cities, locations: locations.map((location) =>
    calculateLocationBudget(location, cities.filter((city) => city.location_id === location.id))) };
}

export async function findLocationBudget(
  database: sqlite3.Database,
  locationId: number,
  excludedCityId?: number
): Promise<LocationBudget | null> {
  const location = await queryOne<LocationRow>(database,
    'SELECT id, name, region_id, population, area_coordinates FROM location WHERE id = ?', [locationId]);
  if (!location) return null;
  const cities = await queryAll<City>(database,
    'SELECT * FROM city WHERE location_id = ? AND (? IS NULL OR id <> ?) ORDER BY population DESC, id',
    [locationId, excludedCityId ?? null, excludedCityId ?? null]);
  const { area_coordinates, ...summary } = location;
  return calculateLocationBudget({ ...summary, polygon: parseLocationPolygon(area_coordinates) }, cities);
}

export function linkUnassignedCity(database: sqlite3.Database, cityId: number, locationId: number): Promise<StatementResult> {
  return runStatement(database, 'UPDATE city SET location_id = ? WHERE id = ? AND location_id IS NULL', [locationId, cityId]);
}
