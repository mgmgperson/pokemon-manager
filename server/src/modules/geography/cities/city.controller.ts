import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import { findAllCities, findCityById, type CityWriteInput } from './city.repository';
import { CityUpdateError, createCityDetails, updateCityDetails, type CityUpdateInput } from './city.service';
import { CityLocationError } from './city-location.service';

export function sendCityError(response: Response, error: unknown): void {
  if (error instanceof CityUpdateError) {
    response.status(400).json({ error: error.message, leader: error.leader });
    return;
  }
  response.status(error instanceof CityLocationError ? error.status : 400)
    .json({ error: error instanceof Error ? error.message : 'Unknown error' });
}

export async function listCities(_request: Request, response: Response): Promise<void> {
  try {
    response.json({ message: 'success', data: await findAllCities(getActiveDB()) });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function createCityController(
  request: Request<Record<string, never>, unknown, CityWriteInput>,
  response: Response
): Promise<void> {
  try {
    const city = await createCityDetails(getActiveDB(), request.body);
    response.json({
      message: 'City created successfully',
      data: city,
    });
  } catch (error) {
    sendCityError(response, error);
  }
}

export async function getCity(request: Request<{ id: string }>, response: Response): Promise<void> {
  try {
    const city = await findCityById(getActiveDB(), request.params.id);
    if (!city) {
      response.status(404).json({ message: 'City not found' });
      return;
    }
    response.json({ message: 'success', data: city });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function updateCityController(
  request: Request<{ id: string }, unknown, CityUpdateInput>,
  response: Response
): Promise<void> {
  try {
    await updateCityDetails(getActiveDB(), request.params.id, request.body);
    response.json({ message: 'City updated successfully', data: { id: request.params.id } });
  } catch (error) {
    sendCityError(response, error);
  }
}
