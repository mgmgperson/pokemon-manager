import type { Request, Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import { inspectTrainerPopulation, planTrainerPopulation } from './trainer-population.service';
import { PopulationPlanningError } from './trainer-population.validation';
import { createPopulationProposal, reviewCohortBrief } from './trainer-population-cohort.service';
import { applySelectedPopulationProposal, reviewPopulationProposal } from './trainer-population-review.service';
import { rerollPopulationTrainer } from './trainer-population-reroll.service';

function sendError(response: Response, error: unknown): void {
  response.status(error instanceof PopulationPlanningError ? error.status : 500).json({
    error: error instanceof Error ? error.message : 'Population inspection failed',
  });
}

export async function inspectPopulation(_request: Request, response: Response): Promise<void> {
  try {
    response.json({ message: 'success', data: await inspectTrainerPopulation(getActiveDB()) });
  } catch (error) {
    sendError(response, error);
  }
}

export async function planPopulation(request: Request<Record<string, never>, unknown, unknown>, response: Response): Promise<void> {
  try {
    const inactive = request.body && typeof request.body === 'object' && 'cohort' in request.body;
    response.json({ message: 'success', data: inactive ? (await reviewCohortBrief(getActiveDB(), request.body)).plan : await planTrainerPopulation(getActiveDB(), request.body) });
  } catch (error) {
    sendError(response, error);
  }
}

export async function proposePopulation(request: Request<Record<string, never>, unknown, unknown>, response: Response): Promise<void> {
  try {
    response.json({ message: 'success', data: await createPopulationProposal(getActiveDB(), request.body) });
  } catch (error) {
    sendError(response, error);
  }
}

export async function validatePopulationBrief(request: Request<Record<string, never>, unknown, unknown>, response: Response): Promise<void> {
  try {
    response.json({ message: 'success', data: await reviewCohortBrief(getActiveDB(), request.body) });
  } catch (error) {
    sendError(response, error);
  }
}

export async function reviewPopulation(request: Request<Record<string, never>, unknown, unknown>, response: Response): Promise<void> {
  try {
    response.json({ message: 'success', data: await reviewPopulationProposal(getActiveDB(), request.body) });
  } catch (error) {
    sendError(response, error);
  }
}

export async function rerollPopulation(request: Request<Record<string, never>, unknown, unknown>, response: Response): Promise<void> {
  try {
    response.json({ message: 'success', data: await rerollPopulationTrainer(getActiveDB(), request.body) });
  } catch (error) {
    sendError(response, error);
  }
}

export async function applyPopulation(request: Request<Record<string, never>, unknown, unknown>, response: Response): Promise<void> {
  try {
    response.json({ message: 'success', data: await applySelectedPopulationProposal(getActiveDB(), request.body) });
  } catch (error) {
    sendError(response, error);
  }
}
