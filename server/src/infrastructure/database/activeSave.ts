import sqlite3 from 'sqlite3';
import { resolve } from 'path';
import { updateSaveLastPlayedAt } from './metaDatabase';
import { closeDatabase, openDatabase } from './sqlite';

let activeDatabase: sqlite3.Database | null = null;
const databaseCache = new Map<string, sqlite3.Database>();
const serverDirectory = resolve(__dirname, '../../..');

export async function setActiveSave(code: string, databasePath: string): Promise<void> {
  const resolvedDatabasePath = resolve(serverDirectory, databasePath);
  let database = databaseCache.get(resolvedDatabasePath);
  let openedConnection = false;

  if (!database) {
    database = await openDatabase(resolvedDatabasePath);
    databaseCache.set(resolvedDatabasePath, database);
    openedConnection = true;
  }

  try {
    await updateSaveLastPlayedAt(code);
  } catch (error) {
    if (openedConnection) {
      databaseCache.delete(resolvedDatabasePath);
      await closeDatabase(database);
    }

    throw error;
  }

  activeDatabase = database;
}

export function getActiveDB(): sqlite3.Database {
  if (!activeDatabase) {
    throw new Error('No save currently selected');
  }

  return activeDatabase;
}
