/**
 * TournamentRunner.ts
 * 
 * Handles advancing tournament state through stages.
 * 
 * Schema reference:
 *   tournament_event: id, template_id, edition_label, start_date, end_date, status
 *   stage_event: id, tournament_event_id, stage_template_id, status ('pending'|'running'|'complete')
 *   stage_template: id, tournament_template_id, seq, stage_type, participants, groups, best_of, rule_set_id
 *   match: id, stage_event_id, round, participant_a_id, participant_b_id, winner_id, scheduled_at
 *   tournament_participant: id, stage_event_id, seed
 *   team_member: id, participant_id, trainer_id
 * 
 * Tournament flow:
 *   1. Tournament starts (status: scheduled -> ongoing)
 *   2. First stage activates (status: pending -> running)
 *   3. Matches are generated and scheduled
 *   4. Matches are resolved (via MatchRunner)
 *   5. Stage completes, advances to next stage
 *   6. Final stage completes -> tournament complete, award badges
 */

import sqlite3 from 'sqlite3';
import { SimReport, TournamentEventRow, AwardedBadge } from '../types/sim';

/**
 * Advance all tournaments that should be progressed by the given cursor time.
 * 
 * @param db - Database connection
 * @param cursorTime - Current simulation time (ISO datetime)
 * @param report - SimReport to append results
 */
export async function advanceTournaments(
    db: sqlite3.Database,
    cursorTime: string,
    report: SimReport
): Promise<void> {
    // TODO(v2): Implement tournament advancement logic
    //
    // Algorithm outline:
    // 1. Find tournaments that should start (start_date <= cursorTime AND status='scheduled')
    //    UPDATE tournament_event SET status='ongoing' WHERE ...
    //
    // 2. For ongoing tournaments, check if current stage is complete
    //    - A stage is complete when all matches have winner_id set
    //    - If complete, mark stage as 'complete' and activate next stage
    //    - If no next stage, mark tournament as 'completed'
    //
    // 3. For newly activated stages, generate matches (bracket/round-robin)
    //    - This depends on stage_type: 'single_elim', 'double_elim', 'round_robin', etc.
    //
    // 4. On tournament completion, award badges based on prize table
    //    - SELECT * FROM prize WHERE tournament_template_id = ? AND prize_type = 'badge'
    //    - For position 1 (champion), find the winner and award the badge
    //
    // For now, this is a stub.

    report.notes.push('TournamentRunner: stub - no tournament advancement implemented yet');
}

/**
 * Check if a stage is complete (all matches resolved).
 * 
 * @param db - Database connection
 * @param stageEventId - The stage_event.id
 * @returns true if all matches have a winner
 */
export async function isStageComplete(
    db: sqlite3.Database,
    stageEventId: number
): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT COUNT(*) as pending
            FROM match
            WHERE stage_event_id = ? AND winner_id IS NULL
        `;
        db.get(sql, [stageEventId], (err, row: any) => {
            if (err) return reject(err);
            resolve(row.pending === 0);
        });
    });
}

/**
 * Award tournament prizes (badges) to winners.
 * 
 * @param db - Database connection
 * @param tournamentEventId - The tournament_event.id
 * @param report - SimReport to append awarded badges
 */
export async function awardTournamentPrizes(
    db: sqlite3.Database,
    tournamentEventId: number,
    report: SimReport
): Promise<void> {
    // TODO(v2): Implement prize awarding
    //
    // 1. Get tournament's template_id from tournament_event
    // 2. SELECT * FROM prize WHERE tournament_template_id = ? AND prize_type = 'badge'
    // 3. For each prize row:
    //    a. Determine the trainer at that position (from final stage results)
    //    b. INSERT INTO trainer_badge (trainer_id, badge_id, awarded_at, source_event_id)
    //    c. Add to report.awardedBadges
    //
    // For now, stub.
    report.notes.push(`TournamentRunner: prize awarding stub for event ${tournamentEventId}`);
}

/**
 * Generate matches for a stage based on stage_type.
 * 
 * @param db - Database connection
 * @param stageEventId - The stage_event.id
 * @param stageType - The type: 'round_robin', 'single_elim', etc.
 * @param cursorTime - Current time for scheduling matches
 */
export async function generateMatchesForStage(
    db: sqlite3.Database,
    stageEventId: number,
    stageType: string,
    cursorTime: string
): Promise<void> {
    // TODO(v2): Implement bracket/round-robin generation
    //
    // For single_elim:
    //   - Get all participants for this stage
    //   - Pair them by seed (1v16, 2v15, etc.)
    //   - Create match rows with scheduled_at = cursorTime + offset
    //
    // For round_robin:
    //   - Every participant plays every other participant
    //   - Schedule all matches
    //
    // This is complex and deferred.
}
