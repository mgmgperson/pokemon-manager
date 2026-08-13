/**
 * Scheduler.ts
 * 
 * Top-level scheduling coordinator that ensures all recurring events/tournaments
 * are properly scheduled through a given time window.
 * 
 * Delegates to specialized schedulers:
 * - TournamentScheduler: handles tournament_event creation from tournament_template
 * - Future: TrainingScheduler, TravelScheduler, etc.
 */

import sqlite3 from 'sqlite3';
import { SimReport } from '../types/sim';
import { ensureTournamentsScheduled } from './TournamentScheduler';



/**
 * Ensure all recurring events are scheduled through the given time window.
 * This is called at the start of a simulation advance to ensure we have
 * events to process.
 * 
 * @param db - Database connection
 * @param fromTime - Start of the window (ISO datetime)
 * @param toTime - End of the window (ISO datetime)
 * @param report - SimReport to append notes/metadata
 */
export async function ensureScheduledThrough(
    db: sqlite3.Database,
    fromTime: string,
    toTime: string,
    report: SimReport
): Promise<void> {
    // Delegate to tournament scheduler
    await ensureTournamentsScheduled(db, fromTime, toTime, report);

    // TODO(future): Add other schedulers here
    // - Training session scheduling
    // - Travel scheduling
    // - NPC daily routines
    // - Seasonal events
}
