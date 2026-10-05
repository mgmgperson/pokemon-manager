import { resolve } from 'path';
import sqlite3 from 'sqlite3';
import { openDatabase } from './sqlite';

const namesDatabasePath = resolve(__dirname, '../../../../database/names.sqlite');
let namesDatabasePromise: Promise<sqlite3.Database> | null = null;

/**
 * Opens the immutable name-reference database once per server process.
 */
export function getNamesDatabase(): Promise<sqlite3.Database> {
  if (!namesDatabasePromise) {
    namesDatabasePromise = openDatabase(namesDatabasePath, sqlite3.OPEN_READONLY);
  }

  return namesDatabasePromise;
}
