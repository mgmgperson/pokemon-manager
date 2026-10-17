import sqlite3 from 'sqlite3';
import { peakEstimateFallback, peakEstimateStorage, validateSavedPeakEstimate, PEAK_ESTIMATE_COLUMNS } from '../../../infrastructure/database/trainerPeakSchema';
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
  TRAINER_RATING_METRIC_OPTIONS,
  type FieldRatingWriteInput,
  type FormatRatingWriteInput,
  type MentalRatingWriteInput,
  type TrainerListInput,
  type TrainerMissingDataFilter,
  type TrainerOptionsInput,
  type TrainerRatingLeaderboardInput,
  type TrainerRatingMetric,
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
  estimated_peak_ability?: number | null;
  estimated_peak_ability_year?: number | null;
  active_status: boolean | number | null;
}

export interface TrainerSummary extends TrainerRow {
  region_name: string | null;
  title: string;
  rank: number | null;
  age: number | null;
  review_flags: TrainerMissingDataFilter[];
}

export interface TrainerPage {
  trainers: TrainerSummary[];
  totalItems: number;
}

export interface TrainerRatingLeaderboardEntry extends TrainerRow {
  region_name: string | null;
  title: string;
  rank: number | null;
  age: number | null;
  metric_value: number | null;
}

export interface TrainerRatingLeaderboardPage {
  trainers: TrainerRatingLeaderboardEntry[];
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
  pokemon_count: number;
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

const TRAINER_RATING_LEADERBOARD_SORT_COLUMNS = {
  rank: 'rating_rank',
  name: "COALESCE(fname, '') || ' ' || COALESCE(lname, '') COLLATE NOCASE",
  pwtr_rating: 'pwtr_rating',
  region_name: 'region_name COLLATE NOCASE',
  title: 'title COLLATE NOCASE',
  birthdate: 'birthdate',
  age: 'age',
  peak_rating: 'peak_rating',
  peak_rank: 'peak_rank',
  metric: 'metric_value',
} as const;

async function trainerSummaryCte(database: sqlite3.Database): Promise<string> {
  return `
  WITH
  current_game_date AS (
    SELECT (
      SELECT gs."current_date"
      FROM game_state AS gs
      ORDER BY gs.last_played_at DESC, gs.id DESC
      LIMIT 1
    ) AS current_date
  ),
  latest_ranked_ratings AS (
    SELECT
      id,
      trainer_id,
      overall_rating,
      typing_rating,
      mixed_rating,
      special_rating,
      ROW_NUMBER() OVER (PARTITION BY trainer_id ORDER BY year DESC, id DESC) AS row_number
    FROM rating
  ),
  latest_ratings AS (
    SELECT id, trainer_id, overall_rating, typing_rating, mixed_rating, special_rating
    FROM latest_ranked_ratings
    WHERE row_number = 1
  ),
  hometown_summaries AS (
    SELECT trainer_id, COUNT(*) AS hometown_count
    FROM trainer_hometown
    GROUP BY trainer_id
  ),
  pokemon_summaries AS (
    SELECT
      trainer_id,
      COUNT(*) AS pokemon_count,
      MAX(
        CASE
          WHEN level IS NULL
            OR nature_id IS NULL
            OR ability_id IS NULL
            OR gender IS NULL
            OR iv_hp IS NULL
            OR iv_attack IS NULL
            OR iv_defense IS NULL
            OR iv_special_attack IS NULL
            OR iv_special_defense IS NULL
            OR iv_speed IS NULL
            OR ev_hp IS NULL
            OR ev_attack IS NULL
            OR ev_defense IS NULL
            OR ev_special_attack IS NULL
            OR ev_special_defense IS NULL
            OR ev_speed IS NULL
            THEN 1
          ELSE 0
        END
      ) AS has_pokemon_missing_core_details
    FROM pokemon
    GROUP BY trainer_id
  ),
  trainer_summaries AS (
    SELECT
      trainer.*${await peakEstimateFallback(database)},
      home_region.name AS region_name,
      COALESCE(hometown_summaries.hometown_count, 0) AS hometown_count,
      COALESCE(pokemon_summaries.pokemon_count, 0) AS pokemon_count,
      COALESCE(pokemon_summaries.has_pokemon_missing_core_details, 0) AS has_pokemon_missing_core_details,
      latest_ratings.id AS latest_rating_id,
      latest_ratings.overall_rating AS latest_overall_rating,
      latest_ratings.typing_rating AS latest_typing_rating,
      latest_ratings.mixed_rating AS latest_mixed_rating,
      latest_ratings.special_rating AS latest_special_rating,
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
          OR date(current_game_date."current_date") IS NULL
          THEN NULL
        ELSE
          CAST(strftime('%Y', current_game_date."current_date") AS INTEGER)
          - CAST(strftime('%Y', trainer.birthdate) AS INTEGER)
          - (strftime('%m-%d', current_game_date."current_date")
            < strftime('%m-%d', trainer.birthdate))
      END AS age
    FROM trainer
    CROSS JOIN current_game_date
    LEFT JOIN region AS home_region ON trainer.region_id = home_region.id
    LEFT JOIN latest_ratings ON latest_ratings.trainer_id = trainer.id
    LEFT JOIN hometown_summaries ON hometown_summaries.trainer_id = trainer.id
    LEFT JOIN pokemon_summaries ON pokemon_summaries.trainer_id = trainer.id
    LEFT JOIN gym_leader ON trainer.id = gym_leader.trainer_id
    LEFT JOIN city ON gym_leader.city_id = city.id
    LEFT JOIN elite_four ON trainer.id = elite_four.trainer_id
    LEFT JOIN region AS elite_region ON elite_four.region_id = elite_region.id
    LEFT JOIN champion ON trainer.id = champion.trainer_id
    LEFT JOIN region AS champion_region ON champion.region_id = champion_region.id
    LEFT JOIN grand_champion ON trainer.id = grand_champion.trainer_id
  )
`;
}

interface TrainerSummaryRow extends Omit<TrainerSummary, 'review_flags'> {
  hometown_count: number;
  pokemon_count: number;
  has_pokemon_missing_core_details: boolean | number;
  latest_rating_id: number | null;
  latest_overall_rating: number | null;
  latest_typing_rating: number | null;
  latest_mixed_rating: number | null;
  latest_special_rating: number | null;
}

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

  if (input.hometownCityId !== undefined) {
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM trainer_hometown
        WHERE trainer_hometown.trainer_id = trainer_summaries.id
          AND trainer_hometown.city_id = ?
      )
    `);
    parameters.push(input.hometownCityId);
  }

  appendTitleFilter(conditions, input.title);
  appendStatusFilter(conditions, input.status);
  appendMissingDataFilters(conditions, input.missing);

  return {
    sql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    parameters,
  };
}

function appendMissingDataFilters(
  conditions: string[],
  filters: TrainerMissingDataFilter[]
): void {
  if (filters.length === 0) {
    return;
  }

  const filterConditions: Record<TrainerMissingDataFilter, string> = {
    birthdate: 'age IS NULL',
    region: 'region_name IS NULL',
    hometown: 'hometown_count = 0',
    active_status: 'active_status IS NULL',
    pwtr_rating: 'pwtr_rating IS NULL',
    peak_rating: 'peak_rating IS NULL',
    peak_rank: 'peak_rank IS NULL',
    rating: 'latest_rating_id IS NULL',
    general_rating: `
      latest_rating_id IS NOT NULL
      AND (
        latest_overall_rating IS NULL
        OR latest_typing_rating IS NULL
        OR latest_mixed_rating IS NULL
        OR latest_special_rating IS NULL
      )
    `,
    no_pokemon: 'pokemon_count = 0',
    low_pokemon_count: 'pokemon_count BETWEEN 1 AND 5',
    pokemon_details: 'has_pokemon_missing_core_details = 1',
  };

  conditions.push(`(${filters.map((filter) => filterConditions[filter]).join(' OR ')})`);
}

function findReviewFlags(
  trainer: TrainerSummaryRow,
  selectedFilters: TrainerMissingDataFilter[]
): TrainerMissingDataFilter[] {
  const matchesFilter: Record<TrainerMissingDataFilter, boolean> = {
    birthdate: trainer.age === null,
    region: trainer.region_name === null,
    hometown: trainer.hometown_count === 0,
    active_status: trainer.active_status === null,
    pwtr_rating: trainer.pwtr_rating === null,
    peak_rating: trainer.peak_rating === null,
    peak_rank: trainer.peak_rank === null,
    rating: trainer.latest_rating_id === null,
    general_rating:
      trainer.latest_rating_id !== null
      && (
        trainer.latest_overall_rating === null
        || trainer.latest_typing_rating === null
        || trainer.latest_mixed_rating === null
        || trainer.latest_special_rating === null
      ),
    no_pokemon: trainer.pokemon_count === 0,
    low_pokemon_count: trainer.pokemon_count >= 1 && trainer.pokemon_count <= 5,
    pokemon_details: trainer.has_pokemon_missing_core_details === true
      || trainer.has_pokemon_missing_core_details === 1,
  };

  return selectedFilters.filter((filter) => matchesFilter[filter]);
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

function metricExpression(metric: TrainerRatingMetric): string {
  const option = TRAINER_RATING_METRIC_OPTIONS.find((candidate) => candidate.value === metric);
  if (!option) {
    throw new Error(`Unsupported trainer rating metric: ${metric}`);
  }

  if (option.group === 'General') {
    return `latest_${metric}`;
  }
  if (option.group === 'Format') {
    return `format_rating.${metric}`;
  }
  if (option.group === 'Mental') {
    return `mental_rating.${metric}`;
  }
  return `field_rating.${metric}`;
}

export async function findActiveTrainers(database: sqlite3.Database): Promise<TrainerSummary[]> {
  const trainers = await queryAll<Omit<TrainerSummary, 'rank' | 'age'>>(
    database,
    `
      SELECT
        trainer.*${await peakEstimateFallback(database)},
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

  return trainers.map((trainer, index) => ({
    ...trainer,
    rank: index + 1,
    age: null,
    review_flags: [],
  }));
}

export async function findTrainerPage(
  database: sqlite3.Database,
  input: TrainerListInput
): Promise<TrainerPage> {
  const summaryCte = await trainerSummaryCte(database);
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
      `${summaryCte}
       SELECT COUNT(*) AS count
       FROM trainer_summaries
       ${filters.sql}`,
      filters.parameters
    ),
    queryAll<TrainerSummaryRow>(
      database,
      `${summaryCte}
       SELECT *
       FROM trainer_summaries
       ${filters.sql}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...filters.parameters, input.pageSize, offset]
    ),
  ]);

  return {
    trainers: trainers.map((trainer) => {
      const {
        hometown_count: _hometownCount,
        pokemon_count: _pokemonCount,
        has_pokemon_missing_core_details: _hasPokemonMissingCoreDetails,
        latest_rating_id: _latestRatingId,
        latest_overall_rating: _latestOverallRating,
        latest_typing_rating: _latestTypingRating,
        latest_mixed_rating: _latestMixedRating,
        latest_special_rating: _latestSpecialRating,
        ...summary
      } = trainer;

      return { ...summary, review_flags: findReviewFlags(trainer, input.missing) };
    }),
    totalItems: countRow?.count ?? 0,
  };
}

export async function findTrainerRatingLeaderboardPage(
  database: sqlite3.Database,
  input: TrainerRatingLeaderboardInput
): Promise<TrainerRatingLeaderboardPage> {
  const summaryCte = await trainerSummaryCte(database);
  const metricSql = metricExpression(input.metric);
  const sortColumn = TRAINER_RATING_LEADERBOARD_SORT_COLUMNS[input.sortBy];
  const offset = (input.page - 1) * input.pageSize;
  const orderBy = input.sortBy === 'rank' || input.sortBy === 'metric'
    ? `${sortColumn} IS NULL ASC, ${sortColumn} ${input.sortOrder.toUpperCase()}, id ASC`
    : `${sortColumn} ${input.sortOrder.toUpperCase()}, id ASC`;
  const leaderboardCte = `
    ${summaryCte},
    leaderboard_rows AS (
      SELECT
        trainer_summaries.id,
        trainer_summaries.fname,
        trainer_summaries.lname,
        trainer_summaries.region_id,
        trainer_summaries.birthdate,
        trainer_summaries.pwtr_rating,
        trainer_summaries.peak_rating,
        trainer_summaries.peak_rank,
        trainer_summaries.estimated_peak_ability,
        trainer_summaries.estimated_peak_ability_year,
        trainer_summaries.active_status,
        trainer_summaries.region_name,
        trainer_summaries.title,
        trainer_summaries.age,
        CASE
          WHEN ${metricSql} IS NULL THEN NULL
          ELSE RANK() OVER (ORDER BY ${metricSql} DESC)
        END AS rating_rank,
        ${metricSql} AS metric_value
      FROM trainer_summaries
      LEFT JOIN format_rating ON format_rating.rating_id = trainer_summaries.latest_rating_id
      LEFT JOIN mental_rating ON mental_rating.rating_id = trainer_summaries.latest_rating_id
      LEFT JOIN field_rating ON field_rating.rating_id = trainer_summaries.latest_rating_id
      WHERE trainer_summaries.active_status = 1
    )
  `;

  const [countRow, trainers] = await Promise.all([
    queryOne<{ count: number }>(
      database,
      `${leaderboardCte}
       SELECT COUNT(*) AS count
       FROM leaderboard_rows`
    ),
    queryAll<TrainerRatingLeaderboardEntry>(
      database,
      `${leaderboardCte}
       SELECT
         id,
         fname,
         lname,
         region_id,
         birthdate,
         pwtr_rating,
         peak_rating,
         peak_rank,
         estimated_peak_ability,
         estimated_peak_ability_year,
         active_status,
         region_name,
         title,
         rating_rank AS rank,
         age,
         metric_value
       FROM leaderboard_rows
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [input.pageSize, offset]
    ),
  ]);

  return {
    trainers,
    totalItems: countRow?.count ?? 0,
  };
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

export async function findInactiveTrainers(database: sqlite3.Database): Promise<TrainerRow[]> {
  return queryAll<TrainerRow>(
    database,
    `
      SELECT *${await peakEstimateFallback(database)} FROM trainer
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
        SELECT id, CASE WHEN pwtr_rating IS NULL THEN NULL ELSE RANK() OVER (ORDER BY pwtr_rating DESC) END AS rank
        FROM trainer
      )
      SELECT
        trainer.*${await peakEstimateFallback(database)},
        home_region.name AS region_name,
        ranked_trainers.rank AS rank,
        (SELECT COUNT(*) FROM pokemon WHERE trainer_id = trainer.id) AS pokemon_count,
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

export async function createTrainer(
  database: sqlite3.Database,
  input: TrainerWriteInput
): Promise<StatementResult> {
  const hasEstimates = await peakEstimateStorage(database, input.estimated_peak_ability, input.estimated_peak_ability_year);
  await validateSavedPeakEstimate(database, input.estimated_peak_ability, input.estimated_peak_ability_year, input.birthdate);
  const columns = hasEstimates ? [...TRAINER_COLUMNS, ...PEAK_ESTIMATE_COLUMNS] : TRAINER_COLUMNS;
  return runStatement(database,
    `INSERT INTO trainer (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    columns.map((column) => input[column] ?? null));
}

export async function updateTrainer(
  database: sqlite3.Database,
  trainerId: string,
  input: TrainerWriteInput
): Promise<StatementResult> {
  const hasEstimates = await peakEstimateStorage(database, input.estimated_peak_ability, input.estimated_peak_ability_year);
  const previous = await queryOne<TrainerRow>(database,
    `SELECT *${await peakEstimateFallback(database)} FROM trainer WHERE id = ?`, [trainerId]);
  const ability = input.estimated_peak_ability === undefined ? previous?.estimated_peak_ability : input.estimated_peak_ability;
  const year = input.estimated_peak_ability_year === undefined ? previous?.estimated_peak_ability_year : input.estimated_peak_ability_year;
  await validateSavedPeakEstimate(database, ability, year, input.birthdate);
  const columns = [...TRAINER_COLUMNS, ...PEAK_ESTIMATE_COLUMNS.filter((column) => hasEstimates && input[column] !== undefined)];
  return runStatement(database,
    `UPDATE trainer SET ${columns.map((column) => `${column} = ?`).join(', ')} WHERE id = ?`,
    [...columns.map((column) => input[column] ?? null), trainerId]);
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
