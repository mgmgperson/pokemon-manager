import sqlite3 from 'sqlite3';
import type { SimAdvanceRequest, SimReport } from '../../../types/sim';
import { runInTransaction } from '../../../infrastructure/database/sqlite';
import {
  combineDateTime,
  createSimulationReport,
  nextSimulationCursor,
  planSimulationAdvance,
  splitDateTime,
} from '../../../engines/simulation/world-simulation-engine';
import {
  findGameState,
  findNextScheduledTime,
  updateSimulationClock,
} from './simulation.repository';
import { runDueMatches } from './match.service';
import { applyPostMatchProgression } from './progression.service';
import { ensureScheduledThrough } from './scheduling.service';
import { advanceTournaments } from './tournament.service';

export async function advanceSimulation(
  database: sqlite3.Database,
  request: SimAdvanceRequest
): Promise<SimReport> {
  return runInTransaction(database, async () => {
    const report = createSimulationReport();
    const gameState = await findGameState(database, request.gameStateId);
    if (!gameState) {
      throw new Error('No game_state found');
    }

    const fromTime = combineDateTime(gameState.current_date, gameState.current_time);
    const nextEventTime = request.mode === 'toNextEvent'
      ? await findNextScheduledTime(database, fromTime)
      : null;
    const plan = planSimulationAdvance(fromTime, request, nextEventTime);
    report.fromTime = plan.fromTime;
    report.toTime = plan.toTime;
    report.notes.push(`WorldSim: advancing from ${plan.fromTime} to ${plan.toTime}`);
    if (plan.usedFallbackStep) {
      report.notes.push('WorldSim: no upcoming events, advancing by one step');
    }

    await ensureScheduledThrough(database, plan.fromTime, plan.toTime, report);
    let operations = 0;
    let cursorTime = plan.fromTime;
    const maxOperations = request.maxOps ?? 1000;
    while (cursorTime <= plan.toTime && operations < maxOperations) {
      const previousMatchCount = report.simmedMatchIds.length;
      await advanceTournaments(database, cursorTime, report);
      await runDueMatches(database, cursorTime, report);
      const resolvedMatchIds = report.simmedMatchIds.slice(previousMatchCount);
      await applyPostMatchProgression(database, resolvedMatchIds, report);

      operations += resolvedMatchIds.length || 1;
      if (cursorTime >= plan.toTime) {
        break;
      }
      cursorTime = nextSimulationCursor(cursorTime);
      if (operations >= maxOperations) {
        report.notes.push(`WorldSim: reached maxOps limit (${maxOperations})`);
        break;
      }
    }

    const { date, time } = splitDateTime(plan.toTime);
    await updateSimulationClock(database, gameState.id, date, time);
    if (request.dryRun) {
      report.notes.push('WorldSim: dryRun=true, changes rolled back');
    }
    return report;
  }, { rollbackOnSuccess: request.dryRun ?? false });
}

/** Compatibility name for callers that previously invoked the world simulator directly. */
export function advanceWorld(
  database: sqlite3.Database,
  request: SimAdvanceRequest
): Promise<SimReport> {
  return advanceSimulation(database, request);
}
