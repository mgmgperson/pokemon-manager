import { type Request, type Response } from 'express';
import { LeagueCreationError, createLeague } from './league-creation.service';

interface CreateLeagueBody {
  leagueName?: unknown;
  setupType?: unknown;
}

export async function createLeagueController(
  request: Request<Record<string, never>, unknown, CreateLeagueBody>,
  response: Response
): Promise<void> {
  const { leagueName, setupType } = request.body;
  if (typeof leagueName !== 'string' || leagueName.trim() === '') {
    response.status(400).json({ error: 'League name is required' });
    return;
  }
  try {
    response.json({ message: 'League created successfully', data: await createLeague(leagueName, setupType) });
  } catch (error) {
    if (error instanceof LeagueCreationError) {
      const status = error.message === 'A database with this name already exists' ? 409 : 400;
      response.status(status).json({ error: error.message });
      return;
    }
    console.error('Error in create-league route:', error);
    response.status(500).json({ error: 'Failed to populate database with default data' });
  }
}
