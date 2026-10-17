import sqlite3 from 'sqlite3';
import { inspectTrainerPeakSchema } from '../../../infrastructure/database/trainerPeakSchema';
import { queryAll, queryOne } from '../../../infrastructure/database/sqlite';
import { PopulationPlanningError } from './trainer-population.validation';

export interface PopulationTrainer {
  id: number;
  fname: string | null;
  lname: string | null;
  region_id: number | null;
  birthdate: string | null;
  pwtr_rating: number | null;
  estimated_peak_ability?: number | null;
  estimated_peak_ability_year?: number | null;
  active_status: number | null;
}

export interface PopulationSource {
  databaseFile: string;
  schemaVersion: number;
  gameDate: string | null;
  trainers: PopulationTrainer[];
  regions: Array<{ id: number; name: string; population: number | null }>;
  cities: Array<{ id: number; name: string; region_id: number; population: number | null; location_id: number | null }>;
  locations: Array<{ id: number; region_id: number; area_coordinates: string | null }>;
  nameFrequencies: Array<{ id: number; region_id: number; type: string; country: string; frequency: number }>;
}

async function readChangeMarker(database: sqlite3.Database): Promise<string> {
  const [version, changes] = await Promise.all([
    queryOne<{ data_version: number }>(database, 'PRAGMA data_version'),
    queryOne<{ changes: number }>(database, 'SELECT total_changes() AS changes'),
  ]);
  return JSON.stringify([version?.data_version, changes?.changes]);
}

export async function readPopulationSource(database: sqlite3.Database): Promise<PopulationSource> {
  const before = await readChangeMarker(database);
  const { hasPeakEstimates } = await inspectTrainerPeakSchema(database);
  const [databases, version, gameState, trainers, regions, cities, locations, nameFrequencies] = await Promise.all([
    queryAll<{ name: string; file: string }>(database, 'PRAGMA database_list'),
    queryOne<{ user_version: number }>(database, 'PRAGMA user_version'),
    queryOne<{ current_date: string | null }>(database,
      'SELECT "current_date" AS current_date FROM game_state ORDER BY last_played_at DESC, id DESC LIMIT 1'),
    queryAll<PopulationTrainer>(database,
      `SELECT id, fname, lname, region_id, birthdate, pwtr_rating, active_status
        ${hasPeakEstimates ? ', estimated_peak_ability, estimated_peak_ability_year' : ''} FROM trainer ORDER BY id`),
    queryAll<PopulationSource['regions'][number]>(database,
      'SELECT id, name, population FROM region ORDER BY id'),
    queryAll<PopulationSource['cities'][number]>(database,
      'SELECT id, name, region_id, population, location_id FROM city ORDER BY id'),
    queryAll<PopulationSource['locations'][number]>(database,
      'SELECT id, region_id, area_coordinates FROM location ORDER BY id'),
    queryAll<PopulationSource['nameFrequencies'][number]>(database,
      'SELECT id, region_id, type, country, frequency FROM region_name_frequency ORDER BY id'),
  ]);
  if (before !== await readChangeMarker(database)) {
    throw new PopulationPlanningError(409, 'The save changed during population inspection; retry against a stable snapshot');
  }
  return {
    databaseFile: databases.find((entry) => entry.name === 'main')?.file ?? '',
    schemaVersion: version?.user_version ?? 0,
    gameDate: gameState?.current_date ?? null,
    trainers, regions, cities, locations, nameFrequencies,
  };
}
