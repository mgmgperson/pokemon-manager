import { copyFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { closeDatabase } from '../../../infrastructure/database/sqlite';
import { openMetaDatabase } from '../../../infrastructure/database/metaDatabase';
import {
  createSaveSlot,
  deleteSaveSlot,
  findSaveSlotFile,
  findSaveSlots,
  renameSaveSlot,
  type SaveSlot,
  type SaveSlotFile,
} from './save.repository';

const serverDirectory = resolve(__dirname, '../../../..');

function resolveSavePath(relativePath: string): string {
  return resolve(serverDirectory, relativePath);
}

async function withMetaDatabase<T>(work: (database: Awaited<ReturnType<typeof openMetaDatabase>>) => Promise<T>): Promise<T> {
  const database = await openMetaDatabase();
  try {
    return await work(database);
  } finally {
    await closeDatabase(database);
  }
}

export function listSaveSlots(): Promise<SaveSlot[]> {
  return withMetaDatabase(findSaveSlots);
}

export async function renameSaveSlotById(saveId: string, name: string): Promise<boolean> {
  const statement = await withMetaDatabase((database) => renameSaveSlot(database, saveId, name));
  return statement.changes > 0;
}

export async function getSaveForDownload(saveId: string): Promise<{ save: SaveSlotFile; path: string } | null> {
  const save = await withMetaDatabase((database) => findSaveSlotFile(database, saveId));
  if (!save) {
    return null;
  }
  return { save, path: resolveSavePath(save.path) };
}

export async function cloneSaveSlot(saveId: string): Promise<SaveSlotFile & { id: number }> {
  const originalSave = await withMetaDatabase((database) => findSaveSlotFile(database, saveId));
  if (!originalSave) {
    throw new SaveNotFoundError();
  }
  const originalPath = resolveSavePath(originalSave.path);
  if (!existsSync(originalPath)) {
    throw new SaveFileNotFoundError('Original save file not found');
  }
  const timestamp = Date.now();
  const code = `${originalSave.code}_clone_${timestamp}`;
  const pathParts = originalSave.path.split('/');
  pathParts.pop();
  const path = `${pathParts.join('/')}/${code}.sqlite`;
  const clonePath = resolveSavePath(path);
  await copyFile(originalPath, clonePath);

  try {
    const statement = await withMetaDatabase((database) => createSaveSlot(database, {
      code,
      name: `${originalSave.name} Clone`,
      path,
    }));
    return { id: statement.lastInsertId, code, name: `${originalSave.name} Clone`, path };
  } catch (error) {
    try {
      await unlink(clonePath);
    } catch (_unlinkError) {
      // The metadata insert failure is the response-driving error; cleanup is best-effort.
    }
    throw error;
  }
}

export async function deleteSaveSlotById(saveId: string): Promise<boolean> {
  const save = await withMetaDatabase((database) => findSaveSlotFile(database, saveId));
  if (!save) {
    return false;
  }
  const statement = await withMetaDatabase((database) => deleteSaveSlot(database, saveId));
  if (statement.changes === 0) {
    return false;
  }
  const savePath = resolveSavePath(save.path);
  if (existsSync(savePath)) {
    try {
      await unlink(savePath);
    } catch (error) {
      console.warn('Could not delete save file:', error);
    }
  }
  return true;
}

export class SaveNotFoundError extends Error {}
export class SaveFileNotFoundError extends Error {}
