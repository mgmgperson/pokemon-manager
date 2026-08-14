import sqlite3 from 'sqlite3';
import { determineRatedMatchWinner } from '../../../engines/simulation/match-resolution-engine';
import type { SimReport } from '../../../types/sim';
import {
  findDueMatches,
  findMatchCompetitor,
  updateMatchWinner,
} from './simulation.repository';

/**
 * Resolves all scheduled, unresolved matches up to the supplied simulation
 * cursor. Tournament orchestration will replace the rating-weighted winner
 * selection when its battle integration is implemented.
 */
export async function runDueMatches(
  database: sqlite3.Database,
  cursorTime: string,
  report: SimReport
): Promise<void> {
  const dueMatches = await findDueMatches(database, cursorTime);
  if (dueMatches.length === 0) {
    return;
  }

  report.notes.push(`MatchRunner: found ${dueMatches.length} due match(es)`);
  for (const match of dueMatches) {
    try {
      const [participantA, participantB] = await Promise.all([
        findMatchCompetitor(database, match.participant_a_id),
        findMatchCompetitor(database, match.participant_b_id),
      ]);
      if (!participantA || !participantB) {
        report.notes.push(`MatchRunner: match ${match.id} missing trainer info, skipping`);
        continue;
      }

      const winnerId = determineRatedMatchWinner(
        { participantId: match.participant_a_id, pwtrRating: participantA.pwtr_rating },
        { participantId: match.participant_b_id, pwtrRating: participantB.pwtr_rating }
      );
      await updateMatchWinner(database, match.id, winnerId);
      report.simmedMatchIds.push(match.id);
      report.notes.push(`MatchRunner: resolved match ${match.id}, winner: participant ${winnerId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      report.notes.push(`MatchRunner: error resolving match ${match.id}: ${message}`);
    }
  }
}
