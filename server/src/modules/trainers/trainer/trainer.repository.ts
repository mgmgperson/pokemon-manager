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
  rank: number;
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

function trainerValues(input: TrainerWriteInput): unknown[] {
  return TRAINER_COLUMNS.map((column) => input[column]);
}

export async function findActiveTrainers(database: sqlite3.Database): Promise<TrainerSummary[]> {
  const trainers = await queryAll<Omit<TrainerSummary, 'rank'>>(
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

  return trainers.map((trainer, index) => ({ ...trainer, rank: index + 1 }));
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
