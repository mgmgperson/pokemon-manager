import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import { findLeagueOverview } from './league.repository';

export async function getLeagueOverview(_request: Request, response: Response): Promise<void> {
  try {
    const leagueOverview = await findLeagueOverview(getActiveDB());
    response.json({ message: 'success', data: leagueOverview });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}
