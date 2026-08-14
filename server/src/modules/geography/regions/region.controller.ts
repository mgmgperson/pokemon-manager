import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import { findAllRegions, findRegionById } from './region.repository';

export async function listRegions(_request: Request, response: Response): Promise<void> {
  try {
    const database = getActiveDB();
    const regions = await findAllRegions(database);

    response.json({
      message: 'success',
      data: regions,
    });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function getRegion(
  request: Request<{ id: string }>,
  response: Response
): Promise<void> {
  try {
    const database = getActiveDB();
    const region = await findRegionById(database, request.params.id);

    if (!region) {
      response.status(404).json({ message: 'Region not found' });
      return;
    }

    response.json({
      message: 'success',
      data: region,
    });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}
