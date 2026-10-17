import sqlite3 from 'sqlite3';
import { queryAll, queryOne } from './sqlite';
import { inspectTrainerPeakSchema, TRAINER_PEAK_SCHEMA_VERSION } from './trainerPeakSchema';

export const CITY_LOCATION_SCHEMA_VERSION = 1;

interface ColumnInfo {
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface ForeignKeyInfo {
  table: string;
  from: string;
  to: string;
}

export async function inspectCityLocationSchema(
  database: sqlite3.Database
): Promise<{ schemaVersion: number; hasLocationId: boolean }> {
  const columns = await queryAll<ColumnInfo>(database, 'PRAGMA table_info(city)');
  const expectedTypes: Record<string, string[]> = {
    id: ['INTEGER'], name: ['TEXT'], region_id: ['INTEGER'], population: ['INTEGER'],
    x_coordinate: ['FLOAT', 'REAL'], y_coordinate: ['FLOAT', 'REAL'], description: ['TEXT'],
    location_id: ['INTEGER'],
  };
  if (columns.length < 7 || columns.length > 8
    || columns.some((column) => !expectedTypes[column.name]?.includes(column.type.toUpperCase()))
    || Object.keys(expectedTypes).filter((name) => name !== 'location_id').some((name) => !columns.some((column) => column.name === name))
    || !columns.some((column) => column.name === 'id' && column.pk === 1)
    || !columns.some((column) => column.name === 'name' && column.notnull === 1)
    || !columns.some((column) => column.name === 'region_id' && column.notnull === 1)) {
    throw new Error('Unexpected city table shape; inspect this save before upgrading');
  }
  const locationColumn = columns.find((column) => column.name === 'location_id');
  if (locationColumn) {
    const foreignKeys = await queryAll<ForeignKeyInfo>(database, 'PRAGMA foreign_key_list(city)');
    if (locationColumn.notnull !== 0 || locationColumn.dflt_value !== null || locationColumn.pk !== 0
      || !foreignKeys.some((key) => key.from === 'location_id' && key.table === 'location' && key.to === 'id')) {
      throw new Error('Existing city.location_id must be nullable INTEGER with a foreign key to location(id)');
    }
  }
  const version = await queryOne<{ user_version: number }>(database, 'PRAGMA user_version');
  const schemaVersion = version?.user_version ?? 0;
  if (schemaVersion > TRAINER_PEAK_SCHEMA_VERSION || schemaVersion < 0
    || (schemaVersion >= CITY_LOCATION_SCHEMA_VERSION && !locationColumn)) {
    throw new Error(`Unsupported schema version/shape: ${schemaVersion}`);
  }
  if (schemaVersion === TRAINER_PEAK_SCHEMA_VERSION) await inspectTrainerPeakSchema(database);
  await queryAll(database, 'SELECT id, name, population FROM region LIMIT 0');
  await queryAll(database, 'SELECT id, name, region_id, population, area_coordinates FROM location LIMIT 0');
  return { schemaVersion, hasLocationId: !!locationColumn };
}

export async function requireCityLocationSchema(database: sqlite3.Database): Promise<void> {
  const schema = await inspectCityLocationSchema(database);
  if (!schema.hasLocationId || schema.schemaVersion < CITY_LOCATION_SCHEMA_VERSION) {
    throw new Error('This save needs the city/location schema upgrade. Back it up, then run '
      + 'npx ts-node src/bin/transition-city-locations.ts --database <save-path> --apply-schema from server/.');
  }
}
