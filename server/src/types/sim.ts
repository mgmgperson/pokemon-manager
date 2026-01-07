/**
 * Type definitions for the world simulation system.
 * 
 * These types define the contract between the API route and the simulation engine.
 */

// Request modes for advancing the simulation
export type SimAdvanceMode = 'byTime' | 'toNextEvent';

// Time step granularity
export type SimTimeStep = 'hour' | 'day' | 'week';

// Request body for POST /sim/advance
export interface SimAdvanceRequest {
    mode: SimAdvanceMode;
    step?: SimTimeStep;          // default 'day', used for byTime mode or fallback
    amount?: number;             // default 1, how many steps to advance
    maxOps?: number;             // default 1000, safety limit
    seed?: number;               // optional RNG seed for determinism
    dryRun?: boolean;            // if true, rollback changes (return metadata only)
    gameStateId?: number;        // if multiple saves supported; otherwise uses first row
}

// Badge award info returned by the simulation
export interface AwardedBadge {
    trainerId: number;
    badgeId: number;
    source: string;              // e.g. 'tournament', 'gym', 'manual'
    sourceId?: number;           // e.g. tournament_event.id
}

// The simulation report returned to the client
export interface SimReport {
    fromTime: string;            // ISO datetime string
    toTime: string;              // ISO datetime string
    resolvedEventInstanceIds: number[];
    simmedMatchIds: number[];
    awardedBadges: AwardedBadge[];
    notes: string[];             // debug/info messages
}

// Internal cursor state used during simulation loop
export interface SimCursor {
    currentDate: string;         // matches game_state.current_date (ISO date)
    currentTime: string;         // matches game_state.current_time (HH:MM:SS or similar)
}

// DB row types derived from schema.sql

// game_state table row
export interface GameStateRow {
    id: number;
    save_name: string;
    created_at: string;
    last_played_at: string;
    current_date: string;        // ISO date
    current_time: string;        // time string
    active_trainer_id: number;
    active_location_id: number;
}

// match table row (relevant columns)
export interface MatchRow {
    id: number;
    stage_event_id: number;
    round: number | null;
    participant_a_id: number;
    participant_b_id: number;
    stadium_id: number | null;
    winner_id: number | null;    // NULL until finished
    scheduled_at: string | null; // ISO datetime
    field_id: number | null;
}

// event_instance table row (relevant columns)
export interface EventInstanceRow {
    id: number;
    template_id: number | null;
    type: string;
    title: string;
    subtitle: string | null;
    status: string;              // 'scheduled' | 'active' | 'resolved' | 'canceled'
    starts_at: string;           // ISO datetime
    ends_at: string | null;
    priority: number;
    match_id: number | null;
    tournament_event_id: number | null;
}

// tournament_event table row
export interface TournamentEventRow {
    id: number;
    template_id: number;
    edition_label: string | null;
    start_date: string | null;   // ISO date
    end_date: string | null;
    status: string;              // 'scheduled' | 'ongoing' | 'completed' | 'canceled'
}

// tournament_template table row
export interface TournamentTemplateRow {
    id: number;
    name: string;
    description: string | null;
    region_id: number | null;
    frequency: string | null;    // 'one_off' | 'annual' | 'biennial' | 'seasonal' | 'monthly'
    start_month: number | null;  // 1-12
    team_type: string | null;    // 'single' | 'team'
    default_rule_set_id: number | null;
    created_by_user_id: number | null;
}

// tournament_participant (for match resolution)
export interface TournamentParticipantRow {
    id: number;
    stage_event_id: number;
    seed: number | null;
}

// team_member table (links participant to trainer)
export interface TeamMemberRow {
    id: number;
    participant_id: number;
    trainer_id: number;
}

// trainer_badge table row
export interface TrainerBadgeRow {
    id: number;
    trainer_id: number;
    badge_id: number;
    awarded_at: string;
    source_event_id: number | null;
    notes: string | null;
}
