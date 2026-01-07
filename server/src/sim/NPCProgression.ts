/**
 * NPCProgression.ts
 * 
 * Handles NPC trainer progression after matches and passive time-based changes.
 * 
 * Schema reference (trainer):
 *   id, fname, lname, region_id, birthdate
 *   pwtr_rating FLOAT        -- current rating
 *   peak_rating FLOAT        -- historical peak
 *   peak_rank INTEGER
 *   active_status BOOLEAN
 * 
 * Schema reference (pokemon):
 *   Various stats including experience_points, level, battles_won, battles_lost, etc.
 * 
 * Progression types:
 *   1. Post-match: Update ratings based on match results (Elo-style)
 *   2. Passive: Daily/weekly training improvements (future)
 *   3. Aging: Rating decay for older trainers, improvement for younger (future)
 */

import sqlite3 from 'sqlite3';
import { SimReport, MatchRow } from '../types/sim';

/**
 * Apply progression effects after matches have been resolved.
 * 
 * @param db - Database connection
 * @param matchIds - Array of match IDs that were just resolved
 * @param report - SimReport to append notes
 */
export async function applyPostMatchProgression(
    db: sqlite3.Database,
    matchIds: number[],
    report: SimReport
): Promise<void> {
    if (matchIds.length === 0) {
        return;
    }

    // TODO(v2): Implement actual rating changes
    //
    // For each resolved match:
    // 1. Get winner and loser trainer IDs
    // 2. Calculate Elo rating change
    // 3. Update trainer.pwtr_rating for both
    // 4. Update trainer.peak_rating if new peak
    // 5. Update pokemon battle stats (battles_won, battles_lost)
    //
    // Algorithm for Elo:
    //   K = 32 (standard K-factor, could vary by rating tier)
    //   Expected_A = 1 / (1 + 10^((Rating_B - Rating_A) / 400))
    //   If A wins: New_A = Rating_A + K * (1 - Expected_A)
    //              New_B = Rating_B + K * (0 - Expected_B)
    //
    // For now, this is a stub.

    report.notes.push(`NPCProgression: stub - would process ${matchIds.length} match(es) for rating changes`);
}

/**
 * Apply passive daily progression for NPCs.
 * 
 * @param db - Database connection
 * @param cursorTime - Current simulation time
 * @param report - SimReport to append notes
 */
export async function applyPassiveProgression(
    db: sqlite3.Database,
    cursorTime: string,
    report: SimReport
): Promise<void> {
    // TODO(future): Implement passive progression
    //
    // Ideas:
    // - Young trainers (< 25) gradually improve
    // - Old trainers (> 35) gradually decline
    // - Active training programs boost pokemon stats
    // - Pokemon happiness/bond affects battle performance
    //
    // This is deferred for v2+.
}

/**
 * Calculate Elo rating change for a match result.
 * 
 * @param winnerRating - Winner's current rating
 * @param loserRating - Loser's current rating
 * @param kFactor - K-factor (default 32)
 * @returns Tuple of [winnerChange, loserChange]
 */
export function calculateEloChange(
    winnerRating: number,
    loserRating: number,
    kFactor: number = 32
): [number, number] {
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const expectedLoser = 1 - expectedWinner;

    const winnerChange = kFactor * (1 - expectedWinner);
    const loserChange = kFactor * (0 - expectedLoser);

    return [winnerChange, loserChange];
}

/**
 * Update trainer rating and peak after a match.
 * 
 * @param db - Database connection
 * @param trainerId - Trainer ID
 * @param ratingChange - Amount to add to rating (can be negative)
 */
export async function updateTrainerRating(
    db: sqlite3.Database,
    trainerId: number,
    ratingChange: number
): Promise<void> {
    return new Promise((resolve, reject) => {
        // Update rating and peak in one query
        const sql = `
            UPDATE trainer
            SET pwtr_rating = pwtr_rating + ?,
                peak_rating = MAX(COALESCE(peak_rating, 0), pwtr_rating + ?)
            WHERE id = ?
        `;
        db.run(sql, [ratingChange, ratingChange, trainerId], function(err) {
            if (err) return reject(err);
            resolve();
        });
    });
}

/**
 * Update pokemon battle statistics.
 * 
 * @param db - Database connection
 * @param pokemonIds - Array of pokemon IDs that participated
 * @param won - Whether their trainer won
 */
export async function updatePokemonBattleStats(
    db: sqlite3.Database,
    pokemonIds: number[],
    won: boolean
): Promise<void> {
    // TODO(v2): Implement pokemon stat updates
    //
    // For each pokemon:
    // - If won: battles_won += 1
    // - If lost: battles_lost += 1
    // - Optionally: experience_points += some amount
}
