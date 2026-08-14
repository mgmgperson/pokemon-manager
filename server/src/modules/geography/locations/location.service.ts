import sqlite3 from 'sqlite3';
import { runInTransaction } from '../../../infrastructure/database/sqlite';
import {
  deleteLocationTerrain,
  deleteLocationTerrains,
  createLocationTerrain,
  replaceLocationTerrainRate,
  updateLocation,
  type LocationTerrainWriteInput,
  type LocationWriteInput,
} from './location.repository';

export interface LocationUpdateInput extends LocationWriteInput {
  terrains?: LocationTerrainWriteInput[];
}

export interface TerrainRateUpdate {
  location_id?: number;
  terrain_id?: number;
  rate?: number | null;
}

export function updateLocationDetails(
  database: sqlite3.Database,
  locationId: string,
  location: LocationUpdateInput
): Promise<void> {
  return runInTransaction(database, async () => {
    await updateLocation(database, locationId, location);
    if (Array.isArray(location.terrains)) {
      await deleteLocationTerrains(database, locationId);
      for (const terrain of location.terrains) {
        await createLocationTerrain(database, locationId, terrain);
      }
    }
  });
}

export function updateTerrainRates(
  database: sqlite3.Database,
  updates: TerrainRateUpdate[]
): Promise<void> {
  return runInTransaction(database, async () => {
    for (const update of updates) {
      if (update.location_id === undefined || update.terrain_id === undefined) {
        throw new Error('location_id and terrain_id are required');
      }
      if (update.rate === null || update.rate === 0) {
        await deleteLocationTerrain(database, update.location_id, update.terrain_id);
      } else {
        await replaceLocationTerrainRate(database, update.location_id, update.terrain_id, update.rate);
      }
    }
  });
}
