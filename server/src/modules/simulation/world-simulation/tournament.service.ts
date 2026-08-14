import sqlite3 from 'sqlite3';
import type { SimReport } from '../../../types/sim';
import { isStageComplete as readStageComplete } from './simulation.repository';

export async function advanceTournaments(
  _database: sqlite3.Database,
  _cursorTime: string,
  report: SimReport
): Promise<void> {
  // TODO: Implement tournament lifecycle transitions, bracket generation, and
  // awards once their world rules and event model are approved.
  report.notes.push('TournamentRunner: stub - no tournament advancement implemented yet');
}

export function isStageComplete(
  database: sqlite3.Database,
  stageEventId: number
): Promise<boolean> {
  return readStageComplete(database, stageEventId);
}

export async function awardTournamentPrizes(
  _database: sqlite3.Database,
  tournamentEventId: number,
  report: SimReport
): Promise<void> {
  // TODO: Resolve prize recipients from final-stage results before awarding
  // badges or other tournament prizes.
  report.notes.push(`TournamentRunner: prize awarding stub for event ${tournamentEventId}`);
}

export async function generateMatchesForStage(
  _database: sqlite3.Database,
  _stageEventId: number,
  _stageType: string,
  _cursorTime: string
): Promise<void> {
  // TODO: Implement approved pairing rules for single-elimination and
  // round-robin stages.
}
