import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import { findMatchHistory, findRecentPokemon, findTravelHistory } from './history.repository';

interface RecentPokemonQuery {
  limit?: string | string[];
}

function parseLegacyLimit(value: string | string[] | undefined): number {
  return value ? parseInt(value as string, 10) : 20;
}

export async function getTravelHistory(
  request: Request<{ trainerId: string }>,
  response: Response
): Promise<void> {
  try {
    const history = await findTravelHistory(getActiveDB(), request.params.trainerId);
    response.json({ success: true, data: history });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function getMatchHistory(
  request: Request<{ trainerId: string }>,
  response: Response
): Promise<void> {
  try {
    const history = await findMatchHistory(getActiveDB(), request.params.trainerId);
    response.json({ success: true, data: history });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function getRecentPokemon(
  request: Request<{ trainerId: string }, unknown, unknown, RecentPokemonQuery>,
  response: Response
): Promise<void> {
  try {
    const pokemon = await findRecentPokemon(
      getActiveDB(),
      request.params.trainerId,
      parseLegacyLimit(request.query.limit)
    );
    response.json({ success: true, data: pokemon });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}
