import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import { createCity, findAllCities, findCityById, type CityWriteInput } from './city.repository';
import { CityUpdateError, updateCityDetails, type CityUpdateInput } from './city.service';

function defaultCreateCoordinates(value: number | null | undefined): number {
  return value || 0.5;
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
  const city = request.body;
  if (!city.name || !city.region_id) {
    response.status(400).json({ error: 'Name and region_id are required' });
    return;
  }

  const newCity = {
    name: city.name,
    region_id: city.region_id,
    population: city.population || null,
    description: city.description || null,
    x_coordinate: defaultCreateCoordinates(city.x_coordinate),
    y_coordinate: defaultCreateCoordinates(city.y_coordinate),
  };

  try {
    const statement = await createCity(getActiveDB(), newCity);
    response.json({
      message: 'City created successfully',
      data: { id: statement.lastInsertId, ...newCity },
    });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
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
    if (error instanceof CityUpdateError) {
      response.status(400).json({ error: error.message, leader: error.leader });
      return;
    }
    response.status(400).json({ error: (error as Error).message });
  }
}
