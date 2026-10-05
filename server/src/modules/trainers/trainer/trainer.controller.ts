import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import {
  createTrainer,
  findInactiveTrainers,
  findTrainerRatingLeaderboardPage,
  findTrainerOptions,
  findTrainerPage,
  findPokemonForTrainer,
  findTrainerDetail,
  updateFieldRatings,
  updateMentalRatings,
  updateTrainer,
} from './trainer.repository';
import { updateFormatRatingsAndOverall } from './trainer.service';
import {
  TRAINER_MISSING_DATA_FILTERS,
  TRAINER_RATING_LEADERBOARD_SORT_FIELDS,
  TRAINER_RATING_METRIC_OPTIONS,
  TRAINER_RATING_METRICS,
  TRAINER_SORT_FIELDS,
  TRAINER_STATUS_FILTERS,
  TRAINER_TITLE_FILTERS,
} from './trainer.types';
import type {
  FieldRatingWriteInput,
  FormatRatingWriteInput,
  MentalRatingWriteInput,
  SortOrder,
  TrainerListInput,
  TrainerMissingDataFilter,
  TrainerOptionsInput,
  TrainerRatingLeaderboardInput,
  TrainerRatingLeaderboardSortField,
  TrainerRatingMetric,
  TrainerSortField,
  TrainerStatusFilter,
  TrainerTitleFilter,
  TrainerWriteInput,
} from './trainer.types';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const MAX_SEARCH_LENGTH = 100;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function sendDatabaseError(response: Response, error: unknown): void {
  response.status(400).json({ error: errorMessage(error) });
}

function readSingleQueryValue(query: Request['query'], name: string): string | undefined {
  const value = query[name];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error(`${name} must be provided once`);
  }

  return value;
}

function parsePositiveInteger(value: string | undefined, name: string, fallback?: number): number {
  if (value === undefined) {
    if (fallback === undefined) {
      throw new Error(`${name} is required`);
    }
    return fallback;
  }

  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error(`${name} must be a positive integer`);
  }

  const parsedValue = Number(value);
  if (!Number.isSafeInteger(parsedValue)) {
    throw new Error(`${name} is too large`);
  }

  return parsedValue;
}

function parseOptionalSearch(query: Request['query']): string | undefined {
  const value = readSingleQueryValue(query, 'search');
  if (value === undefined) {
    return undefined;
  }

  const search = value.trim();
  if (search.length > MAX_SEARCH_LENGTH) {
    throw new Error(`search must be ${MAX_SEARCH_LENGTH} characters or fewer`);
  }

  return search || undefined;
}

function parseFilter<T extends string>(
  query: Request['query'],
  name: string,
  allowedValues: readonly T[],
  fallback: T
): T {
  const value = readSingleQueryValue(query, name);
  if (value === undefined) {
    return fallback;
  }

  if (!(allowedValues as readonly string[]).includes(value)) {
    throw new Error(`${name} is invalid`);
  }

  return value as T;
}

function parseMissingDataFilters(query: Request['query']): TrainerMissingDataFilter[] {
  const value = readSingleQueryValue(query, 'missing');
  if (value === undefined || value === '') {
    return [];
  }

  const filters = value.split(',');
  if (filters.some((filter) => !TRAINER_MISSING_DATA_FILTERS.includes(filter as TrainerMissingDataFilter))) {
    throw new Error('missing contains an invalid filter');
  }

  return [...new Set(filters)] as TrainerMissingDataFilter[];
}

function parseTrainerListInput(query: Request['query']): TrainerListInput {
  const page = parsePositiveInteger(readSingleQueryValue(query, 'page'), 'page', 1);
  const pageSize = parsePositiveInteger(
    readSingleQueryValue(query, 'pageSize'),
    'pageSize',
    DEFAULT_PAGE_SIZE
  );
  if (pageSize > MAX_PAGE_SIZE) {
    throw new Error(`pageSize must not exceed ${MAX_PAGE_SIZE}`);
  }
  if (page > Math.floor(Number.MAX_SAFE_INTEGER / pageSize)) {
    throw new Error('page is too large');
  }

  const sortBy = parseFilter<TrainerSortField>(
    query,
    'sortBy',
    TRAINER_SORT_FIELDS,
    'rank'
  );
  const sortOrder = parseFilter<SortOrder>(
    query,
    'sortOrder',
    ['asc', 'desc'],
    sortBy === 'rank' || sortBy === 'name' ? 'asc' : 'desc'
  );

  return {
    page,
    pageSize,
    search: parseOptionalSearch(query),
    regionId: (() => {
      const value = readSingleQueryValue(query, 'regionId');
      return value === undefined ? undefined : parsePositiveInteger(value, 'regionId');
    })(),
    hometownCityId: (() => {
      const value = readSingleQueryValue(query, 'hometownCityId');
      return value === undefined ? undefined : parsePositiveInteger(value, 'hometownCityId');
    })(),
    title: parseFilter<TrainerTitleFilter>(query, 'title', TRAINER_TITLE_FILTERS, 'all'),
    status: parseFilter<TrainerStatusFilter>(query, 'status', TRAINER_STATUS_FILTERS, 'all'),
    sortBy,
    sortOrder,
    missing: parseMissingDataFilters(query),
  };
}

function parseTrainerRatingLeaderboardInput(
  query: Request['query']
): TrainerRatingLeaderboardInput {
  const page = parsePositiveInteger(readSingleQueryValue(query, 'page'), 'page', 1);
  const pageSize = parsePositiveInteger(
    readSingleQueryValue(query, 'pageSize'),
    'pageSize',
    DEFAULT_PAGE_SIZE
  );
  if (pageSize > MAX_PAGE_SIZE) {
    throw new Error(`pageSize must not exceed ${MAX_PAGE_SIZE}`);
  }
  if (page > Math.floor(Number.MAX_SAFE_INTEGER / pageSize)) {
    throw new Error('page is too large');
  }

  const sortBy = parseFilter<TrainerRatingLeaderboardSortField>(
    query,
    'sortBy',
    TRAINER_RATING_LEADERBOARD_SORT_FIELDS,
    'metric'
  );

  return {
    page,
    pageSize,
    metric: parseFilter<TrainerRatingMetric>(
      query,
      'metric',
      TRAINER_RATING_METRICS,
      'overall_rating'
    ),
    sortBy,
    sortOrder: parseFilter<SortOrder>(
      query,
      'sortOrder',
      ['asc', 'desc'],
      sortBy === 'rank' || sortBy === 'name' ? 'asc' : 'desc'
    ),
  };
}

function parseTrainerOptionsInput(query: Request['query']): TrainerOptionsInput {
  const idsValue = readSingleQueryValue(query, 'ids');
  const ids = idsValue
    ? idsValue.split(',').map((value) => parsePositiveInteger(value, 'ids'))
    : [];

  if (ids.length > 100) {
    throw new Error('ids must contain at most 100 trainer IDs');
  }

  return { search: parseOptionalSearch(query), ids };
}

export async function listTrainers(request: Request, response: Response): Promise<void> {
  try {
    const input = parseTrainerListInput(request.query);
    const trainerPage = await findTrainerPage(getActiveDB(), input);
    response.json({
      message: 'success',
      data: trainerPage.trainers,
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        totalItems: trainerPage.totalItems,
        totalPages: Math.ceil(trainerPage.totalItems / input.pageSize),
      },
    });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}

export async function listTrainerRatingLeaderboard(
  request: Request,
  response: Response
): Promise<void> {
  try {
    const input = parseTrainerRatingLeaderboardInput(request.query);
    const leaderboard = await findTrainerRatingLeaderboardPage(getActiveDB(), input);
    response.json({
      message: 'success',
      data: leaderboard.trainers,
      metric: input.metric,
      metrics: TRAINER_RATING_METRIC_OPTIONS,
      pagination: {
        page: input.page,
        pageSize: input.pageSize,
        totalItems: leaderboard.totalItems,
        totalPages: Math.ceil(leaderboard.totalItems / input.pageSize),
      },
    });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}

export async function listTrainerOptions(request: Request, response: Response): Promise<void> {
  try {
    response.json({
      message: 'success',
      data: await findTrainerOptions(getActiveDB(), parseTrainerOptionsInput(request.query)),
    });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}

export async function listInactiveTrainers(_request: Request, response: Response): Promise<void> {
  try {
    response.json({ message: 'success', data: await findInactiveTrainers(getActiveDB()) });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}

export async function getTrainer(
  request: Request<{ id: string }>,
  response: Response
): Promise<void> {
  try {
    const trainer = await findTrainerDetail(getActiveDB(), request.params.id);
    if (!trainer) {
      response.status(404).json({ error: 'Trainer not found' });
      return;
    }

    response.json({ message: 'success', data: trainer });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}

export async function listTrainerPokemon(
  request: Request<{ id: string }>,
  response: Response
): Promise<void> {
  try {
    response.json({
      message: 'success',
      data: await findPokemonForTrainer(getActiveDB(), request.params.id),
    });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}

export async function createTrainerController(
  request: Request<Record<string, never>, unknown, TrainerWriteInput>,
  response: Response
): Promise<void> {
  try {
    const statement = await createTrainer(getActiveDB(), request.body);
    response.json({
      message: 'success',
      data: { id: statement.lastInsertId, ...request.body },
    });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}

export async function updateTrainerController(
  request: Request<{ id: string }, unknown, TrainerWriteInput>,
  response: Response
): Promise<void> {
  try {
    const statement = await updateTrainer(getActiveDB(), request.params.id, request.body);
    response.json({
      message: 'success',
      data: { id: request.params.id, ...request.body },
      changes: statement.changes,
    });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}

export async function updateFieldRatingsController(
  request: Request<{ id: string }, unknown, FieldRatingWriteInput>,
  response: Response
): Promise<void> {
  try {
    const statement = await updateFieldRatings(getActiveDB(), request.body);
    response.json({
      message: 'success',
      data: request.body,
      changes: statement.changes,
    });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}

export async function updateMentalRatingsController(
  request: Request<{ id: string }, unknown, MentalRatingWriteInput>,
  response: Response
): Promise<void> {
  try {
    const statement = await updateMentalRatings(getActiveDB(), request.body);
    response.json({
      message: 'success',
      data: request.body,
      changes: statement.changes,
    });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}

export async function updateFormatRatingsController(
  request: Request<{ id: string }, unknown, FormatRatingWriteInput>,
  response: Response
): Promise<void> {
  try {
    const updateResult = await updateFormatRatingsAndOverall(getActiveDB(), request.body);
    response.json({
      message: 'success',
      data: request.body,
      overall_rating: updateResult.overallRating,
      changes: updateResult.changes,
    });
  } catch (error) {
    sendDatabaseError(response, error);
  }
}
