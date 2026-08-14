import sqlite3 from 'sqlite3';
import { queryAll, queryOne, runStatement, type StatementResult } from '../../../infrastructure/database/sqlite';

export interface TerrainAssociation {
  terrain_id: number;
  name: string;
  code: string;
  description: string | null;
  rate: number | null;
  field_id: number | null;
}

interface LocationRow {
  id: number;
  name: string;
  region_id: number;
  description: string | null;
  population: number | null;
  area_coordinates: string | null;
  travel_time: number | null;
  parent_location_id: number | null;
  accessibility: number | null;
  region_name: string | null;
  parent_location_name: string | null;
}

interface LocationDetailRow extends LocationRow {
  terrain_types: string | null;
  sub_locations: string | null;
}

interface SubLocationRow extends Omit<LocationRow, 'region_name' | 'parent_location_name'> {
  terrain_types: string | null;
}

export interface LocationSummary extends Omit<LocationRow, 'area_coordinates'> {
  area_coordinates: unknown;
  terrains: TerrainAssociation[];
}

export interface LocationDetail extends Omit<LocationDetailRow, 'area_coordinates' | 'terrain_types' | 'sub_locations'> {
  area_coordinates: unknown;
  terrain_types: string[];
  sub_locations: string[];
  terrains: TerrainAssociation[];
  shops: Array<Record<string, unknown>>;
}

export interface SubLocation extends Omit<SubLocationRow, 'area_coordinates' | 'terrain_types'> {
  area_coordinates: unknown;
  terrain_types: string[];
}

export interface LocationWriteInput {
  name?: string;
  region_id?: number;
  description?: string | null;
  population?: number | null;
  area_coordinates?: unknown;
  travel_time?: number | null;
  parent_location_id?: number | null;
  accessibility?: number | null;
}

export interface LocationTerrainWriteInput {
  terrain_id?: number;
  rate?: number | null;
  field_id?: number | null;
}

interface TerrainDefaultFieldRow {
  default_field_id: number | null;
}

function parseCoordinates(value: string | null, fallback: unknown): unknown {
  return value ? JSON.parse(value) : fallback;
}

function splitNames(value: string | null): string[] {
  return value ? value.split(',') : [];
}

export function findTerrainsForLocation(
  database: sqlite3.Database,
  locationId: string | number,
  orderByName: boolean = false
): Promise<TerrainAssociation[]> {
  return queryAll<TerrainAssociation>(
    database,
    `
      SELECT t.id AS terrain_id, t.name, t.code, t.description, lt.rate, lt.field_id
      FROM location_terrain lt
      JOIN terrain t ON lt.terrain_id = t.id
      WHERE lt.location_id = ?
      ${orderByName ? 'ORDER BY t.name' : ''}
    `,
    [locationId]
  );
}

export async function findLocations(
  database: sqlite3.Database,
  regionId?: string
): Promise<LocationSummary[]> {
  const whereClause = regionId ? 'WHERE l.region_id = ?' : '';
  const rows = await queryAll<LocationRow>(
    database,
    `
      SELECT l.*, r.name AS region_name, pl.name AS parent_location_name
      FROM location l
      LEFT JOIN region r ON l.region_id = r.id
      LEFT JOIN location pl ON l.parent_location_id = pl.id
      ${whereClause}
      ORDER BY l.id
    `,
    regionId ? [regionId] : []
  );
  return Promise.all(rows.map(async (location) => ({
    ...location,
    area_coordinates: parseCoordinates(location.area_coordinates, null),
    terrains: await findTerrainsForLocation(database, location.id, true),
  })));
}

export async function findLocationById(
  database: sqlite3.Database,
  locationId: string
): Promise<LocationDetail | null> {
  const location = await queryOne<LocationDetailRow>(
    database,
    `
      SELECT l.*, r.name AS region_name, pl.name AS parent_location_name,
             GROUP_CONCAT(DISTINCT t.name) AS terrain_types,
             (SELECT GROUP_CONCAT(sl.name) FROM location sl WHERE sl.parent_location_id = l.id) AS sub_locations
      FROM location l
      LEFT JOIN region r ON l.region_id = r.id
      LEFT JOIN location pl ON l.parent_location_id = pl.id
      LEFT JOIN location_terrain lt ON l.id = lt.location_id
      LEFT JOIN terrain t ON lt.terrain_id = t.id
      WHERE l.id = ?
      GROUP BY l.id
    `,
    [locationId]
  );
  if (!location) {
    return null;
  }
  const [terrains, shops] = await Promise.all([
    findTerrainsForLocation(database, locationId),
    queryAll<Record<string, unknown>>(database, `
      WITH location_info AS (
        SELECT l.id AS location_id, l.region_id,
               COALESCE(json_group_array(DISTINCT lt.terrain_id), '[]') AS terrain_ids
        FROM location l
        LEFT JOIN location_terrain lt ON l.id = lt.location_id
        WHERE l.id = ?
        GROUP BY l.id
      )
      SELECT DISTINCT s.*,
        CASE WHEN s.scope = 'special' THEN 'Location-specific'
             WHEN s.scope = 'regional' THEN 'Regional' END AS shop_type
      FROM shop s
      JOIN location_info li
      WHERE (s.scope = 'special' AND s.location_id = li.location_id)
         OR (s.scope = 'regional' AND s.region_id = li.region_id AND s.terrain_id IN (
           SELECT value FROM json_each(li.terrain_ids) WHERE value IS NOT NULL
         ))
    `, [locationId]),
  ]);
  return {
    ...location,
    area_coordinates: parseCoordinates(location.area_coordinates, []),
    terrain_types: splitNames(location.terrain_types),
    sub_locations: splitNames(location.sub_locations),
    terrains,
    shops,
  };
}

export async function findSubLocations(
  database: sqlite3.Database,
  locationId: string
): Promise<SubLocation[]> {
  const rows = await queryAll<SubLocationRow>(database, `
    SELECT l.*, GROUP_CONCAT(DISTINCT t.name) AS terrain_types
    FROM location l
    LEFT JOIN location_terrain lt ON l.id = lt.location_id
    LEFT JOIN terrain t ON lt.terrain_id = t.id
    WHERE l.parent_location_id = ?
    GROUP BY l.id
  `, [locationId]);
  return rows.map((location) => ({
    ...location,
    terrain_types: splitNames(location.terrain_types),
    area_coordinates: parseCoordinates(location.area_coordinates, null),
  }));
}

export function findAllTerrains(database: sqlite3.Database): Promise<Array<Record<string, unknown>>> {
  return queryAll<Record<string, unknown>>(database, 'SELECT * FROM terrain ORDER BY name');
}

export function createBasicLocation(
  database: sqlite3.Database,
  location: Required<LocationWriteInput>
): Promise<StatementResult> {
  return runStatement(database, `
    INSERT INTO location (name, region_id, description, population, area_coordinates, travel_time, parent_location_id, accessibility)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    location.name, location.region_id, location.description, location.population,
    JSON.stringify(location.area_coordinates) || '[]', location.travel_time,
    location.parent_location_id, location.accessibility,
  ]);
}

export function updateLocation(
  database: sqlite3.Database,
  locationId: string,
  location: LocationWriteInput
): Promise<void> {
  return runStatement(database, `
    UPDATE location
    SET name = ?, region_id = ?, description = ?, population = ?, area_coordinates = ?,
        travel_time = ?, parent_location_id = ?, accessibility = ?
    WHERE id = ?
  `, [
    location.name, location.region_id, location.description, location.population,
    JSON.stringify(location.area_coordinates), location.travel_time, location.parent_location_id,
    location.accessibility, locationId,
  ]).then(() => undefined);
}

export function deleteLocationTerrains(database: sqlite3.Database, locationId: string): Promise<void> {
  return runStatement(database, 'DELETE FROM location_terrain WHERE location_id = ?', [locationId]).then(() => undefined);
}

export function createLocationTerrain(
  database: sqlite3.Database,
  locationId: string | number,
  terrain: LocationTerrainWriteInput
): Promise<void> {
  return runStatement(database,
    'INSERT INTO location_terrain (location_id, terrain_id, rate, field_id) VALUES (?, ?, ?, ?)',
    [locationId, terrain.terrain_id, terrain.rate, terrain.field_id || null]
  ).then(() => undefined);
}

export function deleteLocationTerrain(
  database: sqlite3.Database,
  locationId: number,
  terrainId: number
): Promise<void> {
  return runStatement(database,
    'DELETE FROM location_terrain WHERE location_id = ? AND terrain_id = ?',
    [locationId, terrainId]
  ).then(() => undefined);
}

export async function replaceLocationTerrainRate(
  database: sqlite3.Database,
  locationId: number,
  terrainId: number,
  rate: number | undefined
): Promise<void> {
  const terrain = await queryOne<TerrainDefaultFieldRow>(
    database,
    'SELECT default_field_id FROM terrain WHERE id = ?',
    [terrainId]
  );
  await runStatement(database, `
    INSERT OR REPLACE INTO location_terrain (location_id, terrain_id, rate, field_id)
    VALUES (?, ?, ?, ?)
  `, [locationId, terrainId, rate, terrain?.default_field_id || null]);
}
