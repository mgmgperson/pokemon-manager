import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import {
  createBasicLocation,
  findAllTerrains,
  findLocationById,
  findLocations,
  findSubLocations,
  type LocationWriteInput,
} from './location.repository';
import {
  updateLocationDetails,
  updateTerrainRates,
  type LocationUpdateInput,
  type TerrainRateUpdate,
} from './location.service';

interface LocationQuery { region_id?: string | string[]; }
interface TerrainRateBody { updates?: unknown; }

function sendError(response: Response, error: unknown): void {
  response.status(400).json({ error: (error as Error).message });
}

export async function listLocations(
  request: Request<Record<string, never>, unknown, unknown, LocationQuery>,
  response: Response
): Promise<void> {
  try {
    const regionId = typeof request.query.region_id === 'string' ? request.query.region_id : undefined;
    const locations = await findLocations(getActiveDB(), regionId);
    response.json({ message: 'success', data: locations });
  } catch (error) {
    sendError(response, error);
  }
}

export async function createLocation(
  request: Request<Record<string, never>, unknown, LocationWriteInput>,
  response: Response
): Promise<void> {
  const location = request.body;
  if (!location.name || !location.region_id) {
    response.status(400).json({ error: 'Name and region_id are required' });
    return;
  }

  const newLocation = {
    name: location.name,
    region_id: location.region_id,
    description: location.description || null,
    population: location.population || null,
    area_coordinates: location.area_coordinates,
    travel_time: location.travel_time || 1,
    parent_location_id: location.parent_location_id || null,
    accessibility: location.accessibility || 1,
  };

  try {
    const statement = await createBasicLocation(getActiveDB(), newLocation);
    response.json({
      message: 'Location created successfully',
      data: { id: statement.lastInsertId, ...newLocation, parent_location_id: location.parent_location_id },
    });
  } catch (error) {
    sendError(response, error);
  }
}

export async function changeTerrainRates(
  request: Request<Record<string, never>, unknown, TerrainRateBody>,
  response: Response
): Promise<void> {
  if (!Array.isArray(request.body.updates)) {
    response.status(400).json({ error: 'Updates array is required' });
    return;
  }
  if (request.body.updates.length === 0) {
    response.json({ message: 'No updates to process' });
    return;
  }

  try {
    await updateTerrainRates(getActiveDB(), request.body.updates as TerrainRateUpdate[]);
    response.json({ message: 'Terrain rates updated successfully' });
  } catch (error) {
    sendError(response, error);
  }
}

export async function getLocation(request: Request<{ id: string }>, response: Response): Promise<void> {
  try {
    const location = await findLocationById(getActiveDB(), request.params.id);
    if (!location) {
      response.status(404).json({ message: 'Location not found' });
      return;
    }
    response.json({ message: 'success', data: location });
  } catch (error) {
    sendError(response, error);
  }
}

export async function listSubLocations(request: Request<{ id: string }>, response: Response): Promise<void> {
  try {
    const locations = await findSubLocations(getActiveDB(), request.params.id);
    response.json({ message: 'success', data: locations });
  } catch (error) {
    sendError(response, error);
  }
}

export async function updateLocationController(
  request: Request<{ id: string }, unknown, LocationUpdateInput>,
  response: Response
): Promise<void> {
  try {
    await updateLocationDetails(getActiveDB(), request.params.id, request.body);
    response.json({ message: 'Location updated successfully', data: { id: request.params.id } });
  } catch (error) {
    sendError(response, error);
  }
}

export async function listTerrains(_request: Request, response: Response): Promise<void> {
  try {
    const terrains = await findAllTerrains(getActiveDB());
    response.json({ message: 'success', data: terrains });
  } catch (error) {
    sendError(response, error);
  }
}
