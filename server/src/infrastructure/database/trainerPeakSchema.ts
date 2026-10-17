import sqlite3 from 'sqlite3';
import { createHash } from 'crypto';
import { queryAll, queryOne, runInTransaction, runStatement } from './sqlite';
import { validatePeakEstimates } from '../../modules/trainers/trainer/trainer-peak.validation';

export const TRAINER_PEAK_SCHEMA_VERSION = 2;
export const PEAK_ESTIMATE_COLUMNS = ['estimated_peak_ability', 'estimated_peak_ability_year'] as const;
export const PEAK_SCHEMA_UPGRADE_MESSAGE = 'This save needs the optional trainer peak-estimate upgrade. '
  + 'Inspect and back it up, then explicitly run npx ts-node src/bin/transition-trainer-peaks.ts '
  + '--database <save-path> --apply-schema --backup <new-backup-path> from server/.';

interface ColumnInfo { name: string; type: string; notnull: number; dflt_value: string | null; pk: number; }

export async function inspectTrainerPeakSchema(database: sqlite3.Database): Promise<{ schemaVersion: number; hasPeakEstimates: boolean }> {
  const columns = await queryAll<ColumnInfo>(database, 'PRAGMA table_info(trainer)');
  const types: Record<string, readonly string[]> = {
    id: ['INTEGER'], fname: ['TEXT'], lname: ['TEXT'], region_id: ['INTEGER'], birthdate: ['TEXT'],
    pwtr_rating: ['FLOAT', 'REAL'], peak_rating: ['FLOAT', 'REAL'], peak_rank: ['INTEGER'], active_status: ['BOOLEAN', 'INTEGER'],
    estimated_peak_ability: ['INTEGER'], estimated_peak_ability_year: ['INTEGER'],
  };
  const baseNames = Object.keys(types).filter((name) => !PEAK_ESTIMATE_COLUMNS.includes(name as typeof PEAK_ESTIMATE_COLUMNS[number]));
  const peakColumns = columns.filter((column) => PEAK_ESTIMATE_COLUMNS.includes(column.name as typeof PEAK_ESTIMATE_COLUMNS[number]));
  if (columns.length !== baseNames.length + peakColumns.length
    || columns.some((column) => !types[column.name]?.includes(column.type.toUpperCase()))
    || baseNames.some((name) => !columns.some((column) => column.name === name))
    || !columns.some((column) => column.name === 'id' && column.pk === 1)
    || (peakColumns.length !== 0 && peakColumns.length !== 2)
    || peakColumns.some((column) => column.notnull !== 0 || column.dflt_value !== null || column.pk !== 0)) {
    throw new Error('Unexpected trainer table shape; peak estimates require both nullable INTEGER columns with NULL defaults, or neither');
  }
  const schemaVersion = (await queryOne<{ user_version: number }>(database, 'PRAGMA user_version'))!.user_version;
  const hasPeakEstimates = peakColumns.length === 2;
  if (schemaVersion < 0 || schemaVersion > TRAINER_PEAK_SCHEMA_VERSION
    || (schemaVersion === TRAINER_PEAK_SCHEMA_VERSION) !== hasPeakEstimates) {
    throw new Error(`Unsupported trainer peak schema version/shape: ${schemaVersion}`);
  }
  return { schemaVersion, hasPeakEstimates };
}

// Legacy saves stay readable without schema mutation; writes of real estimates require an explicit upgrade.
export async function peakEstimateProjection(database: sqlite3.Database): Promise<string> {
  const { hasPeakEstimates } = await inspectTrainerPeakSchema(database);
  return PEAK_ESTIMATE_COLUMNS.map((column) => hasPeakEstimates
    ? column : `NULL AS ${column}`).join(', ');
}

export async function peakEstimateFallback(database: sqlite3.Database): Promise<string> {
  return (await inspectTrainerPeakSchema(database)).hasPeakEstimates
    ? '' : ', NULL AS estimated_peak_ability, NULL AS estimated_peak_ability_year';
}

export async function peakEstimateStorage(database: sqlite3.Database, ability: unknown, year: unknown): Promise<boolean> {
  const { hasPeakEstimates } = await inspectTrainerPeakSchema(database);
  if (!hasPeakEstimates && (ability != null || year != null)) throw new Error(PEAK_SCHEMA_UPGRADE_MESSAGE);
  return hasPeakEstimates;
}

export async function peakSchemaSnapshot(database: sqlite3.Database): Promise<string> {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(await queryAll(database, 'PRAGMA user_version')));
  const schema = await queryAll<{ type: string; name: string; tbl_name: string; sql: string | null }>(database,
    'SELECT type, name, tbl_name, sql FROM sqlite_schema ORDER BY type, name');
  hash.update(JSON.stringify(schema));
  for (const table of schema.filter((entry) => entry.type === 'table')) {
    const rows = await queryAll(database, `SELECT * FROM "${table.name.replace(/"/g, '""')}"`);
    hash.update(JSON.stringify(rows.map((row) => JSON.stringify(row)).sort()));
  }
  return hash.digest('hex');
}

export async function transitionTrainerPeakSchema(database: sqlite3.Database, verifiedBackup: sqlite3.Database): Promise<void> {
  await runInTransaction(database, async () => {
    const schema = await inspectTrainerPeakSchema(database);
    if (schema.schemaVersion < 1) throw new Error('Apply the city/location schema upgrade first');
    if (schema.hasPeakEstimates) return;
    if (await peakSchemaSnapshot(database) !== await peakSchemaSnapshot(verifiedBackup)) {
      throw new Error('The backup does not exactly match the save schema and records; nothing was upgraded');
    }
    await runStatement(database, 'ALTER TABLE trainer ADD COLUMN estimated_peak_ability INTEGER CHECK (estimated_peak_ability IS NULL OR (typeof(estimated_peak_ability) = \'integer\' AND estimated_peak_ability BETWEEN 0 AND 99))');
    await runStatement(database, 'ALTER TABLE trainer ADD COLUMN estimated_peak_ability_year INTEGER CHECK (estimated_peak_ability_year IS NULL OR (estimated_peak_ability IS NOT NULL AND typeof(estimated_peak_ability_year) = \'integer\'))');
    await runStatement(database, `PRAGMA user_version = ${TRAINER_PEAK_SCHEMA_VERSION}`);
    await inspectTrainerPeakSchema(database);
  });
}

export async function validateSavedPeakEstimate(database: sqlite3.Database, ability: unknown, year: unknown, birthdate: unknown): Promise<void> {
  const state = await queryOne<{ current_date: string | null }>(database,
    'SELECT "current_date" AS current_date FROM game_state ORDER BY last_played_at DESC, id DESC LIMIT 1');
  validatePeakEstimates(ability, year, birthdate, state?.current_date);
}
