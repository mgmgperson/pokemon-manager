import { type Request, type Response } from 'express';
import { type Fields } from '../../../reference-data/enums/fields';
import { type Types } from '../../../reference-data/enums/types';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import {
  GenerationLookupError,
  overallRatingFromPwtr,
  previewFieldRatings,
  previewFormatRatings,
  previewGeneralRatings,
  previewMentalRatings,
  previewName,
  previewPokemonStats,
  previewPokemonTeam,
  previewTrainer,
} from './randomizer.service';

type QueryValue = string | string[] | undefined;

interface GenerateTrainerQuery {
  regionId?: QueryValue;
  gender?: QueryValue;
  age?: QueryValue;
  pwtr_rating?: QueryValue;
}

interface GeneratePokemonTeamQuery {
  overall_rating?: QueryValue;
  pwtr_rating?: QueryValue;
  types?: QueryValue;
  generations?: QueryValue;
  fields?: QueryValue;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function parseLegacyInteger(value: QueryValue): number {
  return Number.parseInt(Array.isArray(value) ? String(value) : value ?? '', 10);
}

function parseLegacyFloat(value: QueryValue): number {
  return Number.parseFloat(Array.isArray(value) ? String(value) : value ?? '');
}

function isPresent(value: QueryValue): boolean {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

function singleGender(value: QueryValue): 'M' | 'F' | undefined {
  return value === 'M' || value === 'F' ? value : undefined;
}

function preferenceValues(value: QueryValue): string[] | null {
  if (typeof value === 'string') {
    return value.split(',');
  }
  if (Array.isArray(value)) {
    return value;
  }
  return null;
}

function parsePreferences(
  value: QueryValue,
  minimum: number,
  maximum: number,
  label: string
): { values?: number[]; error?: string } {
  if (!isPresent(value)) {
    return {};
  }

  const rawValues = preferenceValues(value);
  if (!rawValues) {
    return { error: `Invalid ${label} format` };
  }

  const values = rawValues.map((rawValue) => Number.parseInt(rawValue.trim(), 10));
  if (values.some((item) => Number.isNaN(item) || item < minimum || item > maximum)) {
    return {
      error: `Invalid ${label.slice(0, -1)} value. ${label[0].toUpperCase()}${label.slice(1)} must be between ${minimum} and ${maximum}.`,
    };
  }

  return { values };
}

function sendGenerationError(response: Response, error: unknown, fallback: string): void {
  const status = error instanceof GenerationLookupError ? error.status : 500;
  response.status(status).json({ error: errorMessage(error, fallback) });
}

export async function generateTrainer(
  request: Request<Record<string, never>, unknown, unknown, GenerateTrainerQuery>,
  response: Response
): Promise<void> {
  const { regionId, gender, age, pwtr_rating: pwtrRating } = request.query;

  let parsedRegionId: number | undefined;
  if (isPresent(regionId)) {
    parsedRegionId = parseLegacyInteger(regionId);
    if (Number.isNaN(parsedRegionId)) {
      response.status(400).json({ error: 'regionId must be a number' });
      return;
    }
  }

  let parsedAge: number | undefined;
  if (isPresent(age)) {
    parsedAge = parseLegacyInteger(age);
    if (Number.isNaN(parsedAge)) {
      response.status(400).json({ error: 'age must be a number' });
      return;
    }
    if (parsedAge < 14 || parsedAge > 80) {
      response.status(400).json({ error: 'age must be between 14 and 80' });
      return;
    }
  }

  let parsedPwtrRating: number | undefined;
  if (isPresent(pwtrRating)) {
    parsedPwtrRating = parseLegacyFloat(pwtrRating);
    if (Number.isNaN(parsedPwtrRating)) {
      response.status(400).json({ error: 'pwtr_rating must be a number' });
      return;
    }
    if (parsedPwtrRating < 1000 || parsedPwtrRating > 4500) {
      response.status(400).json({ error: 'pwtr_rating must be between 1000 and 4500' });
      return;
    }
  }

  if (isPresent(gender) && !singleGender(gender)) {
    response.status(400).json({ error: 'gender must be either M or F' });
    return;
  }

  try {
    response.json(await previewTrainer(getActiveDB(), {
      regionId: parsedRegionId,
      gender: singleGender(gender),
      age: parsedAge,
      pwtrRating: parsedPwtrRating,
    }));
  } catch (error) {
    console.error('Error generating trainer:', error);
    sendGenerationError(response, error, 'Failed to generate trainer');
  }
}

export async function generateMentalRatingPreview(
  request: Request<{ trainerId: string }>,
  response: Response
): Promise<void> {
  try {
    response.json(await previewMentalRatings(getActiveDB(), request.params.trainerId));
  } catch (error) {
    if (error instanceof GenerationLookupError) {
      response.status(error.status).json({ error: error.message });
      return;
    }
    response.status(400).json({ error: errorMessage(error, 'Failed to generate mental ratings') });
  }
}

export async function generateFormatRatingPreview(
  request: Request<{ trainerId: string }>,
  response: Response
): Promise<void> {
  try {
    response.json(await previewFormatRatings(getActiveDB(), request.params.trainerId));
  } catch (error) {
    if (error instanceof GenerationLookupError) {
      response.status(error.status).json({ error: error.message });
      return;
    }
    response.status(400).json({ error: errorMessage(error, 'Failed to generate format ratings') });
  }
}

export async function generateGeneralRatingPreview(
  request: Request<{ trainerId: string }>,
  response: Response
): Promise<void> {
  try {
    response.json(await previewGeneralRatings(getActiveDB(), request.params.trainerId));
  } catch (error) {
    if (error instanceof GenerationLookupError) {
      response.status(error.status).json({ error: error.message });
      return;
    }
    response.status(400).json({ error: errorMessage(error, 'Failed to generate general ratings') });
  }
}

export async function generateNamePreview(
  request: Request<Record<string, never>, unknown, unknown, { regionId?: QueryValue; gender?: QueryValue }>,
  response: Response
): Promise<void> {
  const { regionId, gender } = request.query;
  if (!isPresent(regionId) || !isPresent(gender)) {
    response.status(400).json({ error: 'Both regionId and gender are required' });
    return;
  }

  const parsedGender = singleGender(gender);
  if (!parsedGender) {
    response.status(400).json({ error: 'Gender must be either M or F' });
    return;
  }

  const parsedRegionId = parseLegacyInteger(regionId);
  if (Number.isNaN(parsedRegionId)) {
    response.status(400).json({ error: 'regionId must be a number' });
    return;
  }

  try {
    response.json(await previewName(getActiveDB(), parsedRegionId, parsedGender));
  } catch (error) {
    if (error instanceof GenerationLookupError) {
      response.status(error.status).json({ error: error.message });
      return;
    }
    console.error('Error generating name:', error);
    sendGenerationError(response, error, 'Failed to generate name');
  }
}

export function generatePokemonTeamPreview(
  request: Request<Record<string, never>, unknown, unknown, GeneratePokemonTeamQuery>,
  response: Response
): void {
  const { overall_rating: overallRating, pwtr_rating: pwtrRating } = request.query;

  let parsedOverallRating: number;
  if (isPresent(overallRating)) {
    parsedOverallRating = parseLegacyInteger(overallRating);
    if (Number.isNaN(parsedOverallRating) || parsedOverallRating < 0 || parsedOverallRating > 99) {
      response.status(400).json({ error: 'overall_rating must be a number between 0 and 99' });
      return;
    }
  } else if (isPresent(pwtrRating)) {
    const parsedPwtrRating = parseLegacyFloat(pwtrRating);
    if (Number.isNaN(parsedPwtrRating) || parsedPwtrRating < 1000 || parsedPwtrRating > 4500) {
      response.status(400).json({ error: 'pwtr_rating must be a number between 1000 and 4500' });
      return;
    }
    parsedOverallRating = overallRatingFromPwtr(parsedPwtrRating);
  } else {
    response.status(400).json({ error: 'Either overall_rating or pwtr_rating must be provided' });
    return;
  }

  const typePreferences = parsePreferences(request.query.types, 1, 19, 'types');
  if (typePreferences.error) {
    response.status(400).json({ error: typePreferences.error });
    return;
  }

  const generationPreferences = parsePreferences(request.query.generations, 1, 9, 'generations');
  if (generationPreferences.error) {
    response.status(400).json({ error: generationPreferences.error });
    return;
  }

  const fieldPreferences = parsePreferences(request.query.fields, 1, 50, 'fields');
  if (fieldPreferences.error) {
    response.status(400).json({ error: fieldPreferences.error });
    return;
  }

  try {
    response.json(previewPokemonTeam({
      overallRating: parsedOverallRating,
      types: typePreferences.values as Types[] | undefined,
      generations: generationPreferences.values,
      fields: fieldPreferences.values as Fields[] | undefined,
    }));
  } catch (error) {
    console.error('Error generating Pokémon team:', error);
    sendGenerationError(response, error, 'Failed to generate Pokémon team');
  }
}

export async function generateFieldRatingPreview(
  request: Request<{ trainerId: string }>,
  response: Response
): Promise<void> {
  try {
    response.json(await previewFieldRatings(getActiveDB(), request.params.trainerId));
  } catch (error) {
    if (error instanceof GenerationLookupError) {
      response.status(error.status).json({ error: error.message });
      return;
    }
    response.status(400).json({ error: errorMessage(error, 'Failed to generate field ratings') });
  }
}

export async function generatePokemonStatsPreview(
  request: Request<{ trainerId: string; pokemonId: string }>,
  response: Response
): Promise<void> {
  const trainerId = Number.parseInt(request.params.trainerId, 10);
  const pokemonId = Number.parseInt(request.params.pokemonId, 10);
  if (Number.isNaN(trainerId) || Number.isNaN(pokemonId)) {
    response.status(400).json({ error: 'Invalid trainerId or pokemonId' });
    return;
  }

  try {
    response.json(await previewPokemonStats(getActiveDB(), trainerId, pokemonId));
  } catch (error) {
    console.error('Error generating Pokemon stats:', error);
    response.status(500).json({ error: errorMessage(error, 'Failed to generate Pokemon stats') });
  }
}
