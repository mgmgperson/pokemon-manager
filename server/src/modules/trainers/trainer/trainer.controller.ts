import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import {
  createTrainer,
  findActiveTrainers,
  findInactiveTrainers,
  findPokemonForTrainer,
  findTrainerDetail,
  updateFieldRatings,
  updateMentalRatings,
  updateTrainer,
} from './trainer.repository';
import { updateFormatRatingsAndOverall } from './trainer.service';
import type {
  FieldRatingWriteInput,
  FormatRatingWriteInput,
  MentalRatingWriteInput,
  TrainerWriteInput,
} from './trainer.types';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function sendDatabaseError(response: Response, error: unknown): void {
  response.status(400).json({ error: errorMessage(error) });
}

export async function listTrainers(_request: Request, response: Response): Promise<void> {
  try {
    response.json({ message: 'success', data: await findActiveTrainers(getActiveDB()) });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}

export async function listInactiveTrainers(_request: Request, response: Response): Promise<void> {
  try {
    response.json({ message: 'success', data: await findInactiveTrainers(getActiveDB()) });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}

export async function getTrainer(
  request: Request<{ id: string }>,
  response: Response
): Promise<void> {
  try {
    const trainer = await findTrainerDetail(getActiveDB(), request.params.id);
    if (!trainer) {
      response.status(404).json({ error: 'Trainer not found' });
      return;
    }

    response.json({ message: 'success', data: trainer });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}

export async function listTrainerPokemon(
  request: Request<{ id: string }>,
  response: Response
): Promise<void> {
  try {
    response.json({
      message: 'success',
      data: await findPokemonForTrainer(getActiveDB(), request.params.id),
    });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}

export async function createTrainerController(
  request: Request<Record<string, never>, unknown, TrainerWriteInput>,
  response: Response
): Promise<void> {
  try {
    const statement = await createTrainer(getActiveDB(), request.body);
    response.json({
      message: 'success',
      data: { id: statement.lastInsertId, ...request.body },
    });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}

export async function updateTrainerController(
  request: Request<{ id: string }, unknown, TrainerWriteInput>,
  response: Response
): Promise<void> {
  try {
    const statement = await updateTrainer(getActiveDB(), request.params.id, request.body);
    response.json({
      message: 'success',
      data: { id: request.params.id, ...request.body },
      changes: statement.changes,
    });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}

export async function updateFieldRatingsController(
  request: Request<{ id: string }, unknown, FieldRatingWriteInput>,
  response: Response
): Promise<void> {
  try {
    const statement = await updateFieldRatings(getActiveDB(), request.body);
    response.json({
      message: 'success',
      data: request.body,
      changes: statement.changes,
    });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}

export async function updateMentalRatingsController(
  request: Request<{ id: string }, unknown, MentalRatingWriteInput>,
  response: Response
): Promise<void> {
  try {
    const statement = await updateMentalRatings(getActiveDB(), request.body);
    response.json({
      message: 'success',
      data: request.body,
      changes: statement.changes,
    });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}

export async function updateFormatRatingsController(
  request: Request<{ id: string }, unknown, FormatRatingWriteInput>,
  response: Response
): Promise<void> {
  try {
    const updateResult = await updateFormatRatingsAndOverall(getActiveDB(), request.body);
    response.json({
      message: 'success',
      data: request.body,
      overall_rating: updateResult.overallRating,
      changes: updateResult.changes,
    });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}
