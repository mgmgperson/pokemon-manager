import sqlite3 from 'sqlite3';
import { queryAll, queryOne } from '../../../infrastructure/database/sqlite';

export function findSavePlaceNames(database: sqlite3.Database): Promise<string[]> {
  return queryAll<{ name: string }>(database,
    'SELECT name FROM city UNION SELECT name FROM location').then((rows) => rows.map((row) => row.name));
}

export function findRegionPlaceNames(database: sqlite3.Database, regionId: number): Promise<string[]> {
  return queryAll<{ name: string }>(database,
    `SELECT name FROM (
       SELECT 'city' AS kind, id, name FROM city WHERE region_id = ?
       UNION ALL SELECT 'location', id, name FROM location WHERE region_id = ?
     ) ORDER BY kind, id`, [regionId, regionId]).then((rows) => rows.map((row) => row.name));
}

export async function findGenerationMetadata(
  database: sqlite3.Database, locationId: number
): Promise<{ databaseFile: string; description: string | null }> {
  const databases = await queryAll<{ name: string; file: string }>(database, 'PRAGMA database_list');
  const location = await queryOne<{ description: string | null }>(database,
    'SELECT description FROM location WHERE id = ?', [locationId]);
  return { databaseFile: databases.find((entry) => entry.name === 'main')?.file ?? '', description: location?.description ?? null };
}
