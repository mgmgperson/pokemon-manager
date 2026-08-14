import sqlite3 from 'sqlite3';
import {
  queryAll,
  queryOne,
  runStatement,
  type StatementResult,
} from '../../../infrastructure/database/sqlite';
import {
  FIELD_RATING_COLUMNS,
  FORMAT_RATING_COLUMNS,
  MENTAL_RATING_COLUMNS,
  type FieldRatingWriteInput,
  type FormatRatingWriteInput,
  type MentalRatingWriteInput,
  type TrainerListInput,
  type TrainerOptionsInput,
  type TrainerStatusFilter,
  type TrainerTitleFilter,
  type TrainerWriteInput,
} from './trainer.types';

interface TrainerRow {
  id: number;
  fname: string | null;
  lname: string | null;
  region_id: number | null;
  birthdate: string | null;
  pwtr_rating: number | null;
  peak_rating: number | null;
  peak_rank: number | null;
  active_status: boolean | number | null;
}

export interface TrainerSummary extends TrainerRow {
  region_name: string | null;
  title: string;
  rank: number | null;
  age: number | null;
}

export interface TrainerPage {
  trainers: TrainerSummary[];
  totalItems: number;
}

export interface TrainerOption {
  id: number;
  fname: string | null;
  lname: string | null;
}

interface TrainerDetailRow extends TrainerRow {
  region_name: string | null;
  rank: number | null;
  title: string;
}

interface RatingRow {
  id: number;
  trainer_id: number;
  year: number | null;
  overall_rating: number | null;
  typing_rating: number | null;
  mixed_rating: number | null;
  special_rating: number | null;
}

type FormatRatingRow = FormatRatingWriteInput;
type FieldRatingRow = FieldRatingWriteInput;
type MentalRatingRow = MentalRatingWriteInput;

interface HometownRow {
  city_id: number;
  city_name: string;
  region_id: number;
  region_name: string;
}

interface BadgeRow {
  badge_id: number;
  code: string;
  name: string;
  category: string | null;
  image: string | null;
  description: string | null;
  awarded_at: string | null;
  notes: string | null;
}

interface FormatRatingIdRow {
  rating_id: number;
}

export interface TrainerDetail {
  trainer: TrainerDetailRow;
  rating: RatingRow | null;
  format_rating: FormatRatingRow | null;
  field_rating: FieldRatingRow | null;
  mental_rating: MentalRatingRow | null;
  hometowns: HometownRow[];
  badges: BadgeRow[];
}

const TRAINER_COLUMNS: ReadonlyArray<keyof TrainerWriteInput> = [
  'fname',
  'lname',
  'region_id',
  'birthdate',
  'pwtr_rating',
  'peak_rating',
  'peak_rank',
  'active_status',
];

const TRAINER_SORT_COLUMNS = {
  rank: 'rank',
  name: "COALESCE(fname, '') || ' ' || COALESCE(lname, '') COLLATE NOCASE",
  pwtr_rating: 'pwtr_rating',
  region_name: 'region_name COLLATE NOCASE',
  title: 'title COLLATE NOCASE',
  birthdate: 'birthdate',
  age: 'age',
  peak_rating: 'peak_rating',
  peak_rank: 'peak_rank',
  active_status: 'active_status',
} as const;

const TRAINER_SUMMARY_CTE = `
  WITH trainer_summaries AS (
    SELECT
      trainer.*,
      home_region.name AS region_name,
      CASE
        WHEN grand_champion.trainer_id IS NOT NULL THEN 'Grand Champion'
        WHEN gym_leader.id IS NOT NULL THEN type || ' Leader of ' || city.name
        WHEN elite_four.id IS NOT NULL THEN 'Elite Four of ' || elite_region.name
        WHEN champion.id IS NOT NULL THEN 'Champion of ' || champion_region.name
        ELSE 'None'
      END AS title,
      CASE
        WHEN trainer.pwtr_rating IS NULL THEN NULL
        ELSE RANK() OVER (ORDER BY trainer.pwtr_rating DESC)
      END AS rank,
      CASE
        WHEN date(trainer.birthdate) IS NULL
          OR date((SELECT game_state.current_date FROM game_state ORDER BY game_state.id LIMIT 1)) IS NULL
          THEN NULL
        ELSE
          CAST(strftime('%Y', (SELECT game_state.current_date FROM game_state ORDER BY game_state.id LIMIT 1)) AS INTEGER)
          - CAST(strftime('%Y', trainer.birthdate) AS INTEGER)
          - (strftime('%m-%d', (SELECT game_state.current_date FROM game_state ORDER BY game_state.id LIMIT 1))
            < strftime('%m-%d', trainer.birthdate))
      END AS age
    FROM trainer
    LEFT JOIN region AS home_region ON trainer.region_id = home_region.id
    LEFT JOIN gym_leader ON trainer.id = gym_leader.trainer_id
    LEFT JOIN city ON gym_leader.city_id = city.id
    LEFT JOIN elite_four ON trainer.id = elite_four.trainer_id
    LEFT JOIN region AS elite_region ON elite_four.region_id = elite_region.id
    LEFT JOIN champion ON trainer.id = champion.trainer_id
    LEFT JOIN region AS champion_region ON champion.region_id = champion_region.id
    LEFT JOIN grand_champion ON trainer.id = grand_champion.trainer_id
  )
`;

function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function buildTrainerFilters(input: TrainerListInput): { sql: string; parameters: unknown[] } {
  const conditions: string[] = [];
  const parameters: unknown[] = [];

  if (input.search) {
    conditions.push("LOWER(TRIM(COALESCE(fname, '') || ' ' || COALESCE(lname, ''))) LIKE ? ESCAPE '\\'");
    parameters.push(`%${escapeLikePattern(input.search.toLowerCase())}%`);
  }

  if (input.regionId !== undefined) {
    conditions.push('region_id = ?');
    parameters.push(input.regionId);
  }

  appendTitleFilter(conditions, input.title);
  appendStatusFilter(conditions, input.status);

  return {
    sql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    parameters,
  };
}

function appendTitleFilter(conditions: string[], title: TrainerTitleFilter): void {
  if (title === 'champion') {
    conditions.push("title LIKE '%Champion%'");
  } else if (title === 'elite_four') {
    conditions.push("title LIKE '%Elite Four%'");
  } else if (title === 'gym_leader') {
    conditions.push("title LIKE '%Leader%'");
  } else if (title === 'none') {
    conditions.push("title = 'None'");
  }
}

function appendStatusFilter(conditions: string[], status: TrainerStatusFilter): void {
  if (status === 'active') {
    conditions.push('active_status = 1');
  } else if (status === 'inactive') {
    conditions.push('active_status = 0');
  } else if (status === 'unknown') {
    conditions.push('active_status IS NULL');
  }
}

function trainerValues(input: TrainerWriteInput): unknown[] {
  return TRAINER_COLUMNS.map((column) => input[column]);
}

export async function findActiveTrainers(database: sqlite3.Database): Promise<TrainerSummary[]> {
  const trainers = await queryAll<Omit<TrainerSummary, 'rank' | 'age'>>(
    database,
    `
      SELECT
        trainer.*,
        home_region.name AS region_name,
        CASE
          WHEN grand_champion.trainer_id IS NOT NULL THEN 'Grand Champion'
          WHEN gym_leader.id IS NOT NULL THEN type || ' Leader of ' || city.name
          WHEN elite_four.id IS NOT NULL THEN 'Elite Four of ' || elite_region.name
          WHEN champion.id IS NOT NULL THEN 'Champion of ' || champion_region.name
          ELSE 'None'
        END AS title
      FROM trainer
      LEFT JOIN region AS home_region ON trainer.region_id = home_region.id
      LEFT JOIN gym_leader ON trainer.id = gym_leader.trainer_id
      LEFT JOIN city ON gym_leader.city_id = city.id
      LEFT JOIN elite_four ON trainer.id = elite_four.trainer_id
      LEFT JOIN region AS elite_region ON elite_four.region_id = elite_region.id
      LEFT JOIN champion ON trainer.id = champion.trainer_id
      LEFT JOIN region AS champion_region ON champion.region_id = champion_region.id
      LEFT JOIN grand_champion ON trainer.id = grand_champion.trainer_id
      WHERE trainer.active_status = 1
      ORDER BY trainer.pwtr_rating DESC
    `
  );

  return trainers.map((trainer, index) => ({ ...trainer, rank: index + 1, age: null }));
}

export async function findTrainerPage(
  database: sqlite3.Database,
  input: TrainerListInput
): Promise<TrainerPage> {
  const filters = buildTrainerFilters(input);
  const sortColumn = TRAINER_SORT_COLUMNS[input.sortBy];
  const offset = (input.page - 1) * input.pageSize;
  const orderBy =
    input.sortBy === 'rank'
      ? `rank IS NULL ASC, rank ${input.sortOrder.toUpperCase()}, id ASC`
      : `${sortColumn} ${input.sortOrder.toUpperCase()}, id ASC`;

  const [countRow, trainers] = await Promise.all([
    queryOne<{ count: number }>(
      database,
      `${TRAINER_SUMMARY_CTE}
       SELECT COUNT(*) AS count
       FROM trainer_summaries
       ${filters.sql}`,
      filters.parameters
    ),
    queryAll<TrainerSummary>(
      database,
      `${TRAINER_SUMMARY_CTE}
       SELECT *
       FROM trainer_summaries
       ${filters.sql}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...filters.parameters, input.pageSize, offset]
    ),
  ]);

  return { trainers, totalItems: countRow?.count ?? 0 };
}

export function findTrainerOptions(
  database: sqlite3.Database,
  input: TrainerOptionsInput
): Promise<TrainerOption[]> {
  const selectedIdsClause = `trainer.id IN (${input.ids.map(() => '?').join(', ')})`;
  const searchClause =
    "LOWER(TRIM(COALESCE(trainer.fname, '') || ' ' || COALESCE(trainer.lname, ''))) LIKE ? ESCAPE '\\'";
  const whereClauses: string[] = [];
  const parameters: unknown[] = [];

  if (input.search) {
    if (input.ids.length > 0) {
      whereClauses.push(`(${selectedIdsClause} OR ${searchClause})`);
      parameters.push(...input.ids);
    } else {
      whereClauses.push(searchClause);
    }
    parameters.push(`%${escapeLikePattern(input.search.toLowerCase())}%`);
  }

  const selectedFirstOrder =
    input.ids.length > 0 ? `CASE WHEN ${selectedIdsClause} THEN 0 ELSE 1 END,` : '';
  if (input.ids.length > 0) {
    parameters.push(...input.ids);
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  return queryAll<TrainerOption>(
    database,
    `
      SELECT trainer.id, trainer.fname, trainer.lname
      FROM trainer
      ${whereClause}
      ORDER BY ${selectedFirstOrder} trainer.fname COLLATE NOCASE, trainer.lname COLLATE NOCASE, trainer.id
      LIMIT 50
    `,
    parameters
  );
}

export function findInactiveTrainers(database: sqlite3.Database): Promise<TrainerRow[]> {
  return queryAll<TrainerRow>(
    database,
    `
      SELECT * FROM trainer
      WHERE active_status = 0
      ORDER BY pwtr_rating DESC
    `
  );
}

export async function findTrainerDetail(
  database: sqlite3.Database,
  trainerId: string
): Promise<TrainerDetail | null> {
  const trainer = await queryOne<TrainerDetailRow>(
    database,
    `
      WITH ranked_trainers AS (
        SELECT id, RANK() OVER (ORDER BY pwtr_rating DESC) AS rank
        FROM trainer
      )
      SELECT
        trainer.*,
        home_region.name AS region_name,
        ranked_trainers.rank AS rank,
        CASE
          WHEN grand_champion.trainer_id IS NOT NULL THEN 'Grand Champion'
          WHEN gym_leader.id IS NOT NULL THEN type || ' Leader of ' || city.name
          WHEN elite_four.id IS NOT NULL THEN 'Elite Four of ' || elite_region.name
          WHEN champion.id IS NOT NULL THEN 'Champion of ' || champion_region.name
          ELSE 'None'
        END AS title
      FROM trainer
      LEFT JOIN region AS home_region ON trainer.region_id = home_region.id
      LEFT JOIN gym_leader ON trainer.id = gym_leader.trainer_id
      LEFT JOIN city ON gym_leader.city_id = city.id
      LEFT JOIN elite_four ON trainer.id = elite_four.trainer_id
      LEFT JOIN region AS elite_region ON elite_four.region_id = elite_region.id
      LEFT JOIN champion ON trainer.id = champion.trainer_id
      LEFT JOIN region AS champion_region ON champion.region_id = champion_region.id
      LEFT JOIN grand_champion ON trainer.id = grand_champion.trainer_id
      LEFT JOIN ranked_trainers ON trainer.id = ranked_trainers.id
      WHERE trainer.id = ?
    `,
    [trainerId]
  );

  if (!trainer) {
    return null;
  }

  const [rating, hometowns, badges] = await Promise.all([
    queryOne<RatingRow>(
      database,
      `
        SELECT * FROM rating
        WHERE trainer_id = ?
        ORDER BY year DESC
        LIMIT 1
      `,
      [trainerId]
    ),
    queryAll<HometownRow>(
      database,
      `
        SELECT
          city.id AS city_id,
          city.name AS city_name,
          city.region_id AS region_id,
          region.name AS region_name
        FROM trainer_hometown
        JOIN city ON trainer_hometown.city_id = city.id
        JOIN region ON city.region_id = region.id
        WHERE trainer_hometown.trainer_id = ?
      `,
      [trainerId]
    ),
    queryAll<BadgeRow>(
      database,
      `
        SELECT
          badge.id AS badge_id,
          badge.code,
          badge.name,
          badge.category,
          badge.image,
          badge.description,
          trainer_badge.awarded_at,
          trainer_badge.notes
        FROM trainer_badge
        JOIN badge ON trainer_badge.badge_id = badge.id
        WHERE trainer_badge.trainer_id = ?
        ORDER BY trainer_badge.awarded_at DESC
      `,
      [trainerId]
    ),
  ]);

  if (!rating) {
    return {
      trainer,
      rating: null,
      format_rating: null,
      field_rating: null,
      mental_rating: null,
      hometowns,
      badges,
    };
  }

  const [formatRating, fieldRating, mentalRating] = await Promise.all([
    queryOne<FormatRatingRow>(database, 'SELECT * FROM format_rating WHERE rating_id = ?', [rating.id]),
    queryOne<FieldRatingRow>(database, 'SELECT * FROM field_rating WHERE rating_id = ?', [rating.id]),
    queryOne<MentalRatingRow>(database, 'SELECT * FROM mental_rating WHERE rating_id = ?', [rating.id]),
  ]);

  return {
    trainer,
    rating,
    format_rating: formatRating,
    field_rating: fieldRating,
    mental_rating: mentalRating,
    hometowns,
    badges,
  };
}

export function findPokemonForTrainer(
  database: sqlite3.Database,
  trainerId: string
): Promise<Array<Record<string, unknown>>> {
  return queryAll<Record<string, unknown>>(
    database,
    'SELECT * FROM pokemon WHERE trainer_id = ?',
    [trainerId]
  );
}

export function createTrainer(
  database: sqlite3.Database,
  input: TrainerWriteInput
): Promise<StatementResult> {
  return runStatement(
    database,
    `
      INSERT INTO trainer (
        fname, lname, region_id, birthdate, pwtr_rating, peak_rating, peak_rank, active_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    trainerValues(input)
  );
}

export function updateTrainer(
  database: sqlite3.Database,
  trainerId: string,
  input: TrainerWriteInput
): Promise<StatementResult> {
  return runStatement(
    database,
    `
      UPDATE trainer
      SET
        fname = ?,
        lname = ?,
        region_id = ?,
        birthdate = ?,
        pwtr_rating = ?,
        peak_rating = ?,
        peak_rank = ?,
        active_status = ?
      WHERE id = ?
    `,
    [...trainerValues(input), trainerId]
  );
}

export function updateFieldRatings(
  database: sqlite3.Database,
  input: FieldRatingWriteInput
): Promise<StatementResult> {
  const assignments = FIELD_RATING_COLUMNS.map((column) => `${column} = ?`).join(', ');
  const values = FIELD_RATING_COLUMNS.map((column) => input[column]);
  return runStatement(
    database,
    `UPDATE field_rating SET ${assignments} WHERE id = ?`,
    [...values, input.id]
  );
}

export function updateMentalRatings(
  database: sqlite3.Database,
  input: MentalRatingWriteInput
): Promise<StatementResult> {
  const assignments = MENTAL_RATING_COLUMNS.map((column) => `${column} = ?`).join(', ');
  const values = MENTAL_RATING_COLUMNS.map((column) => input[column]);
  return runStatement(
    database,
    `UPDATE mental_rating SET ${assignments} WHERE id = ?`,
    [...values, input.id]
  );
}

export function updateFormatRatings(
  database: sqlite3.Database,
  input: FormatRatingWriteInput
): Promise<StatementResult> {
  const assignments = FORMAT_RATING_COLUMNS.map((column) => `${column} = ?`).join(', ');
  const values = FORMAT_RATING_COLUMNS.map((column) => input[column]);
  return runStatement(
    database,
    `UPDATE format_rating SET ${assignments} WHERE id = ?`,
    [...values, input.id]
  );
}

export function findRatingIdForFormatRating(
  database: sqlite3.Database,
  formatRatingId: number
): Promise<number | null> {
  return queryOne<FormatRatingIdRow>(
    database,
    'SELECT rating_id FROM format_rating WHERE id = ?',
    [formatRatingId]
  ).then((formatRating) => formatRating?.rating_id ?? null);
}

export function updateOverallRating(
  database: sqlite3.Database,
  ratingId: number,
  overallRating: number
): Promise<StatementResult> {
  return runStatement(
    database,
    'UPDATE rating SET overall_rating = ? WHERE id = ?',
    [overallRating, ratingId]
  );
}
