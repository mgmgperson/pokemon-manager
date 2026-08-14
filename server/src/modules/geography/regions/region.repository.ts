import sqlite3 from 'sqlite3';
import { queryAll, queryOne } from '../../../infrastructure/database/sqlite';

export interface RegionSummary {
  id: number;
  name: string;
  population: number | null;
}

interface RegionSummaryRow {
  id: number;
  name: string;
  population: number | null;
}

interface RegionCityRow {
  region_name: string;
  region_population: number | null;
  city_id: number | null;
  city_name: string | null;
  city_population: number | null;
  x_coordinate: number | null;
  y_coordinate: number | null;
}

interface RegionLocationRow {
  id: number;
  name: string;
  region_id: number;
  description: string | null;
  population: number | null;
  area_coordinates: string | null;
  travel_time: number | null;
  parent_location_id: number | null;
  accessibility: number | null;
  terrain_types: string | null;
}

interface TrainerNameRow {
  trainer_id: number;
  fname: string | null;
  lname: string | null;
}

interface GymLeaderRow extends TrainerNameRow {
  type: string | null;
  city_id: number;
  city_name: string;
}

export interface RegionDetail {
  name: string;
  population: number | null;
  cities: Array<{
    id: number | null;
    name: string | null;
    population: number | null;
    x_coordinate: number | null;
    y_coordinate: number | null;
  }>;
  locations: Array<{
    id: number;
    name: string;
    region_id: number;
    description: string | null;
    population: number | null;
    area_coordinates: unknown;
    travel_time: number | null;
    parent_location_id: number | null;
    accessibility: number | null;
    terrain_types: string[];
  }>;
  champion: { id: number; name: string } | null;
  eliteFour: Array<{ id: number; name: string }>;
  gymLeaders: Array<{
    id: number;
    name: string;
    type: string | null;
    city_id: number;
    city_name: string;
  }>;
}

function formatTrainerName(trainer: TrainerNameRow): string {
  return `${trainer.fname} ${trainer.lname || ''}`;
}

function mapLocation(row: RegionLocationRow): RegionDetail['locations'][number] {
  return {
    id: row.id,
    name: row.name,
    region_id: row.region_id,
    description: row.description,
    population: row.population,
    area_coordinates: row.area_coordinates ? JSON.parse(row.area_coordinates) : null,
    travel_time: row.travel_time,
    parent_location_id: row.parent_location_id,
    accessibility: row.accessibility,
    terrain_types: row.terrain_types ? row.terrain_types.split(',') : [],
  };
}

export async function findAllRegions(database: sqlite3.Database): Promise<RegionSummary[]> {
  return queryAll<RegionSummaryRow>(
    database,
    'SELECT id, name, population FROM region',
  );
}

export async function findRegionById(
  database: sqlite3.Database,
  regionId: string
): Promise<RegionDetail | null> {
  const regionCitiesSql = `
    SELECT r.name AS region_name, r.population AS region_population,
           c.id AS city_id, c.name AS city_name, c.population AS city_population,
           c.x_coordinate, c.y_coordinate
    FROM region r
    LEFT JOIN city c ON r.id = c.region_id
    WHERE r.id = ?
    ORDER BY c.population DESC
  `;
  const locationsSql = `
    SELECT l.*, GROUP_CONCAT(DISTINCT t.name) AS terrain_types
    FROM location l
    LEFT JOIN location_terrain lt ON l.id = lt.location_id
    LEFT JOIN terrain t ON lt.terrain_id = t.id
    WHERE l.region_id = ?
    GROUP BY l.id
  `;
  const championSql = `
    SELECT t.id AS trainer_id, t.fname, t.lname
    FROM champion ch
    JOIN trainer t ON ch.trainer_id = t.id
    WHERE ch.region_id = ?
  `;
  const eliteFourSql = `
    SELECT t.id AS trainer_id, t.fname, t.lname
    FROM elite_four ef
    JOIN trainer t ON ef.trainer_id = t.id
    WHERE ef.region_id = ?
  `;
  const gymLeadersSql = `
    SELECT t.id AS trainer_id, t.fname, t.lname, g.type, c.id AS city_id, c.name AS city_name
    FROM gym_leader g
    JOIN trainer t ON g.trainer_id = t.id
    JOIN city c ON g.city_id = c.id
    WHERE c.region_id = ?
  `;

  const [regionCities, locationRows, champion, eliteFour, gymLeaders] = await Promise.all([
    queryAll<RegionCityRow>(database, regionCitiesSql, [regionId]),
    queryAll<RegionLocationRow>(database, locationsSql, [regionId]),
    queryOne<TrainerNameRow>(database, championSql, [regionId]),
    queryAll<TrainerNameRow>(database, eliteFourSql, [regionId]),
    queryAll<GymLeaderRow>(database, gymLeadersSql, [regionId]),
  ]);

  const firstRegionCity = regionCities[0];
  if (!firstRegionCity) {
    return null;
  }

  return {
    name: firstRegionCity.region_name,
    population: firstRegionCity.region_population,
    cities: regionCities.map((row) => ({
      id: row.city_id,
      name: row.city_name,
      population: row.city_population,
      x_coordinate: row.x_coordinate,
      y_coordinate: row.y_coordinate,
    })),
    locations: locationRows.map(mapLocation),
    champion: champion
      ? { id: champion.trainer_id, name: formatTrainerName(champion) }
      : null,
    eliteFour: eliteFour.map((trainer) => ({
      id: trainer.trainer_id,
      name: formatTrainerName(trainer),
    })),
    gymLeaders: gymLeaders.map((leader) => ({
      id: leader.trainer_id,
      name: formatTrainerName(leader),
      type: leader.type,
      city_id: leader.city_id,
      city_name: leader.city_name,
    })),
  };
}
