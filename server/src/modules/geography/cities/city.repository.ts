import sqlite3 from 'sqlite3';
import { queryAll, queryOne, runStatement, type StatementResult } from '../../../infrastructure/database/sqlite';

export interface City {
  id: number;
  name: string;
  region_id: number;
  population: number | null;
  x_coordinate: number | null;
  y_coordinate: number | null;
  description: string | null;
}

interface CityDetailRow {
  id: number;
  name: string;
  population: number | null;
  description: string | null;
  x_coordinate: number | null;
  y_coordinate: number | null;
  region_id: number;
  region_name: string;
}

interface StadiumRow {
  id: number;
  name: string | null;
  type: string | null;
  capacity: number | null;
}

interface GymLeaderRow {
  id: number;
  badge: number;
  type: string | null;
  trainer_id: number;
  fname: string | null;
  lname: string | null;
}

export interface CityDetail {
  id: number;
  name: string;
  population: number | null;
  description: string | null;
  x_coordinate: number | null;
  y_coordinate: number | null;
  region: { id: number; name: string };
  stadiums: StadiumRow[];
  gymLeaders: Array<{
    id: number;
    trainer_id: number;
    name: string;
    badge: number;
    type: string | null;
  }>;
}

export interface CityWriteInput {
  name?: string;
  region_id?: number;
  population?: number | null;
  description?: string | null;
  x_coordinate?: number | null;
  y_coordinate?: number | null;
}

export interface StadiumWriteInput {
  name?: string;
  type?: string | null;
  capacity?: number | null;
}

export interface GymLeaderWriteInput {
  trainer_id?: number | string;
  badge?: number | null;
  type?: string | null;
}

export function findAllCities(database: sqlite3.Database): Promise<City[]> {
  return queryAll<City>(database, 'SELECT * FROM city');
}

export async function findCityById(
  database: sqlite3.Database,
  cityId: string
): Promise<CityDetail | null> {
  const city = await queryOne<CityDetailRow>(
    database,
    `
      SELECT c.id, c.name, c.population, c.description, c.x_coordinate, c.y_coordinate,
             r.id AS region_id, r.name AS region_name
      FROM city c
      JOIN region r ON c.region_id = r.id
      WHERE c.id = ?
    `,
    [cityId]
  );

  if (!city) {
    return null;
  }

  const [stadiums, gymLeaders] = await Promise.all([
    queryAll<StadiumRow>(
      database,
      'SELECT s.id, s.name, s.type, s.capacity FROM stadium s WHERE s.city_id = ?',
      [cityId]
    ),
    queryAll<GymLeaderRow>(
      database,
      `
        SELECT g.id, g.badge, g.type, g.trainer_id, t.fname, t.lname
        FROM gym_leader g
        JOIN trainer t ON g.trainer_id = t.id
        WHERE g.city_id = ?
      `,
      [cityId]
    ),
  ]);

  return {
    id: city.id,
    name: city.name,
    population: city.population,
    description: city.description,
    x_coordinate: city.x_coordinate,
    y_coordinate: city.y_coordinate,
    region: { id: city.region_id, name: city.region_name },
    stadiums,
    gymLeaders: gymLeaders.map((leader) => ({
      id: leader.id,
      trainer_id: leader.trainer_id,
      name: `${leader.fname} ${leader.lname || ''}`,
      badge: leader.badge,
      type: leader.type,
    })),
  };
}

export function createCity(
  database: sqlite3.Database,
  city: Required<CityWriteInput>
): Promise<StatementResult> {
  return runStatement(
    database,
    `
      INSERT INTO city (name, region_id, population, description, x_coordinate, y_coordinate)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [city.name, city.region_id, city.population, city.description, city.x_coordinate, city.y_coordinate]
  );
}

export function updateCity(
  database: sqlite3.Database,
  cityId: string,
  city: CityWriteInput
): Promise<void> {
  return runStatement(
    database,
    `
      UPDATE city
      SET name = ?, region_id = ?, population = ?, description = ?, x_coordinate = ?, y_coordinate = ?
      WHERE id = ?
    `,
    [
      city.name,
      city.region_id,
      city.population,
      city.description,
      city.x_coordinate,
      city.y_coordinate,
      cityId,
    ]
  ).then(() => undefined);
}

export function deleteStadiumsForCity(database: sqlite3.Database, cityId: string): Promise<void> {
  return runStatement(database, 'DELETE FROM stadium WHERE city_id = ?', [cityId]).then(() => undefined);
}

export function createStadium(
  database: sqlite3.Database,
  cityId: string,
  stadium: StadiumWriteInput
): Promise<void> {
  return runStatement(
    database,
    'INSERT INTO stadium (name, type, capacity, city_id) VALUES (?, ?, ?, ?)',
    [stadium.name, stadium.type || null, stadium.capacity || null, cityId]
  ).then(() => undefined);
}

export function deleteGymLeadersForCity(database: sqlite3.Database, cityId: string): Promise<void> {
  return runStatement(database, 'DELETE FROM gym_leader WHERE city_id = ?', [cityId]).then(() => undefined);
}

export function createGymLeader(
  database: sqlite3.Database,
  cityId: string,
  trainerId: number,
  leader: GymLeaderWriteInput
): Promise<void> {
  return runStatement(
    database,
    'INSERT INTO gym_leader (trainer_id, badge, type, city_id) VALUES (?, ?, ?, ?)',
    [trainerId, leader.badge || null, leader.type, cityId]
  ).then(() => undefined);
}
