import sqlite3 from 'sqlite3';
import { queryAll } from '../../../infrastructure/database/sqlite';

export interface TravelLogEntry {
  id: number;
  trainer_id: number;
  from_location_id: number | null;
  to_location_id: number | null;
  departure_time: string;
  arrival_time: string | null;
  notes: string | null;
  from_location_name: string | null;
  to_location_name: string | null;
  from_region_name: string | null;
  to_region_name: string | null;
}

export interface MatchHistoryEntry {
  match_id: number;
  round: number | null;
  scheduled_at: string | null;
  winner_id: number | null;
  stadium_name: string | null;
  stadium_type: string | null;
  city_name: string | null;
  region_name: string | null;
  tournament_edition: string | null;
  tournament_name: string | null;
  participant_a_id: number;
  participant_b_id: number;
  trainer_a_fname: string | null;
  trainer_a_lname: string | null;
  trainer_b_fname: string | null;
  trainer_b_lname: string | null;
  winner_fname: string | null;
  winner_lname: string | null;
}

export interface RecentPokemonEntry {
  id: number;
  pokemon_id: number;
  species_id: number;
  nickname: string | null;
  level: number;
  level_met_at: number | null;
  date_met_at: string | null;
  location_met_at: string | null;
  ot_name: string | null;
  ot_id: number | null;
  gender: string | null;
  shiny: number | null;
  pokeball_id: number | null;
}

export function findTravelHistory(
  database: sqlite3.Database,
  trainerId: string
): Promise<TravelLogEntry[]> {
  return queryAll<TravelLogEntry>(
    database,
    `
      SELECT
        tl.id,
        tl.trainer_id,
        tl.from_location_id,
        tl.to_location_id,
        tl.departure_time,
        tl.arrival_time,
        tl.notes,
        fromLoc.name AS from_location_name,
        toLoc.name AS to_location_name,
        fromRegion.name AS from_region_name,
        toRegion.name AS to_region_name
      FROM travel_log tl
      LEFT JOIN location fromLoc ON tl.from_location_id = fromLoc.id
      LEFT JOIN location toLoc ON tl.to_location_id = toLoc.id
      LEFT JOIN region fromRegion ON fromLoc.region_id = fromRegion.id
      LEFT JOIN region toRegion ON toLoc.region_id = toRegion.id
      WHERE tl.trainer_id = ?
      ORDER BY tl.departure_time DESC, tl.id DESC
      LIMIT 50
    `,
    [trainerId]
  );
}

export function findMatchHistory(
  database: sqlite3.Database,
  trainerId: string
): Promise<MatchHistoryEntry[]> {
  return queryAll<MatchHistoryEntry>(
    database,
    `
      SELECT
        m.id AS match_id,
        m.round,
        m.scheduled_at,
        m.winner_id,
        s.name AS stadium_name,
        s.type AS stadium_type,
        c.name AS city_name,
        r.name AS region_name,
        te.edition_label AS tournament_edition,
        tt.name AS tournament_name,
        pa.id AS participant_a_id,
        pb.id AS participant_b_id,
        ta.fname AS trainer_a_fname,
        ta.lname AS trainer_a_lname,
        tb.fname AS trainer_b_fname,
        tb.lname AS trainer_b_lname,
        tw.fname AS winner_fname,
        tw.lname AS winner_lname
      FROM match m
      JOIN stage_event se ON m.stage_event_id = se.id
      JOIN tournament_event te ON se.tournament_event_id = te.id
      JOIN tournament_template tt ON te.template_id = tt.id
      LEFT JOIN stadium s ON m.stadium_id = s.id
      LEFT JOIN city c ON s.city_id = c.id
      LEFT JOIN region r ON c.region_id = r.id
      JOIN tournament_participant pa ON m.participant_a_id = pa.id
      JOIN tournament_participant pb ON m.participant_b_id = pb.id
      LEFT JOIN team_member tma ON pa.id = tma.participant_id
      LEFT JOIN team_member tmb ON pb.id = tmb.participant_id
      LEFT JOIN trainer ta ON tma.trainer_id = ta.id
      LEFT JOIN trainer tb ON tmb.trainer_id = tb.id
      LEFT JOIN tournament_participant pw ON m.winner_id = pw.id
      LEFT JOIN team_member tmw ON pw.id = tmw.participant_id
      LEFT JOIN trainer tw ON tmw.trainer_id = tw.id
      WHERE tma.trainer_id = ? OR tmb.trainer_id = ?
      ORDER BY m.scheduled_at DESC
      LIMIT 50
    `,
    [trainerId, trainerId]
  );
}

export function findRecentPokemon(
  database: sqlite3.Database,
  trainerId: string,
  limit: number
): Promise<RecentPokemonEntry[]> {
  return queryAll<RecentPokemonEntry>(
    database,
    `
      SELECT
        p.id,
        p.pokemon_id,
        p.species_id,
        p.nickname,
        p.level,
        p.level_met_at,
        p.date_met_at,
        p.location_met_at,
        p.ot_name,
        p.ot_id,
        p.gender,
        p.shiny,
        p.pokeball_id
      FROM pokemon p
      WHERE p.trainer_id = ?
      ORDER BY p.date_met_at DESC, p.id DESC
      LIMIT ?
    `,
    [trainerId, limit]
  );
}
