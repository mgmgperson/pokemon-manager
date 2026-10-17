import { readFile } from 'fs/promises';
import { resolve } from 'path';
import sqlite3 from 'sqlite3';
import { closeDatabase, openDatabase } from '../infrastructure/database/sqlite';
import { planTrainerPopulation } from '../modules/trainers/population/trainer-population.service';

const usage = 'Usage: npx ts-node src/bin/plan-trainer-population.ts --database <existing-copy.sqlite> [--settings <planning-input.json>]';

async function main(): Promise<void> {
  let databasePath: string | undefined;
  let settingsPath: string | undefined;
  for (let index = 2; index < process.argv.length; index += 2) {
    const argument = process.argv[index];
    const value = process.argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value`);
    if (argument === '--database' && databasePath === undefined) databasePath = resolve(value);
    else if (argument === '--settings' && settingsPath === undefined) settingsPath = resolve(value);
    else throw new Error(`Unknown or repeated argument: ${argument}`);
  }
  if (!databasePath) throw new Error('--database is required; there is no default save');
  const settings: unknown = settingsPath ? JSON.parse(await readFile(settingsPath, 'utf8')) : {};
  const database = await openDatabase(databasePath, sqlite3.OPEN_READONLY);
  try {
    process.stdout.write(`${JSON.stringify(await planTrainerPopulation(database, settings), null, 2)}\n`);
  } finally {
    await closeDatabase(database);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Population planning failed'}\n${usage}\n`);
  process.exitCode = 1;
});
