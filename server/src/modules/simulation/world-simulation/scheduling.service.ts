import sqlite3 from 'sqlite3';
import type { SimReport, TournamentTemplateRow } from '../../../types/sim';

export async function ensureTournamentsScheduled(
  _database: sqlite3.Database,
  _fromTime: string,
  _toTime: string,
  report: SimReport
): Promise<void> {
  // TODO: Define recurrence, edition, and stage-creation rules before adding
  // generated tournament events to a save.
  report.notes.push('TournamentScheduler: stub - no tournaments auto-scheduled yet');
}

export async function ensureScheduledThrough(
  database: sqlite3.Database,
  fromTime: string,
  toTime: string,
  report: SimReport
): Promise<void> {
  await ensureTournamentsScheduled(database, fromTime, toTime, report);

  // TODO: Add approved schedulers for training, travel, NPC routines, and
  // seasonal events as their world rules are established.
}

export function computeNextTournamentDate(
  _template: TournamentTemplateRow,
  _afterDate: string
): string | null {
  // TODO: Define recurrence calculations for tournament frequencies.
  return null;
}

export async function createStageEventsForTournament(
  _database: sqlite3.Database,
  _tournamentEventId: number,
  _templateId: number
): Promise<void> {
  // TODO: Create stage events after bracket and participant rules are defined.
}
