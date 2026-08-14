import sqlite3 from 'sqlite3';
import { queryAll, queryOne } from '../../../infrastructure/database/sqlite';

interface TournamentTemplateRow {
  id: number;
  name: string;
  description: string | null;
  region_id: number | null;
  region_name: string | null;
  frequency: string | null;
  start_month: number | null;
  team_type: string | null;
  default_rule_set_id: number | null;
  default_rule_set_name: string | null;
}

interface StageTemplateRow {
  id: number;
  seq: number;
  stage_type: string;
  participants: number | null;
  groups: number | null;
  best_of: number | null;
  rule_set_id: number | null;
  rule_set_name: string | null;
}

interface QualificationRuleRow {
  id: number;
  criterion_type: string;
  value: string | null;
  notes: string | null;
}

interface PrizeRow {
  id: number;
  position: number;
  prize_type: string;
  value: string | null;
}

interface BadgeRow {
  id: number;
  code: string;
  name: string;
  category: string;
  description: string | null;
}

export interface TournamentSummary {
  id: number;
  name: string;
  description: string | null;
  region: { id: number; name: string | null } | null;
  frequency: string | null;
  start_month: number | null;
  team_type: string | null;
  default_rule_set: { id: number; name: string | null } | null;
}

export interface TournamentDetail extends TournamentSummary {
  stages: Array<{
    id: number;
    seq: number;
    stage_type: string;
    participants: number | null;
    groups: number | null;
    best_of: number | null;
    rule_set: { id: number; name: string | null } | null;
  }>;
  qualification_rules: QualificationRuleRow[];
  prizes: PrizeRow[];
  badges: BadgeRow[];
}

interface TournamentEventRow {
  id: number;
  edition_label: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

interface TournamentEventDetailRow extends TournamentEventRow {
  template_id: number;
  tournament_name: string;
}

interface StageEventRow {
  id: number;
  status: string;
  seq: number;
  stage_type: string;
  participants: number | null;
  groups: number | null;
  best_of: number | null;
}

interface ParticipantRow {
  participant_id: number;
  seed: number | null;
  stage_event_id: number;
  trainer_id: number;
  fname: string | null;
  lname: string | null;
  pwtr_rating: number | null;
}

export interface TournamentEventDetail {
  id: number;
  template_id: number;
  tournament_name: string;
  edition_label: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  stages: Array<{
    id: number;
    seq: number;
    stage_type: string;
    participants: number | null;
    groups: number | null;
    best_of: number | null;
    status: string;
  }>;
  participants: Array<{
    id: number;
    seed: number | null;
    stage_event_id: number;
    trainer: { id: number; name: string; rating: number | null };
  }>;
}

interface RuleSetRow {
  id: number;
  name: string;
  notes: string | null;
}

interface RuleRow {
  id: number;
  key: string;
  value: string | null;
}

export interface RuleSetDetail extends RuleSetRow {
  rules: RuleRow[];
}

interface MatchRow {
  id: number;
  round: number | null;
  scheduled_at: string | null;
  winner_id: number | null;
  stage_event_id: number;
  stage_seq: number;
  stage_type: string;
  participant_a_seed: number | null;
  trainer_a_id: number;
  trainer_a_fname: string | null;
  trainer_a_lname: string | null;
  participant_b_seed: number | null;
  trainer_b_id: number;
  trainer_b_fname: string | null;
  trainer_b_lname: string | null;
  stadium_name: string | null;
  city_name: string | null;
}

export interface TournamentMatch {
  id: number;
  stage: { id: number; seq: number; type: string };
  round: number | null;
  scheduled_at: string | null;
  participant_a: { seed: number | null; trainer: { id: number; name: string } };
  participant_b: { seed: number | null; trainer: { id: number; name: string } };
  winner_id: number | null;
  stadium: { name: string; city: string | null } | null;
}

interface TournamentBadgeRow extends BadgeRow {
  region_id: number | null;
  region_name: string | null;
  image: string | null;
  tournament_template_id: number | null;
  tournament_name: string | null;
}

export interface TournamentBadge {
  id: number;
  code: string;
  name: string;
  category: string;
  region: { id: number; name: string | null } | null;
  image: string | null;
  description: string | null;
  tournament: { id: number; name: string | null } | null;
}

interface TrainerBadgeRow {
  trainer_badge_id: number;
  awarded_at: string;
  notes: string | null;
  badge_id: number;
  code: string;
  name: string;
  category: string;
  description: string | null;
  event_id: number | null;
  edition_label: string | null;
}

export interface TrainerTournamentBadge {
  id: number;
  awarded_at: string;
  notes: string | null;
  badge: { id: number; code: string; name: string; category: string; description: string | null };
  source_event: { id: number; edition_label: string | null } | null;
}

const TEMPLATE_SELECT = `
  SELECT tt.id, tt.name, tt.description, tt.region_id, r.name AS region_name,
         tt.frequency, tt.start_month, tt.team_type, tt.default_rule_set_id,
         rs.name AS default_rule_set_name
  FROM tournament_template tt
  LEFT JOIN region r ON tt.region_id = r.id
  LEFT JOIN rule_set rs ON tt.default_rule_set_id = rs.id
`;

function mapTournamentSummary(row: TournamentTemplateRow): TournamentSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    region: row.region_id ? { id: row.region_id, name: row.region_name } : null,
    frequency: row.frequency,
    start_month: row.start_month,
    team_type: row.team_type,
    default_rule_set: row.default_rule_set_id
      ? { id: row.default_rule_set_id, name: row.default_rule_set_name }
      : null,
  };
}

export async function findTournamentTemplates(database: sqlite3.Database): Promise<TournamentSummary[]> {
  const rows = await queryAll<TournamentTemplateRow>(database, `${TEMPLATE_SELECT} ORDER BY tt.name`);
  return rows.map(mapTournamentSummary);
}

export async function findTournamentTemplate(
  database: sqlite3.Database,
  tournamentId: string
): Promise<TournamentDetail | null> {
  const template = await queryOne<TournamentTemplateRow>(database, `${TEMPLATE_SELECT} WHERE tt.id = ?`, [tournamentId]);
  if (!template) {
    return null;
  }
  const [stages, qualificationRules, prizes, badges] = await Promise.all([
    queryAll<StageTemplateRow>(database, `
      SELECT st.id, st.seq, st.stage_type, st.participants, st.groups, st.best_of,
             st.rule_set_id, rs.name AS rule_set_name
      FROM stage_template st
      LEFT JOIN rule_set rs ON st.rule_set_id = rs.id
      WHERE st.tournament_template_id = ?
      ORDER BY st.seq
    `, [tournamentId]),
    queryAll<QualificationRuleRow>(database, `
      SELECT qr.id, qr.criterion_type, qr.value, qr.notes
      FROM qualification_rule qr
      WHERE qr.tournament_template_id = ?
    `, [tournamentId]),
    queryAll<PrizeRow>(database, `
      SELECT p.id, p.position, p.prize_type, p.value
      FROM prize p
      WHERE p.tournament_template_id = ?
      ORDER BY p.position
    `, [tournamentId]),
    queryAll<BadgeRow>(database, `
      SELECT b.id, b.code, b.name, b.category, b.description
      FROM badge b
      WHERE b.tournament_template_id = ?
    `, [tournamentId]),
  ]);
  return {
    ...mapTournamentSummary(template),
    stages: stages.map((stage) => ({
      id: stage.id, seq: stage.seq, stage_type: stage.stage_type,
      participants: stage.participants, groups: stage.groups, best_of: stage.best_of,
      rule_set: stage.rule_set_id ? { id: stage.rule_set_id, name: stage.rule_set_name } : null,
    })),
    qualification_rules: qualificationRules,
    prizes,
    badges,
  };
}

export function findTournamentEvents(
  database: sqlite3.Database,
  tournamentId: string
): Promise<TournamentEventRow[]> {
  return queryAll<TournamentEventRow>(database, `
    SELECT te.id, te.edition_label, te.start_date, te.end_date, te.status
    FROM tournament_event te
    WHERE te.template_id = ?
    ORDER BY te.start_date DESC
  `, [tournamentId]);
}

export async function findTournamentEvent(
  database: sqlite3.Database,
  eventId: string
): Promise<TournamentEventDetail | null> {
  const event = await queryOne<TournamentEventDetailRow>(database, `
    SELECT te.id, te.template_id, tt.name AS tournament_name,
           te.edition_label, te.start_date, te.end_date, te.status
    FROM tournament_event te
    JOIN tournament_template tt ON te.template_id = tt.id
    WHERE te.id = ?
  `, [eventId]);
  if (!event) {
    return null;
  }
  const [stages, participants] = await Promise.all([
    queryAll<StageEventRow>(database, `
      SELECT se.id, se.status, st.seq, st.stage_type, st.participants, st.groups, st.best_of
      FROM stage_event se
      JOIN stage_template st ON se.stage_template_id = st.id
      WHERE se.tournament_event_id = ?
      ORDER BY st.seq
    `, [eventId]),
    queryAll<ParticipantRow>(database, `
      SELECT tp.id AS participant_id, tp.seed, tp.stage_event_id, tm.trainer_id,
             t.fname, t.lname, t.pwtr_rating
      FROM tournament_participant tp
      JOIN team_member tm ON tp.id = tm.participant_id
      JOIN trainer t ON tm.trainer_id = t.id
      WHERE tp.stage_event_id IN (
        SELECT se.id FROM stage_event se WHERE se.tournament_event_id = ?
      )
      ORDER BY tp.seed
    `, [eventId]),
  ]);
  return {
    ...event,
    stages: stages.map((stage) => ({
      id: stage.id, seq: stage.seq, stage_type: stage.stage_type,
      participants: stage.participants, groups: stage.groups, best_of: stage.best_of, status: stage.status,
    })),
    participants: participants.map((participant) => ({
      id: participant.participant_id,
      seed: participant.seed,
      stage_event_id: participant.stage_event_id,
      trainer: {
        id: participant.trainer_id,
        name: `${participant.fname} ${participant.lname}`,
        rating: participant.pwtr_rating,
      },
    })),
  };
}

export async function findRuleSet(
  database: sqlite3.Database,
  ruleSetId: string
): Promise<RuleSetDetail | null> {
  const ruleSet = await queryOne<RuleSetRow>(database, 'SELECT id, name, notes FROM rule_set WHERE id = ?', [ruleSetId]);
  if (!ruleSet) {
    return null;
  }
  const rules = await queryAll<RuleRow>(database, `
    SELECT id, key, value FROM rule WHERE rule_set_id = ? ORDER BY key
  `, [ruleSetId]);
  return { ...ruleSet, rules };
}

export async function findTournamentMatches(
  database: sqlite3.Database,
  eventId: string
): Promise<TournamentMatch[]> {
  const rows = await queryAll<MatchRow>(database, `
    SELECT m.id, m.round, m.scheduled_at, m.winner_id, se.id AS stage_event_id,
           st.seq AS stage_seq, st.stage_type, pa.seed AS participant_a_seed,
           ta.id AS trainer_a_id, ta.fname AS trainer_a_fname, ta.lname AS trainer_a_lname,
           pb.seed AS participant_b_seed, tb.id AS trainer_b_id, tb.fname AS trainer_b_fname,
           tb.lname AS trainer_b_lname, s.name AS stadium_name, c.name AS city_name
    FROM match m
    JOIN stage_event se ON m.stage_event_id = se.id
    JOIN stage_template st ON se.stage_template_id = st.id
    JOIN tournament_participant pa ON m.participant_a_id = pa.id
    JOIN tournament_participant pb ON m.participant_b_id = pb.id
    JOIN team_member tma ON pa.id = tma.participant_id
    JOIN team_member tmb ON pb.id = tmb.participant_id
    JOIN trainer ta ON tma.trainer_id = ta.id
    JOIN trainer tb ON tmb.trainer_id = tb.id
    LEFT JOIN stadium s ON m.stadium_id = s.id
    LEFT JOIN city c ON s.city_id = c.id
    WHERE se.tournament_event_id = ?
    ORDER BY st.seq, m.round, m.scheduled_at
  `, [eventId]);
  return rows.map((row) => ({
    id: row.id,
    stage: { id: row.stage_event_id, seq: row.stage_seq, type: row.stage_type },
    round: row.round,
    scheduled_at: row.scheduled_at,
    participant_a: {
      seed: row.participant_a_seed,
      trainer: { id: row.trainer_a_id, name: `${row.trainer_a_fname} ${row.trainer_a_lname}` },
    },
    participant_b: {
      seed: row.participant_b_seed,
      trainer: { id: row.trainer_b_id, name: `${row.trainer_b_fname} ${row.trainer_b_lname}` },
    },
    winner_id: row.winner_id,
    stadium: row.stadium_name ? { name: row.stadium_name, city: row.city_name } : null,
  }));
}

export async function findTournamentBadges(database: sqlite3.Database): Promise<TournamentBadge[]> {
  const rows = await queryAll<TournamentBadgeRow>(database, `
    SELECT b.id, b.code, b.name, b.category, b.region_id, r.name AS region_name,
           b.image, b.description, b.tournament_template_id, tt.name AS tournament_name
    FROM badge b
    LEFT JOIN region r ON b.region_id = r.id
    LEFT JOIN tournament_template tt ON b.tournament_template_id = tt.id
    ORDER BY b.category, b.name
  `);
  return rows.map((row) => ({
    id: row.id, code: row.code, name: row.name, category: row.category,
    region: row.region_id ? { id: row.region_id, name: row.region_name } : null,
    image: row.image, description: row.description,
    tournament: row.tournament_template_id ? { id: row.tournament_template_id, name: row.tournament_name } : null,
  }));
}

export async function findTrainerTournamentBadges(
  database: sqlite3.Database,
  trainerId: string
): Promise<TrainerTournamentBadge[]> {
  const rows = await queryAll<TrainerBadgeRow>(database, `
    SELECT tb.id AS trainer_badge_id, tb.awarded_at, tb.notes, b.id AS badge_id,
           b.code, b.name, b.category, b.description, te.id AS event_id, te.edition_label
    FROM trainer_badge tb
    JOIN badge b ON tb.badge_id = b.id
    LEFT JOIN tournament_event te ON tb.source_event_id = te.id
    WHERE tb.trainer_id = ?
    ORDER BY tb.awarded_at DESC
  `, [trainerId]);
  return rows.map((row) => ({
    id: row.trainer_badge_id,
    awarded_at: row.awarded_at,
    notes: row.notes,
    badge: { id: row.badge_id, code: row.code, name: row.name, category: row.category, description: row.description },
    source_event: row.event_id ? { id: row.event_id, edition_label: row.edition_label } : null,
  }));
}
