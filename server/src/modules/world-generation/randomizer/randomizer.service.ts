import sqlite3 from 'sqlite3';
import { generateFieldRatings } from '../../../generators/fieldRatingGenerator';
import { generateFormatRatingsFixed } from '../../../generators/formatRatingGenerator';
import { generateGeneralRatings } from '../../../generators/generalRatingGenerator';
import { generateName } from '../../../generators/nameGenerator';
import {
  convertPWTRToOverallRating,
  generatePokemonTeam,
} from '../../../generators/pokemonGenerator';
import { generatePokemonStats } from '../../../generators/pokemonSetGenerator';
import { generateRandomTrainer } from '../../../generators/trainerGenerator';
import { type Fields } from '../../../reference-data/enums/fields';
import { type Types } from '../../../reference-data/enums/types';
import {
  buildWeightCache,
  findLatestRatingForTrainer,
  findPokemonForFieldRatings,
  findTrainerForGeneration,
  regionExists,
} from './randomizer.repository';
import type { RatingForGeneration, TrainerForGeneration, WeightCache } from './randomizer.types';

const cacheByDatabase = new WeakMap<sqlite3.Database, WeightCache>();

export class GenerationLookupError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface GenerateTrainerOptions {
  regionId?: number;
  gender?: 'M' | 'F';
  age?: number;
  pwtrRating?: number;
}

export interface PokemonTeamOptions {
  overallRating: number;
  types?: Types[];
  generations?: number[];
  fields?: Fields[];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMentalRatings(overall: number, ratingId: number) {
  return {
    id: ratingId,
    rating_id: ratingId,
    planning_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
    risk_rating: randomInt(Math.max(0, overall - 15), Math.min(99, overall + 5)),
    prediction_rating: randomInt(Math.max(0, overall - 20), Math.min(99, overall + 20)),
    clutch_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 15)),
    consistency_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
    motivation_rating: randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15)),
    pokemon_knowledge_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
    trainer_knowledge_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
    training_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
    conditioning_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
    determination_rating: randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15)),
    facilities_rating: randomInt(Math.max(0, overall - 15), Math.min(99, overall + 20)),
    attack_rating: randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15)),
    defense_rating: randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15)),
    speed_rating: randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15)),
    gimmick_rating: randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15)),
  };
}

async function weightCacheFor(database: sqlite3.Database): Promise<WeightCache> {
  const cache = cacheByDatabase.get(database);
  if (cache) {
    return cache;
  }

  const newCache = await buildWeightCache(database);
  cacheByDatabase.set(database, newCache);
  return newCache;
}

async function trainerAndRating(
  database: sqlite3.Database,
  trainerId: string
): Promise<{ trainer: TrainerForGeneration; rating: RatingForGeneration }> {
  const trainer = await findTrainerForGeneration(database, trainerId);
  if (!trainer) {
    throw new GenerationLookupError(404, `No trainer found with ID ${trainerId}`);
  }

  const rating = await findLatestRatingForTrainer(database, trainerId);
  if (!rating) {
    throw new GenerationLookupError(404, `No rating record found for trainer ${trainerId}`);
  }

  return { trainer, rating };
}

export async function previewTrainer(
  database: sqlite3.Database,
  options: GenerateTrainerOptions
): Promise<unknown> {
  return generateRandomTrainer(
    database,
    options.regionId,
    options.gender,
    options.age,
    options.pwtrRating,
    await weightCacheFor(database)
  );
}

export async function previewMentalRatings(
  database: sqlite3.Database,
  trainerId: string
) {
  const { rating } = await trainerAndRating(database, trainerId);
  return generateMentalRatings(rating.overall_rating || 50, rating.id);
}

export async function previewFormatRatings(
  database: sqlite3.Database,
  trainerId: string
) {
  const { trainer, rating } = await trainerAndRating(database, trainerId);
  return generateFormatRatingsFixed(rating.overall_rating || 50, trainer.id, rating.id);
}

export async function previewGeneralRatings(
  database: sqlite3.Database,
  trainerId: string
): Promise<unknown> {
  const trainer = await findTrainerForGeneration(database, trainerId);
  if (!trainer) {
    throw new GenerationLookupError(404, `No trainer found with ID ${trainerId}`);
  }

  return generateGeneralRatings(trainer.id, trainer.pwtr_rating);
}

export async function previewName(
  database: sqlite3.Database,
  regionId: number,
  gender: 'M' | 'F'
): Promise<unknown> {
  if (!await regionExists(database, regionId)) {
    throw new GenerationLookupError(404, `No region found with ID ${regionId}`);
  }

  return generateName(database, regionId, gender);
}

export function previewPokemonTeam(options: PokemonTeamOptions) {
  const team = generatePokemonTeam(
    options.overallRating,
    options.types,
    options.generations,
    options.fields
  );
  return {
    team,
    team_size: team.length,
    overall_rating: options.overallRating,
  };
}

export async function previewFieldRatings(
  database: sqlite3.Database,
  trainerId: string
): Promise<Record<string, number>> {
  const { rating } = await trainerAndRating(database, trainerId);
  const pokemon = await findPokemonForFieldRatings(database, trainerId);
  if (pokemon.length === 0) {
    throw new GenerationLookupError(404, `No Pokemon found for trainer ${trainerId}`);
  }

  return generateFieldRatings(pokemon.map((pokemonInstance) => ({
    ...pokemonInstance,
    is_mega: pokemonInstance.is_mega ?? undefined,
    is_gigantamax: pokemonInstance.is_gigantamax ?? undefined,
  })), {
    overall: rating.overall_rating || 50,
    typing: rating.typing_rating || 50,
    mixed: rating.mixed_rating || 50,
    special: rating.special_rating || 50,
  });
}

export function previewPokemonStats(
  database: sqlite3.Database,
  trainerId: number,
  pokemonId: number
): Promise<unknown> {
  return generatePokemonStats(database, trainerId, pokemonId);
}

export function overallRatingFromPwtr(pwtrRating: number): number {
  return convertPWTRToOverallRating(pwtrRating);
}
