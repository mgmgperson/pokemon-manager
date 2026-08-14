import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import {
  createTrainingProgram,
  createTrainingSession,
  deleteTrainingSession,
  findTrainingProgramById,
  findTrainingPrograms,
  findTrainingSessionById,
  findTrainingSessionsForPokemon,
  findTrainingSessionsForProgram,
  updateTrainingProgram,
  updateTrainingSession,
  type TrainingProgramWriteInput,
  type TrainingSessionCreateInput,
  type TrainingSessionUpdateInput,
} from './training.repository';

export async function listTrainingPrograms(
  request: Request<{ trainerId: string }>,
  response: Response
): Promise<void> {
  try {
    response.json({ message: 'success', data: await findTrainingPrograms(getActiveDB(), request.params.trainerId) });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function getTrainingProgram(
  request: Request<{ id: string }>,
  response: Response
): Promise<void> {
  try {
    const program = await findTrainingProgramById(getActiveDB(), request.params.id);
    if (!program) {
      response.status(404).json({ message: 'Training program not found' });
      return;
    }
    response.json({ message: 'success', data: program });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function createTrainingProgramController(
  request: Request<Record<string, never>, unknown, TrainingProgramWriteInput>,
  response: Response
): Promise<void> {
  try {
    const statement = await createTrainingProgram(getActiveDB(), request.body);
    response.json({ message: 'success', data: { id: statement.lastInsertId } });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function updateTrainingProgramController(
  request: Request<{ id: string }, unknown, TrainingProgramWriteInput>,
  response: Response
): Promise<void> {
  try {
    await updateTrainingProgram(getActiveDB(), request.params.id, request.body);
    response.json({ message: 'success', data: { id: request.params.id } });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function listProgramSessions(
  request: Request<{ programId: string }>,
  response: Response
): Promise<void> {
  try {
    response.json({ message: 'success', data: await findTrainingSessionsForProgram(getActiveDB(), request.params.programId) });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function listPokemonSessions(
  request: Request<{ pokemonId: string }>,
  response: Response
): Promise<void> {
  try {
    response.json({ message: 'success', data: await findTrainingSessionsForPokemon(getActiveDB(), request.params.pokemonId) });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function createTrainingSessionController(
  request: Request<Record<string, never>, unknown, TrainingSessionCreateInput>,
  response: Response
): Promise<void> {
  try {
    const statement = await createTrainingSession(getActiveDB(), request.body);
    response.json({ message: 'success', data: { id: statement.lastInsertId } });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function updateTrainingSessionController(
  request: Request<{ id: string }, unknown, TrainingSessionUpdateInput>,
  response: Response
): Promise<void> {
  try {
    await updateTrainingSession(getActiveDB(), request.params.id, request.body);
    response.json({ message: 'success', data: { id: request.params.id } });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function getTrainingSession(
  request: Request<{ id: string }>,
  response: Response
): Promise<void> {
  try {
    const session = await findTrainingSessionById(getActiveDB(), request.params.id);
    if (!session) {
      response.status(404).json({ message: 'Training session not found' });
      return;
    }
    response.json({ message: 'success', data: session });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function deleteTrainingSessionController(
  request: Request<{ id: string }>,
  response: Response
): Promise<void> {
  try {
    await deleteTrainingSession(getActiveDB(), request.params.id);
    response.json({ message: 'success', data: { id: request.params.id } });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}
