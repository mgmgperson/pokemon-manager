/**
 * MatchRunner.ts
 * 
 * Responsible for resolving scheduled matches that are due.
 * 
 * Schema reference (match table):
 *   id INTEGER PRIMARY KEY
 *   stage_event_id INTEGER NOT NULL
 *   round INTEGER
 *   participant_a_id INTEGER NOT NULL
 *   participant_b_id INTEGER NOT NULL
 *   stadium_id INTEGER
 *   winner_id INTEGER                 -- NULL until finished
 *   scheduled_at TEXT                 -- ISO datetime
 *   field_id INTEGER
 * 
 * Schema reference (team_member):
 *   id, participant_id, trainer_id
 * 
 * A match is "due" when:
 *   - scheduled_at <= cursorTime
 *   - winner_id IS NULL
 */

import sqlite3 from 'sqlite3';
import { SimReport, MatchRow, TeamMemberRow } from '../types/sim';

/**
 * Find and resolve all matches that are due (scheduled <= cursor, unresolved).
 * 
 * @param db - Database connection
 * @param cursorTime - Current simulation time (ISO datetime)
 * @param report - SimReport to append results
 */
export async function runDueMatches(
    db: sqlite3.Database,
    cursorTime: string,
    report: SimReport
): Promise<void> {
    // Get all due matches
    const dueMatches = await getDueMatches(db, cursorTime);

    if (dueMatches.length === 0) {
        return;
    }

    report.notes.push(`MatchRunner: found ${dueMatches.length} due match(es)`);

    for (const match of dueMatches) {
        try {
            await resolveMatch(db, match, report);
        } catch (err: any) {
            report.notes.push(`MatchRunner: error resolving match ${match.id}: ${err.message}`);
        }
    }
}

/**
 * Query all due matches from the database.
 * 
 * @param db - Database connection
 * @param cursorTime - Current simulation time
 * @returns Array of MatchRow objects
 */
async function getDueMatches(
    db: sqlite3.Database,
    cursorTime: string
): Promise<MatchRow[]> {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT id, stage_event_id, round, participant_a_id, participant_b_id,
                   stadium_id, winner_id, scheduled_at, field_id
            FROM match
            WHERE scheduled_at <= ?
              AND winner_id IS NULL
            ORDER BY scheduled_at ASC
        `;
        db.all(sql, [cursorTime], (err, rows: MatchRow[]) => {
            if (err) return reject(err);
            resolve(rows || []);
        });
    });
}

/**
 * Resolve a single match by determining a winner.
 * 
 * For v1: Uses placeholder winner selection (random or based on rating).
 * 
 * TODO(v2): Integrate with BattleSimulator for actual battle simulation.
 *   - Get trainer IDs from team_member via participant_id
 *   - Get field from field_id or stadium
 *   - Call simulateSingles6v6Battle
 *   - Update match.winner_id based on result
 * 
 * @param db - Database connection
 * @param match - The match to resolve
 * @param report - SimReport to append results
 */
async function resolveMatch(
    db: sqlite3.Database,
    match: MatchRow,
    report: SimReport
): Promise<void> {
    // Get trainer info for both participants
    const trainerA = await getTrainerForParticipant(db, match.participant_a_id);
    const trainerB = await getTrainerForParticipant(db, match.participant_b_id);

    if (!trainerA || !trainerB) {
        report.notes.push(`MatchRunner: match ${match.id} missing trainer info, skipping`);
        return;
    }

    // Determine winner using placeholder logic
    // TODO(v2): Replace with actual battle simulation
    const winnerId = await determineWinner(db, match, trainerA, trainerB);

    // Update the match with the winner
    await updateMatchWinner(db, match.id, winnerId);

    report.simmedMatchIds.push(match.id);
    report.notes.push(`MatchRunner: resolved match ${match.id}, winner: participant ${winnerId}`);
}

/**
 * Get trainer ID for a tournament participant.
 * 
 * @param db - Database connection
 * @param participantId - tournament_participant.id
 * @returns Trainer info or null
 */
async function getTrainerForParticipant(
    db: sqlite3.Database,
    participantId: number
): Promise<{ trainerId: number; pwtrRating: number | null } | null> {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT tm.trainer_id, t.pwtr_rating
            FROM team_member tm
            JOIN trainer t ON tm.trainer_id = t.id
            WHERE tm.participant_id = ?
            LIMIT 1
        `;
        db.get(sql, [participantId], (err, row: any) => {
            if (err) return reject(err);
            if (!row) return resolve(null);
            resolve({
                trainerId: row.trainer_id,
                pwtrRating: row.pwtr_rating
            });
        });
    });
}

/**
 * Placeholder winner determination based on ratings.
 * Higher-rated trainer has better odds but not guaranteed.
 * 
 * @param db - Database connection
 * @param match - The match
 * @param trainerA - Participant A trainer info
 * @param trainerB - Participant B trainer info
 * @returns The winning participant_id
 */
async function determineWinner(
    db: sqlite3.Database,
    match: MatchRow,
    trainerA: { trainerId: number; pwtrRating: number | null },
    trainerB: { trainerId: number; pwtrRating: number | null }
): Promise<number> {
    // TODO(v2): Replace with actual battle simulation
    //
    // For now, use rating-weighted random selection:
    // - Higher rating = higher probability of winning
    // - If ratings are null, use 50/50

    const ratingA = trainerA.pwtrRating ?? 3000;
    const ratingB = trainerB.pwtrRating ?? 3000;

    // Simple probability based on rating difference
    // Using Elo-style calculation
    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    
    const roll = Math.random();
    
    if (roll < expectedA) {
        return match.participant_a_id;
    } else {
        return match.participant_b_id;
    }
}

/**
 * Update a match with the winner.
 * 
 * @param db - Database connection
 * @param matchId - The match ID
 * @param winnerId - The winning participant ID
 */
async function updateMatchWinner(
    db: sqlite3.Database,
    matchId: number,
    winnerId: number
): Promise<void> {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE match SET winner_id = ? WHERE id = ?`;
        db.run(sql, [winnerId, matchId], function(err) {
            if (err) return reject(err);
            resolve();
        });
    });
}
