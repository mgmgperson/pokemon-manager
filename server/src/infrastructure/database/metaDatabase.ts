import { resolve } from 'path';
import sqlite3 from 'sqlite3';
import { closeDatabase, openDatabase, runStatement } from './sqlite';

const serverDirectory = resolve(__dirname, '../../..');
const metaDatabasePath = resolve(serverDirectory, '../database/meta.sqlite');

export function openMetaDatabase() {
  return openDatabase(metaDatabasePath);
}

export async function ensureMetaDatabase() {
  const database = await openDatabase(
    metaDatabasePath,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
  );

  try {
    await runStatement(database, `
      CREATE TABLE IF NOT EXISTS save_slot (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_played_at TEXT,
        path TEXT NOT NULL
      )
    `);
  } catch (error) {
    await closeDatabase(database);
    throw error;
  }

  return database;
}

export async function updateSaveLastPlayedAt(saveCode: string): Promise<void> {
  const database = await openMetaDatabase();

  try {
    await runStatement(
      database,
      'UPDATE save_slot SET last_played_at = datetime("now") WHERE code = ?',
      [saveCode]
    );
  } finally {
    await closeDatabase(database);
  }
}
