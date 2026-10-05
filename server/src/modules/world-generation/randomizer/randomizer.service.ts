import sqlite3 from 'sqlite3';
import { generateFieldRatings } from '../../../generators/fieldRatingGenerator';
import { generateFormatRatingsFixed } from '../../../generators/formatRatingGenerator';
import {
  generateGeneralRatings,
  type GeneratedGeneralRatings,
} from '../../../generators/generalRatingGenerator';
import { generateName, type NameResult } from '../../../generators/nameGenerator';
import { generateMentalRatings } from '../../../generators/mentalRatingGenerator';
import {
  convertPWTRToOverallRating,
  generatePokemonTeam,
} from '../../../generators/pokemonGenerator';
import { generatePokemonStats } from '../../../generators/pokemonSetGenerator';
import {
  generateRandomTrainer,
  type GenerateTrainerResult,
} from '../../../generators/trainerGenerator';
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
): Promise<GenerateTrainerResult> {
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
  return {
    id: rating.id,
    rating_id: rating.id,
    ...generateMentalRatings(rating.overall_rating || 50),
  };
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
): Promise<GeneratedGeneralRatings> {
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
): Promise<NameResult> {
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
