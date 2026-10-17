import sqlite3 from 'sqlite3';
import { runInTransaction } from '../../../infrastructure/database/sqlite';
import {
  createGymLeader,
  createCity,
  createStadium,
  cityRegionExists,
  deleteGymLeadersForCity,
  deleteStadiumsForCity,
  findCityRecord,
  updateCity,
  type CityWriteInput,
  type City,
  type GymLeaderWriteInput,
  type StadiumWriteInput,
} from './city.repository';
import { CityLocationError, requirePositiveInteger, parseGeographyId, validateCityLocation } from './city-location.service';

export interface CityUpdateInput extends CityWriteInput {
  stadiums?: StadiumWriteInput[];
  gymLeaders?: GymLeaderWriteInput[];
}

export class CityUpdateError extends Error {
  readonly leader: GymLeaderWriteInput;

  constructor(leader: GymLeaderWriteInput) {
    super(`Invalid trainer_id: ${leader.trainer_id} is not a number`);
    this.leader = leader;
  }
}

function validateCityFields(city: CityWriteInput): void {
  if (!city || typeof city !== 'object' || Array.isArray(city)) {
    throw new CityLocationError(400, 'City body must be an object');
  }
  if (city.name !== undefined && (typeof city.name !== 'string' || !city.name.trim())) {
    throw new CityLocationError(400, 'City name must be a non-empty string');
  }
  if (city.region_id !== undefined) requirePositiveInteger(city.region_id, 'region_id');
  if (city.location_id !== undefined && city.location_id !== null) requirePositiveInteger(city.location_id, 'location_id');
  if (city.population !== undefined && city.population !== null) requirePositiveInteger(city.population, 'population');
  if (city.description !== undefined && city.description !== null && typeof city.description !== 'string') {
    throw new CityLocationError(400, 'description must be a string or null');
  }
  for (const key of ['x_coordinate', 'y_coordinate'] as const) {
    const value = city[key];
    if (value !== undefined && value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1)) {
      throw new CityLocationError(400, `${key} must be between 0 and 1, or null`);
    }
  }
}

export function createCityDetails(database: sqlite3.Database, input: CityWriteInput): Promise<City> {
  validateCityFields(input);
  if (!input.name || input.region_id === undefined) throw new CityLocationError(400, 'Name and region_id are required');
  const city: Required<CityWriteInput> = {
    name: input.name.trim(), region_id: input.region_id, population: input.population ?? null,
    description: input.description ?? null, x_coordinate: input.x_coordinate ?? 0.5,
    y_coordinate: input.y_coordinate ?? 0.5, location_id: input.location_id ?? null,
  };
  return runInTransaction(database, async () => {
    if (!await cityRegionExists(database, city.region_id)) throw new CityLocationError(404, 'Region not found');
    await validateCityLocation(database, city);
    const statement = await createCity(database, city);
    return { id: statement.lastInsertId, ...city };
  });
}

export function updateCityDetails(
  database: sqlite3.Database,
  cityId: string,
  city: CityUpdateInput
): Promise<void> {
  validateCityFields(city);
  for (const entries of [city.stadiums, city.gymLeaders]) {
    if (entries !== undefined && (!Array.isArray(entries)
      || entries.some((entry) => !entry || typeof entry !== 'object' || Array.isArray(entry)))) {
      throw new CityLocationError(400, 'stadiums and gymLeaders must be arrays of objects');
    }
  }
  const id = parseGeographyId(cityId);
  return runInTransaction(database, async () => {
    const current = await findCityRecord(database, id);
    if (!current) throw new CityLocationError(404, 'City not found');
    const updated: City = {
      id, name: city.name?.trim() ?? current.name, region_id: city.region_id ?? current.region_id,
      population: city.population === undefined ? current.population : city.population,
      description: city.description === undefined ? current.description : city.description,
      x_coordinate: city.x_coordinate === undefined ? current.x_coordinate : city.x_coordinate,
      y_coordinate: city.y_coordinate === undefined ? current.y_coordinate : city.y_coordinate,
      location_id: city.location_id === undefined ? current.location_id : city.location_id,
    };
    if (!await cityRegionExists(database, updated.region_id)) throw new CityLocationError(404, 'Region not found');
    await validateCityLocation(database, updated, id);
    await updateCity(database, cityId, updated);

    if (Array.isArray(city.stadiums)) {
      await deleteStadiumsForCity(database, cityId);
      for (const stadium of city.stadiums) {
        await createStadium(database, cityId, stadium);
      }
    }

    if (Array.isArray(city.gymLeaders)) {
      await deleteGymLeadersForCity(database, cityId);
      for (const leader of city.gymLeaders) {
        const trainerId = Number(leader.trainer_id);
        if (Number.isNaN(trainerId)) {
          throw new CityUpdateError(leader);
        }
        await createGymLeader(database, cityId, trainerId, leader);
      }
    }
  });
}
