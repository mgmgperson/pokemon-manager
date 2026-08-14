import sqlite3 from 'sqlite3';
import { queryAll, queryOne, runStatement, type StatementResult } from '../../../infrastructure/database/sqlite';

export interface SaveSlot {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  lastPlayedAt: string | null;
  path: string;
}

export interface SaveSlotFile {
  path: string;
  name: string;
  code: string;
}

export function findSaveSlots(database: sqlite3.Database): Promise<SaveSlot[]> {
  return queryAll<SaveSlot>(database, `
    SELECT id, code, name, created_at AS createdAt, last_played_at AS lastPlayedAt, path
    FROM save_slot
    ORDER BY created_at DESC
  `);
}

export function findSaveSlotFile(
  database: sqlite3.Database,
  saveId: string
): Promise<SaveSlotFile | null> {
  return queryOne<SaveSlotFile>(
    database,
    'SELECT path, name, code FROM save_slot WHERE id = ?',
    [saveId]
  );
}

export function renameSaveSlot(
  database: sqlite3.Database,
  saveId: string,
  name: string
): Promise<StatementResult> {
  return runStatement(database, 'UPDATE save_slot SET name = ? WHERE id = ?', [name, saveId]);
}

export function createSaveSlot(
  database: sqlite3.Database,
  save: SaveSlotFile
): Promise<StatementResult> {
  return runStatement(database, `
    INSERT INTO save_slot (code, name, path, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `, [save.code, save.name, save.path]);
}

export function deleteSaveSlot(database: sqlite3.Database, saveId: string): Promise<StatementResult> {
  return runStatement(database, 'DELETE FROM save_slot WHERE id = ?', [saveId]);
}
