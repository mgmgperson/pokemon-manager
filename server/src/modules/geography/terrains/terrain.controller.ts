import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import { findAllTerrains, findTerrainById, type Terrain } from './terrain.repository';

interface TerrainResponse {
  id: number;
  code: string;
  name: string;
  description: string | null;
  default_field_id: number | null;
}

function toTerrainResponse(terrain: Terrain): TerrainResponse {
  return {
    id: terrain.id,
    code: terrain.code,
    name: terrain.name,
    description: terrain.description,
    default_field_id: terrain.defaultFieldId,
  };
}

function parsePositiveInteger(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isSafeInteger(parsedValue) ? parsedValue : null;
}

export async function listTerrains(_request: Request, response: Response): Promise<void> {
  try {
    const database = getActiveDB();
    const terrains = await findAllTerrains(database);
    response.json({
      message: 'success',
      data: terrains.map(toTerrainResponse),
    });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function getTerrain(
  request: Request<{ id: string }>,
  response: Response
): Promise<void> {
  try {
    const terrainId = parsePositiveInteger(request.params.id);

    if (terrainId === null) {
      response.status(400).json({ error: 'Invalid terrain ID' });
      return;
    }

    const database = getActiveDB();
    const terrain = await findTerrainById(database, terrainId);

    if (!terrain) {
      response.status(404).json({ message: 'Terrain not found' });
      return;
    }

    response.json({
      message: 'success',
      data: toTerrainResponse(terrain),
    });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}
