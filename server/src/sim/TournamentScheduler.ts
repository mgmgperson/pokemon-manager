/**
 * TournamentScheduler.ts
 * 
 * Responsible for ensuring tournament_event rows exist based on tournament_template
 * definitions and their frequency rules.
 * 
 * Schema reference (tournament_template):
 *   - id, name, description
 *   - region_id: nullable (NULL = global)
 *   - frequency: 'one_off' | 'annual' | 'biennial' | 'seasonal' | 'monthly'
 *   - start_month: 1-12 (e.g. 6 = June)
 *   - team_type: 'single' | 'team'
 *   - default_rule_set_id, created_by_user_id
 * 
 * Schema reference (tournament_event):
 *   - id, template_id, edition_label
 *   - start_date: TEXT (ISO date)
 *   - end_date: TEXT (ISO date)
 *   - status: 'scheduled' | 'ongoing' | 'completed' | 'canceled'
 */

import sqlite3 from 'sqlite3';
import { SimReport, TournamentTemplateRow, TournamentEventRow } from '../types/sim';

/**
 * Ensure tournament_event rows exist for recurring templates within the time window.
 * 
 * For v1, this is a stub that documents what needs to happen:
 * 1. Query all tournament_template rows with frequency != 'one_off'
 * 2. For each template, compute the next occurrence date based on frequency/start_month
 * 3. Check if a tournament_event already exists for that template in that period
 * 4. If not, create one with status='scheduled'
 * 
 * @param db - Database connection
 * @param fromTime - Start of the window (ISO datetime)
 * @param toTime - End of the window (ISO datetime)
 * @param report - SimReport to append notes
 */
export async function ensureTournamentsScheduled(
    db: sqlite3.Database,
    fromTime: string,
    toTime: string,
    report: SimReport
): Promise<void> {
    // TODO(v2): Implement actual tournament scheduling logic
    // 
    // Algorithm outline:
    // 1. Parse fromTime/toTime to get year range
    // 2. SELECT * FROM tournament_template WHERE frequency != 'one_off'
    // 3. For each template:
    //    a. Based on frequency and start_month, compute target dates in window
    //    b. For each target date:
    //       - Check if tournament_event exists with that template_id and overlapping dates
    //       - If not, INSERT INTO tournament_event (template_id, edition_label, start_date, status)
    //       - Also create stage_event rows from stage_template
    // 4. Add created event IDs to report.notes
    //
    // For now, this is a no-op stub to allow the system to compile and run.

    report.notes.push('TournamentScheduler: stub - no tournaments auto-scheduled yet');
}

/**
 * Helper to compute next tournament date based on template frequency.
 * 
 * @param template - The tournament template
 * @param afterDate - Find next occurrence after this date
 * @returns ISO date string or null if one_off
 */
export function computeNextTournamentDate(
    template: TournamentTemplateRow,
    afterDate: string
): string | null {
    // TODO(v2): Implement date calculation
    // 
    // Logic depends on template.frequency:
    // - 'one_off': return null (no recurrence)
    // - 'annual': next year's start_month
    // - 'biennial': every 2 years on start_month
    // - 'seasonal': 4x per year (Mar, Jun, Sep, Dec?)
    // - 'monthly': every month
    //
    // For now, return null (no scheduling)
    return null;
}

/**
 * Create stage_event rows for a newly created tournament_event.
 * 
 * @param db - Database connection
 * @param tournamentEventId - The tournament_event.id
 * @param templateId - The tournament_template.id
 */
export async function createStageEventsForTournament(
    db: sqlite3.Database,
    tournamentEventId: number,
    templateId: number
): Promise<void> {
    // TODO(v2): Implement stage creation
    //
    // 1. SELECT * FROM stage_template WHERE tournament_template_id = ?
    // 2. For each stage_template, INSERT INTO stage_event (tournament_event_id, stage_template_id, status='pending')
    //
    // This also needs to handle participant seeding and match bracket generation
    // which is complex and deferred to TournamentRunner.
}
