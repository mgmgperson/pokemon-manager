import { existsSync } from 'fs';
import { mkdir, unlink } from 'fs/promises';
import { resolve } from 'path';
import crypto from 'crypto';
import sqlite3 from 'sqlite3';
import { closeDatabase, openDatabase } from '../../../infrastructure/database/sqlite';
import { ensureMetaDatabase } from '../../../infrastructure/database/metaDatabase';
import { createSaveSlot } from '../saves/save.repository';
import { populateDefaultData } from '../../../database/seeds/defaulthelper';
import { populateFullSaveData } from '../../../generators/fullSaveGenerator';
import { populateGeneratedTrainers } from '../../../generators/populateTrainerGenerator';
import { populatePokemonDetails } from '../../../generators/pokemonSetGenerator';
import { populateBadgeOwnership } from '../../../generators/badgeOwnershipGenerator';

const serverDirectory = resolve(__dirname, '../../../..');
const databaseDirectory = resolve(serverDirectory, '../database');

export interface LeagueCreationResult {
  leagueName: string;
  dbFilename: string;
  saveCode: string;
  setupType: unknown;
  createdAt: string;
  defaultDataPopulated: boolean;
  elapsedSeconds: number;
}

export class LeagueCreationError extends Error {}

function sanitizeLeagueName(leagueName: string): string {
  return leagueName.trim().replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_');
}

async function populateDefaultLeague(database: sqlite3.Database): Promise<void> {
  await populateDefaultData(database);
  await populateFullSaveData(database);
  await populateGeneratedTrainers(database);
  await populatePokemonDetails(database);
  await populateBadgeOwnership(database);
}

export async function createLeague(
  leagueName: string,
  setupType: unknown
): Promise<LeagueCreationResult> {
  const sanitizedName = sanitizeLeagueName(leagueName);
  if (!sanitizedName) {
    throw new LeagueCreationError('League name contains invalid characters');
  }
  await mkdir(databaseDirectory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dbFilename = `${sanitizedName}_${timestamp}.sqlite`;
  const databasePath = resolve(databaseDirectory, dbFilename);
  if (existsSync(databasePath)) {
    throw new LeagueCreationError('A database with this name already exists');
  }

  let database: sqlite3.Database | null = null;
  let databaseCreated = false;
  const startedAt = Date.now();
  try {
    database = await openDatabase(databasePath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
    databaseCreated = true;
    if (setupType === 'default') {
      await populateDefaultLeague(database);
    }

    const saveCode = crypto.randomBytes(8).toString('hex');
    const metaDatabase = await ensureMetaDatabase();
    try {
      await createSaveSlot(metaDatabase, {
        code: saveCode,
        name: leagueName,
        path: `../database/${dbFilename}`,
      });
    } finally {
      await closeDatabase(metaDatabase);
    }
    await closeDatabase(database);
    database = null;

    return {
      leagueName,
      dbFilename,
      saveCode,
      setupType,
      createdAt: new Date().toISOString(),
      defaultDataPopulated: setupType === 'default',
      elapsedSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(2)),
    };
  } catch (error) {
    if (database) {
      try {
        await closeDatabase(database);
      } catch (_closeError) {
        // The creation error determines the API result; closing is best-effort during cleanup.
      }
    }
    if (databaseCreated) {
      try {
        await unlink(databasePath);
      } catch (_unlinkError) {
        // Preserve the original creation error if cleanup cannot remove a partial save file.
      }
    }
    throw error;
  }
}
