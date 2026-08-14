import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import { findActiveTrainerId, findLatestGameState } from './game-state.repository';

export async function getHomeGameState(_request: Request, response: Response): Promise<void> {
  try {
    const gameState = await findLatestGameState(getActiveDB());

    if (!gameState) {
      response.status(404).json({ message: 'No game state found' });
      return;
    }

    response.json({ message: 'success', data: gameState });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function getActiveTrainer(_request: Request, response: Response): Promise<void> {
  try {
    const activeTrainerId = await findActiveTrainerId(getActiveDB());

    if (activeTrainerId === null) {
      response.status(404).json({ message: 'No game state found' });
      return;
    }

    response.json({
      message: 'success',
      data: { active_trainer_id: activeTrainerId },
    });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}
