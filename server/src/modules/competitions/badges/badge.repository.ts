import sqlite3 from 'sqlite3';
import { queryAll, queryOne } from '../../../infrastructure/database/sqlite';

export interface BadgeSummary {
  id: number;
  code: string;
  name: string;
  category: string;
  image: string | null;
  description: string | null;
  region_id: number | null;
  region_name: string | null;
  tournament_template_id: number | null;
  tournament_name: string | null;
  trainer_count: number;
}

interface BadgeDetail {
  id: number;
  code: string;
  name: string;
  category: string;
  image: string | null;
  description: string | null;
  region_id: number | null;
  region_name: string | null;
  tournament_template_id: number | null;
  tournament_name: string | null;
  tournament_team_type: string | null;
  tournament_frequency: string | null;
  tournament_start_month: number | null;
}

interface BadgeTrainer {
  trainer_id: number;
  fname: string | null;
  lname: string | null;
  pwtr_rating: number | null;
  peak_rating: number | null;
  peak_rank: number | null;
  region_id: number | null;
  region_name: string | null;
  awarded_at: string;
  notes: string | null;
  event_edition: string | null;
}

export interface BadgeDetails {
  badge: BadgeDetail;
  trainers: BadgeTrainer[];
}

export interface BadgeFilters {
  category?: string;
  regionId?: string;
}

export async function findBadges(
  database: sqlite3.Database,
  filters: BadgeFilters
): Promise<BadgeSummary[]> {
  const conditions: string[] = [];
  const parameters: string[] = [];

  if (filters.category) {
    conditions.push('b.category = ?');
    parameters.push(filters.category);
  }

  if (filters.regionId) {
    conditions.push('b.region_id = ?');
    parameters.push(filters.regionId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return queryAll<BadgeSummary>(
    database,
    `
      SELECT
        b.id,
        b.code,
        b.name,
        b.category,
        b.image,
        b.description,
        b.region_id,
        r.name AS region_name,
        b.tournament_template_id,
        tt.name AS tournament_name,
        COUNT(tb.id) AS trainer_count
      FROM badge b
      LEFT JOIN region r ON b.region_id = r.id
      LEFT JOIN tournament_template tt ON b.tournament_template_id = tt.id
      LEFT JOIN trainer_badge tb ON b.id = tb.badge_id
      ${whereClause}
      GROUP BY b.id
      ORDER BY b.category, b.region_id, b.id
    `,
    parameters
  );
}

export async function findBadgeDetails(
  database: sqlite3.Database,
  badgeId: string
): Promise<BadgeDetails | null> {
  const badgeSql = `
    SELECT
      b.id,
      b.code,
      b.name,
      b.category,
      b.image,
      b.description,
      b.region_id,
      r.name AS region_name,
      b.tournament_template_id,
      tt.name AS tournament_name,
      tt.team_type AS tournament_team_type,
      tt.frequency AS tournament_frequency,
      tt.start_month AS tournament_start_month
    FROM badge b
    LEFT JOIN region r ON b.region_id = r.id
    LEFT JOIN tournament_template tt ON b.tournament_template_id = tt.id
    WHERE b.id = ?
  `;
  const badge = await queryOne<BadgeDetail>(database, badgeSql, [badgeId]);

  if (!badge) {
    return null;
  }

  const trainers = await queryAll<BadgeTrainer>(
    database,
    `
      SELECT
        t.id AS trainer_id,
        t.fname,
        t.lname,
        t.pwtr_rating,
        t.peak_rating,
        t.peak_rank,
        t.region_id,
        r.name AS region_name,
        tb.awarded_at,
        tb.notes,
        te.edition_label AS event_edition
      FROM trainer_badge tb
      JOIN trainer t ON tb.trainer_id = t.id
      LEFT JOIN region r ON t.region_id = r.id
      LEFT JOIN tournament_event te ON tb.source_event_id = te.id
      WHERE tb.badge_id = ?
      ORDER BY tb.awarded_at DESC, t.peak_rating DESC
    `,
    [badgeId]
  );

  return { badge, trainers };
}
