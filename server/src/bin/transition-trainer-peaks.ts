import { open, realpath } from 'fs/promises';
import { resolve } from 'path';
import sqlite3 from 'sqlite3';
import { inspectCityLocationSchema } from '../infrastructure/database/cityLocationSchema';
import { inspectTrainerPeakSchema, peakSchemaSnapshot, transitionTrainerPeakSchema } from '../infrastructure/database/trainerPeakSchema';
import { closeDatabase, openDatabase, queryAll, queryOne, runInTransaction, runStatement } from '../infrastructure/database/sqlite';

function options(argumentsList: string[]): { databasePath: string; backupPath?: string; apply: boolean } {
  const values = new Map<string, string>();
  let apply = false;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--apply-schema' && !apply) { apply = true; continue; }
    if (!['--database', '--backup'].includes(argument) || values.has(argument)) throw new Error(`Unknown or repeated argument: ${argument}`);
    const value = argumentsList[++index];
    if (!value || value.startsWith('--')) throw new Error(`${argument} requires a path`);
    values.set(argument, resolve(value));
  }
  const databasePath = values.get('--database');
  const backupPath = values.get('--backup');
  if (!databasePath) throw new Error('--database is required; there is no default save');
  if (apply !== !!backupPath) throw new Error('--apply-schema and --backup <new-backup-path> must be used together');
  return { databasePath, backupPath, apply };
}

async function inspect(database: sqlite3.Database) {
  const schema = await inspectTrainerPeakSchema(database);
  await inspectCityLocationSchema(database);
  return { ...schema,
    trainerCount: (await queryOne<{ count: number }>(database, 'SELECT COUNT(*) AS count FROM trainer'))!.count,
    currentDate: (await queryOne<{ current_date: string | null }>(database,
      'SELECT "current_date" AS current_date FROM game_state ORDER BY last_played_at DESC, id DESC LIMIT 1'))?.current_date ?? null,
    transitionNeeded: !schema.hasPeakEstimates,
    compatibility: 'Versions 1 and 2 remain selectable; version 1 reads estimates as unknown and rejects storing estimates until explicitly upgraded.',
  };
}

async function main(): Promise<void> {
  const input = options(process.argv.slice(2));
  const databasePath = await realpath(input.databasePath);
  const database = await openDatabase(databasePath, input.apply ? sqlite3.OPEN_READWRITE : sqlite3.OPEN_READONLY);
  let backup: sqlite3.Database | null = null;
  let backupSnapshot: string | undefined;
  let applied = false;
  try {
    const before = await runInTransaction(database, () => inspect(database));
    if (input.apply && before.transitionNeeded) {
      if (before.schemaVersion !== 1) throw new Error('Apply the city/location upgrade first; this tool upgrades version 1 to 2 only');
      const integrity = await queryAll<{ integrity_check: string }>(database, 'PRAGMA integrity_check');
      if (integrity.length !== 1 || integrity[0].integrity_check !== 'ok') throw new Error('Save integrity check failed');
      // Reserve a new path exclusively. VACUUM INTO creates a consistent standalone copy, including WAL data.
      const reservation = await open(input.backupPath!, 'wx');
      await reservation.close();
      await runStatement(database, 'VACUUM INTO ?', [input.backupPath!]);
      backup = await openDatabase(input.backupPath!, sqlite3.OPEN_READONLY);
      await inspect(backup);
      const backupIntegrity = await queryAll<{ integrity_check: string }>(backup, 'PRAGMA integrity_check');
      if (backupIntegrity.length !== 1 || backupIntegrity[0].integrity_check !== 'ok') throw new Error('Backup integrity check failed');
      backupSnapshot = await peakSchemaSnapshot(backup);
      await transitionTrainerPeakSchema(database, backup);
      applied = true;
    }
    process.stdout.write(`${JSON.stringify({ databasePath, applied, backupPath: backup ? input.backupPath : null,
      backupSnapshot, ...await runInTransaction(database, () => inspect(database)) }, null, 2)}\n`);
  } finally {
    if (backup) await closeDatabase(backup);
    await closeDatabase(database);
  }
}

if (require.main === module) main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.stderr.write('Usage: npx ts-node src/bin/transition-trainer-peaks.ts --database <path> [--apply-schema --backup <new-backup-path>]\n');
  process.exitCode = 1;
});
