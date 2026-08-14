import sqlite3 from 'sqlite3';
import { queryAll, queryOne, runStatement } from '../../../infrastructure/database/sqlite';
import type { GameStateRow, MatchRow } from '../../../types/sim';

interface SimulationCountsRow {
  pending_matches: number;
  scheduled_events: number;
  scheduled_tournaments: number;
  ongoing_tournaments: number;
}

interface MatchCompetitorRow {
  trainer_id: number;
  pwtr_rating: number | null;
}

interface PendingMatchCountRow {
  pending: number;
}

export interface SimulationStatus {
  gameState: GameStateRow;
  pendingMatches: number;
  scheduledEvents: number;
  scheduledTournaments: number;
  ongoingTournaments: number;
}

export async function findSimulationStatus(
  database: sqlite3.Database,
  gameStateId?: string
): Promise<SimulationStatus | null> {
  const gameState = gameStateId
    ? await queryOne<GameStateRow>(database, 'SELECT * FROM game_state WHERE id = ? LIMIT 1', [gameStateId])
    : await queryOne<GameStateRow>(database, 'SELECT * FROM game_state ORDER BY id LIMIT 1');

  if (!gameState) {
    return null;
  }

  const counts = await queryOne<SimulationCountsRow>(
    database,
    `
      SELECT
        (SELECT COUNT(*) FROM match WHERE winner_id IS NULL AND scheduled_at IS NOT NULL) AS pending_matches,
        (SELECT COUNT(*) FROM event_instance WHERE status = 'scheduled') AS scheduled_events,
        (SELECT COUNT(*) FROM tournament_event WHERE status = 'scheduled') AS scheduled_tournaments,
        (SELECT COUNT(*) FROM tournament_event WHERE status = 'ongoing') AS ongoing_tournaments
    `
  );

  return {
    gameState,
    pendingMatches: counts?.pending_matches || 0,
    scheduledEvents: counts?.scheduled_events || 0,
    scheduledTournaments: counts?.scheduled_tournaments || 0,
    ongoingTournaments: counts?.ongoing_tournaments || 0,
  };
}

export function findGameState(
  database: sqlite3.Database,
  gameStateId?: number
): Promise<GameStateRow | null> {
  return gameStateId
    ? queryOne<GameStateRow>(database, 'SELECT * FROM game_state WHERE id = ? LIMIT 1', [gameStateId])
    : queryOne<GameStateRow>(database, 'SELECT * FROM game_state ORDER BY id LIMIT 1');
}

export function findNextScheduledTime(
  database: sqlite3.Database,
  afterTime: string
): Promise<string | null> {
  return queryOne<{ next_time: string | null }>(
    database,
    `
      SELECT MIN(next_time) AS next_time FROM (
        SELECT MIN(starts_at) AS next_time
        FROM event_instance
        WHERE starts_at > ? AND status = 'scheduled'
        UNION ALL
        SELECT MIN(scheduled_at) AS next_time
        FROM match
        WHERE scheduled_at > ? AND winner_id IS NULL
        UNION ALL
        SELECT MIN(start_date || 'T00:00:00') AS next_time
        FROM tournament_event
        WHERE start_date > ? AND status = 'scheduled'
      )
    `,
    [afterTime, afterTime, afterTime]
  ).then((row) => row?.next_time ?? null);
}

export function updateSimulationClock(
  database: sqlite3.Database,
  gameStateId: number,
  date: string,
  time: string
): Promise<void> {
  return runStatement(
    database,
    `
      UPDATE game_state
      SET current_date = ?, current_time = ?, last_played_at = datetime('now')
      WHERE id = ?
    `,
    [date, time, gameStateId]
  ).then(() => undefined);
}

export function findDueMatches(
  database: sqlite3.Database,
  cursorTime: string
): Promise<MatchRow[]> {
  return queryAll<MatchRow>(
    database,
    `
      SELECT id, stage_event_id, round, participant_a_id, participant_b_id,
             stadium_id, winner_id, scheduled_at, field_id
      FROM match
      WHERE scheduled_at <= ? AND winner_id IS NULL
      ORDER BY scheduled_at ASC
    `,
    [cursorTime]
  );
}

export function findMatchCompetitor(
  database: sqlite3.Database,
  participantId: number
): Promise<MatchCompetitorRow | null> {
  return queryOne<MatchCompetitorRow>(
    database,
    `
      SELECT tm.trainer_id, t.pwtr_rating
      FROM team_member tm
      JOIN trainer t ON tm.trainer_id = t.id
      WHERE tm.participant_id = ?
      LIMIT 1
    `,
    [participantId]
  );
}

export function updateMatchWinner(
  database: sqlite3.Database,
  matchId: number,
  winnerId: number
): Promise<void> {
  return runStatement(database, 'UPDATE match SET winner_id = ? WHERE id = ?', [winnerId, matchId])
    .then(() => undefined);
}

export function isStageComplete(
  database: sqlite3.Database,
  stageEventId: number
): Promise<boolean> {
  return queryOne<PendingMatchCountRow>(
    database,
    `
      SELECT COUNT(*) AS pending
      FROM match
      WHERE stage_event_id = ? AND winner_id IS NULL
    `,
    [stageEventId]
  ).then((row) => row?.pending === 0);
}

export function updateTrainerRating(
  database: sqlite3.Database,
  trainerId: number,
  ratingChange: number
): Promise<void> {
  return runStatement(
    database,
    `
      UPDATE trainer
      SET
        pwtr_rating = pwtr_rating + ?,
        peak_rating = MAX(COALESCE(peak_rating, 0), pwtr_rating + ?)
      WHERE id = ?
    `,
    [ratingChange, ratingChange, trainerId]
  ).then(() => undefined);
}
