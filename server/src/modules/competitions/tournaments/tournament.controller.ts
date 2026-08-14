import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import {
  findRuleSet,
  findTournamentBadges,
  findTournamentEvent,
  findTournamentEvents,
  findTournamentMatches,
  findTournamentTemplate,
  findTournamentTemplates,
  findTrainerTournamentBadges,
} from './tournament.repository';

function sendError(response: Response, error: unknown): void {
  response.status(400).json({ error: (error as Error).message });
}

export async function listTournaments(_request: Request, response: Response): Promise<void> {
  try {
    const tournaments = await findTournamentTemplates(getActiveDB());
    response.json({ message: 'success', data: tournaments });
  } catch (error) {
    sendError(response, error);
  }
}

export async function getTournament(request: Request<{ id: string }>, response: Response): Promise<void> {
  try {
    const tournament = await findTournamentTemplate(getActiveDB(), request.params.id);
    if (!tournament) {
      response.status(404).json({ message: 'Tournament not found' });
      return;
    }
    response.json({ message: 'success', data: tournament });
  } catch (error) {
    sendError(response, error);
  }
}

export async function listTournamentEvents(request: Request<{ id: string }>, response: Response): Promise<void> {
  try {
    const events = await findTournamentEvents(getActiveDB(), request.params.id);
    response.json({ message: 'success', data: events });
  } catch (error) {
    sendError(response, error);
  }
}

export async function getTournamentEvent(request: Request<{ eventId: string }>, response: Response): Promise<void> {
  try {
    const event = await findTournamentEvent(getActiveDB(), request.params.eventId);
    if (!event) {
      response.status(404).json({ message: 'Tournament event not found' });
      return;
    }
    response.json({ message: 'success', data: event });
  } catch (error) {
    sendError(response, error);
  }
}

export async function getRuleSet(request: Request<{ ruleSetId: string }>, response: Response): Promise<void> {
  try {
    const ruleSet = await findRuleSet(getActiveDB(), request.params.ruleSetId);
    if (!ruleSet) {
      response.status(404).json({ message: 'Rule set not found' });
      return;
    }
    response.json({ message: 'success', data: ruleSet });
  } catch (error) {
    sendError(response, error);
  }
}

export async function listTournamentMatches(request: Request<{ eventId: string }>, response: Response): Promise<void> {
  try {
    const matches = await findTournamentMatches(getActiveDB(), request.params.eventId);
    response.json({ message: 'success', data: matches });
  } catch (error) {
    sendError(response, error);
  }
}

export async function listTournamentBadges(_request: Request, response: Response): Promise<void> {
  try {
    const badges = await findTournamentBadges(getActiveDB());
    response.json({ message: 'success', data: badges });
  } catch (error) {
    sendError(response, error);
  }
}

export async function listTrainerTournamentBadges(
  request: Request<{ trainerId: string }>,
  response: Response
): Promise<void> {
  try {
    const badges = await findTrainerTournamentBadges(getActiveDB(), request.params.trainerId);
    response.json({ message: 'success', data: badges });
  } catch (error) {
    sendError(response, error);
  }
}
