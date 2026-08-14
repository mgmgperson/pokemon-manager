import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import type { SimAdvanceRequest } from '../../../types/sim';
import { findSimulationStatus } from './simulation.repository';
import { advanceSimulation } from './simulation.service';

interface SimAdvanceBody {
  mode?: unknown;
  step?: unknown;
  amount?: unknown;
  maxOps?: unknown;
  seed?: unknown;
  dryRun?: unknown;
  gameStateId?: unknown;
}

function parseAdvanceRequest(body: SimAdvanceBody): SimAdvanceRequest | string {
  const mode = body.mode ?? 'byTime';
  const step = body.step ?? 'day';
  const amount = body.amount ?? 1;
  const maxOps = body.maxOps ?? 1000;
  const dryRun = body.dryRun ?? false;

  if (mode !== 'byTime' && mode !== 'toNextEvent') {
    return `Invalid mode: ${mode}. Must be 'byTime' or 'toNextEvent'.`;
  }
  if (step !== 'hour' && step !== 'day' && step !== 'week') {
    return `Invalid step: ${step}. Must be 'hour', 'day', or 'week'.`;
  }
  if (typeof amount !== 'number' || amount < 1 || amount > 365) {
    return `Invalid amount: ${amount}. Must be between 1 and 365.`;
  }
  if (typeof maxOps !== 'number' || maxOps < 1 || maxOps > 100000) {
    return `Invalid maxOps: ${maxOps}. Must be between 1 and 100000.`;
  }

  return {
    mode,
    step,
    amount,
    maxOps,
    seed: typeof body.seed === 'number' ? body.seed : undefined,
    dryRun: typeof dryRun === 'boolean' ? dryRun : Boolean(dryRun),
    gameStateId: typeof body.gameStateId === 'number' ? body.gameStateId : undefined,
  };
}

export async function advanceWorldSimulation(
  request: Request<Record<string, never>, unknown, SimAdvanceBody>,
  response: Response
): Promise<void> {
  const simulationRequest = parseAdvanceRequest(request.body);
  if (typeof simulationRequest === 'string') {
    response.status(400).json({ success: false, error: simulationRequest });
    return;
  }

  try {
    const report = await advanceSimulation(getActiveDB(), simulationRequest);
    response.json({ success: true, data: report });
  } catch (error) {
    console.error('Simulation error:', error);
    response.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error during simulation',
    });
  }
}

interface SimulationStatusQuery {
  gameStateId?: string | string[];
}

export async function getSimulationStatus(
  request: Request<Record<string, never>, unknown, unknown, SimulationStatusQuery>,
  response: Response
): Promise<void> {
  try {
    const gameStateId = typeof request.query.gameStateId === 'string'
      ? request.query.gameStateId
      : undefined;
    const simulationStatus = await findSimulationStatus(getActiveDB(), gameStateId);
    if (!simulationStatus) {
      response.status(404).json({ success: false, error: 'No game_state found' });
      return;
    }
    response.json({ success: true, data: simulationStatus });
  } catch (error) {
    response.status(400).json({ success: false, error: (error as Error).message });
  }
}
