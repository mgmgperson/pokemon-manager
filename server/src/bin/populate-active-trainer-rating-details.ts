import { open, readFile } from 'fs/promises';
import { resolve } from 'path';
import sqlite3 from 'sqlite3';
import { generateFieldRatings } from '../generators/fieldRatingGenerator';
import { generateFormatRatingsFixed } from '../generators/formatRatingGenerator';
import { generateMentalRatings } from '../generators/mentalRatingGenerator';
import { closeDatabase, openDatabase, queryAll, queryOne, runInTransaction, runStatement } from '../infrastructure/database/sqlite';
import {
  FIELD_RATING_COLUMNS,
  FORMAT_RATING_COLUMNS,
  MENTAL_RATING_COLUMNS,
  type FieldRatingColumn,
  type FormatRatingColumn,
  type MentalRatingColumn,
} from '../modules/trainers/trainer/trainer.types';

const PLAN_VERSION = 1;

type PopulationMode = 'create' | 'replace';
type StoredRatingValues<Column extends string> = { rating_id: number } & Record<Column, number | null>;
type GeneratedRatingValues<Column extends string> = Record<Column, number>;

interface ScriptOptions {
  databasePath: string;
  planPath: string;
  apply: boolean;
  limit: number | undefined;
}

interface ActiveRatingRow {
  trainer_id: number;
  fname: string | null;
  lname: string | null;
  rating_id: number;
  overall_rating: number | null;
  typing_rating: number | null;
  mixed_rating: number | null;
  special_rating: number | null;
}

interface TrainerPokemonRow {
  trainer_id: number;
  species_id: number;
  pokemon_id: number;
  level: number;
  is_mega: number | null;
  is_gigantamax: number | null;
}

interface FamilyPlan<Column extends string> {
  mode: PopulationMode;
  values: GeneratedRatingValues<Column>;
}

interface ActiveTrainerRatingPlan {
  trainerId: number;
  trainerName: string;
  ratingId: number;
  format?: FamilyPlan<FormatRatingColumn>;
  mental?: FamilyPlan<MentalRatingColumn>;
  field?: FamilyPlan<FieldRatingColumn>;
}

interface RatingDetailsPlan {
  version: number;
  databasePath: string;
  activeOnly: true;
  plans: ActiveTrainerRatingPlan[];
}

interface RatingFamily<Column extends string> {
  tableName: 'format_rating' | 'mental_rating' | 'field_rating';
  columns: readonly Column[];
}

const formatFamily: RatingFamily<FormatRatingColumn> = {
  tableName: 'format_rating',
  columns: FORMAT_RATING_COLUMNS,
};

const mentalFamily: RatingFamily<MentalRatingColumn> = {
  tableName: 'mental_rating',
  columns: MENTAL_RATING_COLUMNS,
};

const fieldFamily: RatingFamily<FieldRatingColumn> = {
  tableName: 'field_rating',
  columns: FIELD_RATING_COLUMNS,
};

function usage(): string {
  return [
    'Usage:',
    '  npx ts-node src/bin/populate-active-trainer-rating-details.ts --database <path> --plan <path> [--limit <count>]',
    '  npx ts-node src/bin/populate-active-trainer-rating-details.ts --database <path> --plan <path> --apply',
    '',
    'The first command creates a read-only, reviewable plan for active trainers only.',
    'The --apply command uses that exact plan and only creates or replaces wholly null/zero rating families.',
  ].join('\n');
}

function parsePositiveInteger(value: string, label: string): number {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${label} must be a positive whole number`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive whole number`);
  }
  return parsed;
}

function parseOptions(argumentsList: string[]): ScriptOptions {
  let databasePath: string | undefined;
  let planPath: string | undefined;
  let apply = false;
  let limit: number | undefined;

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--database' || argument === '--plan' || argument === '--limit') {
      const value = argumentsList[index + 1];
      if (!value) {
        throw new Error(`${argument} requires a value`);
      }
      if (argument === '--database') {
        databasePath = value;
      } else if (argument === '--plan') {
        planPath = value;
      } else {
        limit = parsePositiveInteger(value, '--limit');
      }
      index += 1;
    } else if (argument === '--apply') {
      apply = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!databasePath || !planPath) {
    throw new Error('--database and --plan are required');
  }
  if (apply && limit !== undefined) {
    throw new Error('--limit is only available while creating a plan');
  }

  return {
    databasePath: resolve(process.cwd(), databasePath),
    planPath: resolve(process.cwd(), planPath),
    apply,
    limit,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requirePositiveInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    throw new Error(`Invalid ${label} in active-trainer rating plan`);
  }
  return value;
}

function requireRatingValue(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 99) {
    throw new Error(`Invalid ${label} in active-trainer rating plan`);
  }
  return value;
}

function parseValues<Column extends string>(
  value: unknown,
  columns: readonly Column[]
): GeneratedRatingValues<Column> {
  if (!isRecord(value)) {
    throw new Error('Invalid rating values in active-trainer rating plan');
  }
  const values = {} as GeneratedRatingValues<Column>;
  for (const column of columns) {
    values[column] = requireRatingValue(value[column], column);
  }
  return values;
}

function parseFamilyPlan<Column extends string>(
  value: unknown,
  family: RatingFamily<Column>
): FamilyPlan<Column> | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isRecord(value) || (value.mode !== 'create' && value.mode !== 'replace')) {
    throw new Error(`Invalid ${family.tableName} plan`);
  }
  return {
    mode: value.mode,
    values: parseValues(value.values, family.columns),
  };
}

function parsePlan(content: string, expectedDatabasePath: string): RatingDetailsPlan {
  const value: unknown = JSON.parse(content);
  if (
    !isRecord(value)
    || value.version !== PLAN_VERSION
    || value.databasePath !== expectedDatabasePath
    || value.activeOnly !== true
    || !Array.isArray(value.plans)
  ) {
    throw new Error('Invalid or mismatched active-trainer rating plan');
  }

  const plans = value.plans.map((entry): ActiveTrainerRatingPlan => {
    if (!isRecord(entry) || typeof entry.trainerName !== 'string') {
      throw new Error('Invalid trainer entry in active-trainer rating plan');
    }
    return {
      trainerId: requirePositiveInteger(entry.trainerId, 'trainerId'),
      trainerName: entry.trainerName,
      ratingId: requirePositiveInteger(entry.ratingId, 'ratingId'),
      format: parseFamilyPlan(entry.format, formatFamily),
      mental: parseFamilyPlan(entry.mental, mentalFamily),
      field: parseFamilyPlan(entry.field, fieldFamily),
    };
  });
  const trainerIds = new Set(plans.map((plan) => plan.trainerId));
  if (trainerIds.size !== plans.length) {
    throw new Error('Active-trainer rating plan contains duplicate trainers');
  }

  return {
    version: PLAN_VERSION,
    databasePath: expectedDatabasePath,
    activeOnly: true,
    plans,
  };
}

function isMissingValue(value: number | null): boolean {
  return value === null || value === 0;
}

function populationModeFor<Column extends string>(
  row: StoredRatingValues<Column> | undefined,
  columns: readonly Column[]
): PopulationMode | undefined {
  if (!row) {
    return 'create';
  }
  return columns.every((column) => isMissingValue(row[column])) ? 'replace' : undefined;
}

function completeGeneralRatings(row: ActiveRatingRow): {
  overall: number;
  typing: number;
  mixed: number;
  special: number;
} {
  const overall = row.overall_rating;
  const typing = row.typing_rating;
  const mixed = row.mixed_rating;
  const special = row.special_rating;
  const values = [overall, typing, mixed, special];
  if (values.some((value) => value === null || value <= 0 || value > 99)) {
    throw new Error(`Active trainer ${row.trainer_id} does not have complete non-zero general ratings`);
  }
  return {
    overall: overall as number,
    typing: typing as number,
    mixed: mixed as number,
    special: special as number,
  };
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function withDeterministicRandom<T>(seed: string, work: () => T): T {
  const originalRandom = Math.random;
  let state = hashSeed(seed);
  Math.random = (): number => {
    state += 0x6D2B79F5;
    let result = state;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };

  try {
    return work();
  } finally {
    Math.random = originalRandom;
  }
}

function trainerName(row: ActiveRatingRow): string {
  return [row.fname, row.lname].filter(Boolean).join(' ') || `Trainer ${row.trainer_id}`;
}

function valuesFrom<Column extends string>(
  source: object,
  columns: readonly Column[]
): GeneratedRatingValues<Column> {
  const values = {} as GeneratedRatingValues<Column>;
  const sourceValues = source as Record<string, unknown>;
  for (const column of columns) {
    const value = sourceValues[column];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 99) {
      throw new Error(`Generator returned an invalid ${column} value`);
    }
    values[column] = value;
  }
  return values;
}

async function findActiveRatings(database: sqlite3.Database): Promise<ActiveRatingRow[]> {
  return queryAll<ActiveRatingRow>(
    database,
    `
      WITH ranked_ratings AS (
        SELECT
          id,
          trainer_id,
          overall_rating,
          typing_rating,
          mixed_rating,
          special_rating,
          ROW_NUMBER() OVER (PARTITION BY trainer_id ORDER BY year DESC, id DESC) AS row_number
        FROM rating
      )
      SELECT
        trainer.id AS trainer_id,
        trainer.fname,
        trainer.lname,
        ranked_ratings.id AS rating_id,
        ranked_ratings.overall_rating,
        ranked_ratings.typing_rating,
        ranked_ratings.mixed_rating,
        ranked_ratings.special_rating
      FROM trainer
      JOIN ranked_ratings ON ranked_ratings.trainer_id = trainer.id AND ranked_ratings.row_number = 1
      WHERE trainer.active_status = 1
      ORDER BY trainer.id
    `
  );
}

async function findFamilyRows<Column extends string>(
  database: sqlite3.Database,
  family: RatingFamily<Column>
): Promise<Map<number, StoredRatingValues<Column>>> {
  const rows = await queryAll<StoredRatingValues<Column>>(
    database,
    `
      WITH ranked_ratings AS (
        SELECT id, trainer_id, ROW_NUMBER() OVER (PARTITION BY trainer_id ORDER BY year DESC, id DESC) AS row_number
        FROM rating
      )
      SELECT ${['rating_id', ...family.columns].join(', ')}
      FROM ${family.tableName}
      WHERE rating_id IN (
        SELECT ranked_ratings.id
        FROM trainer
        JOIN ranked_ratings ON ranked_ratings.trainer_id = trainer.id AND ranked_ratings.row_number = 1
        WHERE trainer.active_status = 1
      )
    `
  );
  return new Map(rows.map((row) => [row.rating_id, row]));
}

async function findActivePokemon(database: sqlite3.Database): Promise<Map<number, TrainerPokemonRow[]>> {
  const rows = await queryAll<TrainerPokemonRow>(
    database,
    `
      SELECT pokemon.trainer_id, pokemon.species_id, pokemon.pokemon_id, pokemon.level, pokemon.is_mega, pokemon.is_gigantamax
      FROM pokemon
      JOIN trainer ON trainer.id = pokemon.trainer_id
      WHERE trainer.active_status = 1
      ORDER BY pokemon.trainer_id, pokemon.id
    `
  );
  const pokemonByTrainer = new Map<number, TrainerPokemonRow[]>();
  for (const row of rows) {
    const current = pokemonByTrainer.get(row.trainer_id) ?? [];
    current.push(row);
    pokemonByTrainer.set(row.trainer_id, current);
  }
  return pokemonByTrainer;
}

async function createPlan(database: sqlite3.Database, limit: number | undefined): Promise<RatingDetailsPlan> {
  const [activeRatings, formatRows, mentalRows, fieldRows, pokemonByTrainer] = await Promise.all([
    findActiveRatings(database),
    findFamilyRows(database, formatFamily),
    findFamilyRows(database, mentalFamily),
    findFamilyRows(database, fieldFamily),
    findActivePokemon(database),
  ]);

  const eligibleRatings = activeRatings.filter((rating) => (
    populationModeFor(formatRows.get(rating.rating_id), formatFamily.columns) !== undefined
    || populationModeFor(mentalRows.get(rating.rating_id), mentalFamily.columns) !== undefined
    || populationModeFor(fieldRows.get(rating.rating_id), fieldFamily.columns) !== undefined
  ));
  const plannedRatings = limit === undefined ? eligibleRatings : eligibleRatings.slice(0, limit);

  const plans = plannedRatings.map((rating): ActiveTrainerRatingPlan => {
    const general = completeGeneralRatings(rating);
    const formatMode = populationModeFor(formatRows.get(rating.rating_id), formatFamily.columns);
    const mentalMode = populationModeFor(mentalRows.get(rating.rating_id), mentalFamily.columns);
    const fieldMode = populationModeFor(fieldRows.get(rating.rating_id), fieldFamily.columns);
    const pokemon = pokemonByTrainer.get(rating.trainer_id) ?? [];
    if (fieldMode !== undefined && pokemon.length === 0) {
      throw new Error(`Active trainer ${rating.trainer_id} needs field ratings but has no Pokémon`);
    }

    return withDeterministicRandom(JSON.stringify({
      version: PLAN_VERSION,
      trainerId: rating.trainer_id,
      ratingId: rating.rating_id,
      general,
      formatMode,
      mentalMode,
      fieldMode,
      pokemon,
    }), () => ({
      trainerId: rating.trainer_id,
      trainerName: trainerName(rating),
      ratingId: rating.rating_id,
      format: formatMode === undefined
        ? undefined
        : {
          mode: formatMode,
          values: valuesFrom(generateFormatRatingsFixed(general.overall, rating.trainer_id, rating.rating_id), formatFamily.columns),
        },
      mental: mentalMode === undefined
        ? undefined
        : {
          mode: mentalMode,
          values: valuesFrom(generateMentalRatings(general.overall), mentalFamily.columns),
        },
      field: fieldMode === undefined
        ? undefined
        : {
          mode: fieldMode,
          values: valuesFrom(generateFieldRatings(pokemon.map((pokemonInstance) => ({
            ...pokemonInstance,
            is_mega: pokemonInstance.is_mega ?? undefined,
            is_gigantamax: pokemonInstance.is_gigantamax ?? undefined,
          })), general), fieldFamily.columns),
        },
    }));
  });

  return {
    version: PLAN_VERSION,
    databasePath: '',
    activeOnly: true,
    plans,
  };
}

async function writePlan(planPath: string, plan: RatingDetailsPlan): Promise<void> {
  const file = await open(planPath, 'wx');
  try {
    await file.writeFile(`${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  } finally {
    await file.close();
  }
}

async function findCurrentFamilyRow<Column extends string>(
  database: sqlite3.Database,
  ratingId: number,
  family: RatingFamily<Column>
): Promise<StoredRatingValues<Column> | null> {
  return queryOne<StoredRatingValues<Column>>(
    database,
    `SELECT ${['rating_id', ...family.columns].join(', ')} FROM ${family.tableName} WHERE rating_id = ?`,
    [ratingId]
  );
}

async function applyFamily<Column extends string>(
  database: sqlite3.Database,
  ratingId: number,
  family: RatingFamily<Column>,
  plan: FamilyPlan<Column>
): Promise<void> {
  const current = await findCurrentFamilyRow(database, ratingId, family);
  if (plan.mode === 'create' && current !== null) {
    throw new Error(`${family.tableName} already exists for rating ${ratingId}`);
  }
  if (plan.mode === 'replace' && (current === null || !family.columns.every((column) => isMissingValue(current[column])))) {
    throw new Error(`${family.tableName} for rating ${ratingId} no longer matches its reviewed plan`);
  }

  const values = family.columns.map((column) => plan.values[column]);
  if (plan.mode === 'create') {
    await runStatement(
      database,
      `INSERT INTO ${family.tableName} (rating_id, ${family.columns.join(', ')}) VALUES (?, ${family.columns.map(() => '?').join(', ')})`,
      [ratingId, ...values]
    );
    return;
  }

  await runStatement(
    database,
    `UPDATE ${family.tableName} SET ${family.columns.map((column) => `${column} = ?`).join(', ')} WHERE rating_id = ?`,
    [...values, ratingId]
  );
}

async function applyPlan(database: sqlite3.Database, plan: RatingDetailsPlan): Promise<void> {
  await runInTransaction(database, async () => {
    for (const trainerPlan of plan.plans) {
      const activeTrainer = await queryOne<{ id: number }>(
        database,
        'SELECT id FROM trainer WHERE id = ? AND active_status = 1',
        [trainerPlan.trainerId]
      );
      if (activeTrainer === null) {
        throw new Error(`Trainer ${trainerPlan.trainerId} is no longer active`);
      }
      const currentRating = await queryOne<{ id: number }>(
        database,
        `
          SELECT id
          FROM rating
          WHERE trainer_id = ?
          ORDER BY year DESC, id DESC
          LIMIT 1
        `,
        [trainerPlan.trainerId]
      );
      if (currentRating?.id !== trainerPlan.ratingId) {
        throw new Error(`Trainer ${trainerPlan.trainerId} no longer has the reviewed current rating`);
      }

      if (trainerPlan.format) {
        await applyFamily(database, trainerPlan.ratingId, formatFamily, trainerPlan.format);
      }
      if (trainerPlan.mental) {
        await applyFamily(database, trainerPlan.ratingId, mentalFamily, trainerPlan.mental);
      }
      if (trainerPlan.field) {
        await applyFamily(database, trainerPlan.ratingId, fieldFamily, trainerPlan.field);
      }
    }
  });
}

function summarizeFamily<Column extends string>(
  plans: ActiveTrainerRatingPlan[],
  selector: (plan: ActiveTrainerRatingPlan) => FamilyPlan<Column> | undefined
): { create: number; replace: number } {
  return plans.reduce(
    (summary, plan) => {
      const familyPlan = selector(plan);
      if (familyPlan) {
        summary[familyPlan.mode] += 1;
      }
      return summary;
    },
    { create: 0, replace: 0 }
  );
}

function outputPlan(plan: RatingDetailsPlan, mode: 'dry-run' | 'applied'): void {
  console.log(JSON.stringify({
    mode,
    databasePath: plan.databasePath,
    activeOnly: true,
    trainersAffected: plan.plans.length,
    format: summarizeFamily(plan.plans, (trainerPlan) => trainerPlan.format),
    mental: summarizeFamily(plan.plans, (trainerPlan) => trainerPlan.mental),
    field: summarizeFamily(plan.plans, (trainerPlan) => trainerPlan.field),
    sample: plan.plans.slice(0, 10).map((trainerPlan) => ({
      trainerId: trainerPlan.trainerId,
      trainerName: trainerPlan.trainerName,
      ratingId: trainerPlan.ratingId,
      format: trainerPlan.format?.mode,
      mental: trainerPlan.mental?.mode,
      field: trainerPlan.field?.mode,
    })),
  }, null, 2));
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  if (!options.apply) {
    const database = await openDatabase(options.databasePath, sqlite3.OPEN_READONLY);
    try {
      const generatedPlan = await createPlan(database, options.limit);
      const plan: RatingDetailsPlan = { ...generatedPlan, databasePath: options.databasePath };
      await writePlan(options.planPath, plan);
      outputPlan(plan, 'dry-run');
    } finally {
      await closeDatabase(database);
    }
    return;
  }

  const plan = parsePlan(await readFile(options.planPath, 'utf8'), options.databasePath);
  const database = await openDatabase(options.databasePath, sqlite3.OPEN_READWRITE);
  try {
    await applyPlan(database, plan);
    outputPlan(plan, 'applied');
  } finally {
    await closeDatabase(database);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  console.error(usage());
  process.exitCode = 1;
});
