/**
 * WorldSim.ts
 * 
 * Core orchestrator for world simulation. Called by POST /sim/advance.
 * 
 * Responsibilities:
 * 1. Read current time from game_state (current_date, current_time columns)
 * 2. Compute target time based on mode (byTime vs toNextEvent)
 * 3. Ensure events are scheduled through target window (via Scheduler)
 * 4. Run simulation loop up to maxOps
 * 5. Update game_state.current_date and current_time
 * 6. Return SimReport with metadata about what happened
 * 
 * Schema reference (game_state):
 *   id INTEGER PRIMARY KEY
 *   save_name TEXT
 *   created_at TEXT
 *   last_played_at TEXT
 *   current_date TEXT           -- ISO date (YYYY-MM-DD)
 *   current_time TEXT           -- time string (HH:MM:SS)
 *   active_trainer_id INTEGER
 *   active_location_id INTEGER
 * 
 * Transaction support:
 *   - dryRun=true: wrap in transaction and rollback at end
 *   - dryRun=false: commit changes
 */

import sqlite3 from 'sqlite3';
import {
    SimAdvanceRequest,
    SimReport,
    SimCursor,
    GameStateRow,
    SimTimeStep
} from '../types/sim';
import { ensureScheduledThrough } from './Scheduler';
import { runDueMatches } from './MatchRunner';
import { advanceTournaments } from './TournamentRunner';
import { applyPostMatchProgression } from './NPCProgression';

/**
 * Main entry point for world simulation.
 * 
 * @param db - Database connection
 * @param request - SimAdvanceRequest from API
 * @returns SimReport with metadata about what happened
 */
export async function advanceWorld(
    db: sqlite3.Database,
    request: SimAdvanceRequest
): Promise<SimReport> {
    const {
        mode = 'byTime',
        step = 'day',
        amount = 1,
        maxOps = 1000,
        dryRun = false,
        gameStateId
    } = request;

    // Initialize report
    const report: SimReport = {
        fromTime: '',
        toTime: '',
        resolvedEventInstanceIds: [],
        simmedMatchIds: [],
        awardedBadges: [],
        notes: []
    };

    try {
        // Start transaction for atomicity (and dryRun support)
        await runCommand(db, 'BEGIN TRANSACTION');

        // Read current game state
        const gameState = await getGameState(db, gameStateId);
        if (!gameState) {
            throw new Error('No game_state found');
        }        

        // Build cursor with current time
        const fromTime = combineDateTime(gameState.current_date, gameState.current_time);
        report.fromTime = fromTime;

        let targetTime: string;

        if (mode === 'byTime') {
            // Calculate target time by advancing step * amount
            targetTime = addTimeStep(fromTime, step, amount);
        } else {
            // toNextEvent: find next scheduled event/match/tournament
            const nextEventTime = await findNextEventTime(db, fromTime);
            if (!nextEventTime || nextEventTime <= fromTime) {
                // No upcoming events; advance by one step as fallback
                targetTime = addTimeStep(fromTime, step, 1);
                report.notes.push('WorldSim: no upcoming events, advancing by one step');
            } else {
                targetTime = nextEventTime;
            }
        }

        report.toTime = targetTime;
        report.notes.push(`WorldSim: advancing from ${fromTime} to ${targetTime}`);

        // Ensure events are scheduled through the target window
        await ensureScheduledThrough(db, fromTime, targetTime, report);

        // Simulation loop: process events up to maxOps
        let opsCount = 0;
        let cursorTime = fromTime;

        while (cursorTime <= targetTime && opsCount < maxOps) {
            const prevMatchCount = report.simmedMatchIds.length;

            // 1. Advance tournaments (start tournaments, progress stages)
            await advanceTournaments(db, cursorTime, report);

            // 2. Run due matches
            await runDueMatches(db, cursorTime, report);

            // 3. Apply NPC progression for newly resolved matches
            const newMatchIds = report.simmedMatchIds.slice(prevMatchCount);
            if (newMatchIds.length > 0) {
                await applyPostMatchProgression(db, newMatchIds, report);
            }

            // Increment ops by the number of matches processed
            opsCount += newMatchIds.length || 1;

            // Advance cursor to next time step (or break if at target)
            if (cursorTime >= targetTime) {
                break;
            }
            cursorTime = addTimeStep(cursorTime, 'hour', 1);

            // Safety: limit iterations
            if (opsCount >= maxOps) {
                report.notes.push(`WorldSim: reached maxOps limit (${maxOps})`);
                break;
            }
        }

        // Update game_state with new time
        const { date: newDate, time: newTime } = splitDateTime(targetTime);
        await updateGameState(db, gameState.id, newDate, newTime);

        // Commit or rollback based on dryRun
        if (dryRun) {
            await runCommand(db, 'ROLLBACK');
            report.notes.push('WorldSim: dryRun=true, changes rolled back');
        } else {
            await runCommand(db, 'COMMIT');
        }

        return report;

    } catch (err: any) {
        // Rollback on error
        try {
            await runCommand(db, 'ROLLBACK');
        } catch (_) { /* ignore rollback errors */ }
        throw err;
    }
}

/**
 * Get the current game state row.
 */
async function getGameState(
    db: sqlite3.Database,
    gameStateId?: number
): Promise<GameStateRow | null> {
    return new Promise((resolve, reject) => {
        let sql: string;
        let params: any[];

        if (gameStateId) {
            sql = 'SELECT * FROM game_state WHERE id = ? LIMIT 1';
            params = [gameStateId];
        } else {
            sql = 'SELECT * FROM game_state ORDER BY id LIMIT 1';
            params = [];
        }

        db.get(sql, params, (err, row: GameStateRow | undefined) => {
            if (err) return reject(err);
            resolve(row || null);
        });
    });
}

/**
 * Update game_state with new date and time.
 */
async function updateGameState(
    db: sqlite3.Database,
    gameStateId: number,
    newDate: string,
    newTime: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE game_state
            SET current_date = ?,
                current_time = ?,
                last_played_at = datetime('now')
            WHERE id = ?
        `;
        db.run(sql, [newDate, newTime, gameStateId], function(err) {
            if (err) return reject(err);
            resolve();
        });
    });
}

/**
 * Find the time of the next scheduled event/match/tournament.
 * Returns the earliest of:
 *   - event_instance.starts_at
 *   - match.scheduled_at
 *   - tournament_event.start_date
 */
async function findNextEventTime(
    db: sqlite3.Database,
    afterTime: string
): Promise<string | null> {
    return new Promise((resolve, reject) => {
        // Use COALESCE to find the minimum across all event sources
        const sql = `
            SELECT MIN(next_time) as next_time FROM (
                SELECT MIN(starts_at) as next_time
                FROM event_instance
                WHERE starts_at > ?
                  AND status = 'scheduled'
                UNION ALL
                SELECT MIN(scheduled_at) as next_time
                FROM match
                WHERE scheduled_at > ?
                  AND winner_id IS NULL
                UNION ALL
                SELECT MIN(start_date || 'T00:00:00') as next_time
                FROM tournament_event
                WHERE start_date > ?
                  AND status = 'scheduled'
            )
        `;
        db.get(sql, [afterTime, afterTime, afterTime], (err, row: any) => {
            if (err) return reject(err);
            resolve(row?.next_time || null);
        });
    });
}

/**
 * Combine date and time into ISO datetime string.
 */
function combineDateTime(date: string, time: string): string {
    // Ensure time has proper format
    const timeStr = time || '00:00:00';
    return `${date}T${timeStr}`;
}

/**
 * Split ISO datetime into date and time parts.
 */
function splitDateTime(datetime: string): { date: string; time: string } {
    const parts = datetime.split('T');
    return {
        date: parts[0] || datetime,
        time: parts[1] || '00:00:00'
    };
}

/**
 * Add time step to a datetime string.
 */
function addTimeStep(datetime: string, step: SimTimeStep, amount: number): string {
    const date = new Date(datetime);

    switch (step) {
        case 'hour':
            date.setHours(date.getHours() + amount);
            break;
        case 'day':
            date.setDate(date.getDate() + amount);
            break;
        case 'week':
            date.setDate(date.getDate() + (amount * 7));
            break;
    }

    // Return ISO string but strip milliseconds
    return date.toISOString().replace('.000Z', '').replace('Z', '');
}

/**
 * Run a SQL command that doesn't return rows.
 */
async function runCommand(db: sqlite3.Database, sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(sql, [], (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}