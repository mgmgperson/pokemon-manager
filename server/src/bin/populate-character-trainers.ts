import { resolve } from 'path';
import sqlite3 from 'sqlite3';
import { generateGeneralRatings } from '../generators/generalRatingGenerator';
import { generatePokemonTeam, generatePokemonTeamSize } from '../generators/pokemonGenerator';
import { generatePokemonDetails } from '../generators/pokemonSetGenerator';
import { closeDatabase, openDatabase, queryAll, runInTransaction } from '../infrastructure/database/sqlite';
import { createGeneratedPokemonInstance } from '../modules/trainers/pokemon/pokemon.repository';
import { fillMissingGeneralRating } from '../modules/trainers/management/trainer-management.repository';

const PEAK_RATING_LIMIT = 3600;
const EXCLUDED_REGION_NAME = 'Archenland';

const REGION_GENERATIONS: Readonly<Record<string, number>> = {
  kanto: 1,
  johto: 2,
  hoenn: 3,
  sinnoh: 4,
  unova: 5,
  kalos: 6,
  alola: 7,
  galar: 8,
};

interface ScriptOptions {
  databasePath: string;
  apply: boolean;
  limit: number | undefined;
}

interface TrainerTargetRow {
  trainer_id: number;
  fname: string | null;
  lname: string | null;
  region_name: string;
  birthdate: string;
  pwtr_rating: number;
  rating_id: number;
  overall_rating: number | null;
  typing_rating: number | null;
  mixed_rating: number | null;
  special_rating: number | null;
  game_date: string;
  pokemon_count: number;
  species_ids: string | null;
  levels: string | null;
}

interface GeneralRatingValues {
  overallRating: number;
  typingRating: number;
  mixedRating: number;
  specialRating: number;
}

interface PlannedPokemon {
  speciesId: number;
  pokemonId: number;
  name: string;
  level: number;
  isMega: boolean;
  isGigantamax: boolean;
  details: ReturnType<typeof generatePokemonDetails>;
}

interface TrainerPlan {
  trainer: TrainerTargetRow;
  rating: GeneralRatingValues;
  desiredRosterSize: number;
  pokemon: PlannedPokemon[];
}

function usage(): string {
  return [
    'Usage: npx ts-node src/bin/populate-character-trainers.ts --database <path> [--limit <count>] [--apply]',
    '',
    'Without --apply the script is read-only and prints the proposed changes.',
    '--apply fills only null general-rating dimensions and adds generated Pokémon; it never updates or removes existing Pokémon.',
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
  let apply = false;
  let limit: number | undefined;

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--database') {
      const path = argumentsList[index + 1];
      if (!path) {
        throw new Error('--database requires a path');
      }
      databasePath = path;
      index += 1;
    } else if (argument === '--limit') {
      const value = argumentsList[index + 1];
      if (!value) {
        throw new Error('--limit requires a value');
      }
      limit = parsePositiveInteger(value, '--limit');
      index += 1;
    } else if (argument === '--apply') {
      apply = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!databasePath) {
    throw new Error('--database is required');
  }

  return { databasePath: resolve(process.cwd(), databasePath), apply, limit };
}

function regionGeneration(regionName: string): number[] | undefined {
  const generation = REGION_GENERATIONS[regionName.toLowerCase()];
  return generation === undefined ? undefined : [generation];
}

function splitNumericValues(values: string | null): number[] {
  return values === null
    ? []
    : values.split(',').map((value) => Number(value)).filter((value) => Number.isInteger(value));
}

function gameYear(gameDate: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(gameDate)) {
    throw new Error(`Invalid saved game date: ${gameDate}`);
  }
  return Number(gameDate.slice(0, 4));
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

function toGeneralRatingValues(trainerId: number, pwtrRating: number, year: number): GeneralRatingValues {
  const generated = generateGeneralRatings(trainerId, pwtrRating, year);
  return {
    overallRating: generated.overall_rating,
    typingRating: generated.typing_rating,
    mixedRating: generated.mixed_rating,
    specialRating: generated.special_rating,
  };
}

async function findTargets(database: sqlite3.Database, limit: number | undefined): Promise<TrainerTargetRow[]> {
  const parameters: Array<number | string> = [PEAK_RATING_LIMIT, EXCLUDED_REGION_NAME];
  const limitClause = limit === undefined ? '' : 'LIMIT ?';
  if (limit !== undefined) {
    parameters.push(limit);
  }

  return queryAll<TrainerTargetRow>(
    database,
    `
      WITH
      current_game_date AS (
        SELECT gs."current_date" AS game_date
        FROM game_state AS gs
        ORDER BY gs.last_played_at DESC, gs.id DESC
        LIMIT 1
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
          GROUP_CONCAT(DISTINCT species_id) AS species_ids,
          GROUP_CONCAT(level) AS levels
        FROM pokemon
        GROUP BY trainer_id
      )
      SELECT
        trainer.id AS trainer_id,
        trainer.fname,
        trainer.lname,
        region.name AS region_name,
        trainer.birthdate,
        trainer.pwtr_rating,
        latest_ratings.id AS rating_id,
        latest_ratings.overall_rating,
        latest_ratings.typing_rating,
        latest_ratings.mixed_rating,
        latest_ratings.special_rating,
        current_game_date.game_date,
        COALESCE(pokemon_summaries.pokemon_count, 0) AS pokemon_count,
        pokemon_summaries.species_ids,
        pokemon_summaries.levels
      FROM trainer
      JOIN region ON trainer.region_id = region.id
      JOIN latest_ratings ON latest_ratings.trainer_id = trainer.id
      CROSS JOIN current_game_date
      LEFT JOIN hometown_summaries ON hometown_summaries.trainer_id = trainer.id
      LEFT JOIN pokemon_summaries ON pokemon_summaries.trainer_id = trainer.id
      WHERE trainer.peak_rating < ?
        AND region.name <> ?
        AND date(trainer.birthdate) IS NOT NULL
        AND date(current_game_date.game_date) IS NOT NULL
        AND COALESCE(hometown_summaries.hometown_count, 0) > 0
        AND trainer.active_status IS NOT NULL
        AND trainer.pwtr_rating IS NOT NULL
        AND trainer.peak_rank IS NOT NULL
        AND (
          latest_ratings.overall_rating IS NULL
          OR latest_ratings.typing_rating IS NULL
          OR latest_ratings.mixed_rating IS NULL
          OR latest_ratings.special_rating IS NULL
        )
      ORDER BY trainer.id
      ${limitClause}
    `,
    parameters
  );
}

function createPlan(target: TrainerTargetRow): TrainerPlan {
  const seed = JSON.stringify({
    version: 1,
    trainerId: target.trainer_id,
    gameDate: target.game_date,
    pwtrRating: target.pwtr_rating,
    overallRating: target.overall_rating,
    existingSpeciesIds: target.species_ids,
    existingLevels: target.levels,
  });

  return withDeterministicRandom(seed, () => {
    const rating = toGeneralRatingValues(target.trainer_id, target.pwtr_rating, gameYear(target.game_date));
    const overallRating = target.overall_rating ?? rating.overallRating;
    const desiredRosterSize = generatePokemonTeamSize();
    const pokemonToAdd = Math.max(0, desiredRosterSize - target.pokemon_count);
    const existingSpeciesIds = splitNumericValues(target.species_ids);
    const existingLevels = splitNumericValues(target.levels);
    const generations = regionGeneration(target.region_name);
    const generatedTeam = pokemonToAdd === 0
      ? []
      : generatePokemonTeam(
        overallRating,
        undefined,
        generations,
        undefined,
        {
          teamSize: pokemonToAdd,
          excludedSpeciesIds: existingSpeciesIds,
          uniqueSpecies: true,
          strictGenerationPreferences: generations !== undefined,
          defaultFormsOnly: generations !== undefined,
        }
      );
    const plannedRosterLevels = [...existingLevels, ...generatedTeam.map((pokemon) => pokemon.level)];

    return {
      trainer: target,
      rating,
      desiredRosterSize,
      pokemon: generatedTeam.map((pokemon) => ({
        speciesId: pokemon.species_id,
        pokemonId: pokemon.pokemon_id,
        name: pokemon.name,
        level: pokemon.level,
        isMega: pokemon.is_mega,
        isGigantamax: pokemon.is_gigantamax,
        details: generatePokemonDetails({
          trainerId: target.trainer_id,
          trainerFirstName: target.fname,
          trainerLastName: target.lname,
          trainerPwtrRating: target.pwtr_rating,
          trainerBirthdate: target.birthdate,
          speciesId: pokemon.species_id,
          pokemonId: pokemon.pokemon_id,
          level: pokemon.level,
          gameDate: target.game_date,
          rosterLevels: plannedRosterLevels,
        }),
      })),
    };
  });
}

async function applyPlans(database: sqlite3.Database, plans: TrainerPlan[]): Promise<void> {
  await runInTransaction(database, async () => {
    for (const plan of plans) {
      await fillMissingGeneralRating(database, plan.trainer.rating_id, plan.rating);
      for (const pokemon of plan.pokemon) {
        await createGeneratedPokemonInstance(database, {
          trainerId: plan.trainer.trainer_id,
          speciesId: pokemon.speciesId,
          pokemonId: pokemon.pokemonId,
          level: pokemon.level,
          isMega: pokemon.isMega,
          isGigantamax: pokemon.isGigantamax,
          details: pokemon.details,
        });
      }
    }
  });
}

function outputPlans(plans: TrainerPlan[], apply: boolean): void {
  const summary = plans.map((plan) => ({
    trainerId: plan.trainer.trainer_id,
    trainerName: [plan.trainer.fname, plan.trainer.lname].filter(Boolean).join(' ') || 'Unnamed Trainer',
    region: plan.trainer.region_name,
    existingPokemon: plan.trainer.pokemon_count,
    desiredRosterSize: plan.desiredRosterSize,
    pokemonToAdd: plan.pokemon.length,
    pokemon: plan.pokemon.map((pokemon) => `${pokemon.name} Lv. ${pokemon.level}`),
  }));
  const pokemonCreated = plans.reduce((sum, plan) => sum + plan.pokemon.length, 0);

  console.log(JSON.stringify({
    mode: apply ? 'applied' : 'dry-run',
    trainerCount: plans.length,
    pokemonCreated,
    criteria: {
      peakRatingBelow: PEAK_RATING_LIMIT,
      excludedRegion: EXCLUDED_REGION_NAME,
      onlyMissingGeneralData: 'incomplete general rating',
      regionalGenerationRule: 'Kanto through Galar use their matching generation; Alaken, Haypi, Tunod, and other unmapped regions use the general pool.',
    },
    trainers: summary,
  }, null, 2));
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const database = await openDatabase(
    options.databasePath,
    options.apply ? sqlite3.OPEN_READWRITE : sqlite3.OPEN_READONLY
  );

  try {
    const plans = (await findTargets(database, options.limit)).map(createPlan);
    if (options.apply) {
      await applyPlans(database, plans);
    }
    outputPlans(plans, options.apply);
  } finally {
    await closeDatabase(database);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  console.error(usage());
  process.exitCode = 1;
});
