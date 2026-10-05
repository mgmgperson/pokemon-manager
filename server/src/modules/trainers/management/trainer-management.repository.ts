import sqlite3 from 'sqlite3';
import { queryAll, queryOne, runStatement, type StatementResult } from '../../../infrastructure/database/sqlite';
import type {
  GeneralRatingProposal,
  NewTrainerProfileProposal,
  ProfileProposal,
} from './trainer-management.types';

export interface ManagementTrainerState {
  trainer: {
    id: number;
    fname: string | null;
    lname: string | null;
    region_id: number | null;
    birthdate: string | null;
    pwtr_rating: number | null;
    peak_rating: number | null;
    peak_rank: number | null;
    active_status: boolean | number | null;
  };
  hometownCityIds: number[];
  rating: {
    id: number;
    overall_rating: number | null;
    typing_rating: number | null;
    mixed_rating: number | null;
    special_rating: number | null;
  } | null;
  gameDate: string | null;
  existingPokemonCount: number;
  existingPokemonSpeciesIds: number[];
  existingPokemonLevels: number[];
}

export interface ManagementCity {
  id: number;
  name: string;
  region_id: number;
}

export async function findManagementTrainerState(
  database: sqlite3.Database,
  trainerId: number
): Promise<ManagementTrainerState | null> {
  const trainer = await queryOne<ManagementTrainerState['trainer']>(
    database,
    `
      SELECT id, fname, lname, region_id, birthdate, pwtr_rating, peak_rating, peak_rank, active_status
      FROM trainer
      WHERE id = ?
    `,
    [trainerId]
  );

  if (!trainer) {
    return null;
  }

  const [hometowns, rating, gameState, pokemon] = await Promise.all([
    queryAll<{ city_id: number }>(
      database,
      'SELECT city_id FROM trainer_hometown WHERE trainer_id = ? ORDER BY city_id',
      [trainerId]
    ),
    queryOne<ManagementTrainerState['rating']>(
      database,
      `
        SELECT id, overall_rating, typing_rating, mixed_rating, special_rating
        FROM rating
        WHERE trainer_id = ?
        ORDER BY year DESC, id DESC
        LIMIT 1
      `,
      [trainerId]
    ),
    queryOne<{ current_date: string | null }>(
      database,
      'SELECT "current_date" AS current_date FROM game_state ORDER BY last_played_at DESC, id DESC LIMIT 1'
    ),
    queryOne<{ pokemon_count: number; species_ids: string | null; levels: string | null }>(
      database,
      `
        SELECT
          COUNT(*) AS pokemon_count,
          GROUP_CONCAT(DISTINCT species_id) AS species_ids,
          GROUP_CONCAT(level) AS levels
        FROM pokemon
        WHERE trainer_id = ?
      `,
      [trainerId]
    ),
  ]);

  return {
    trainer,
    hometownCityIds: hometowns.map((hometown) => hometown.city_id),
    rating,
    gameDate: gameState?.current_date ?? null,
    existingPokemonCount: pokemon?.pokemon_count ?? 0,
    existingPokemonSpeciesIds: pokemon?.species_ids
      ? pokemon.species_ids.split(',').map((speciesId) => Number(speciesId))
      : [],
    existingPokemonLevels: pokemon?.levels
      ? pokemon.levels.split(',').map((level) => Number(level)).filter((level) => Number.isInteger(level))
      : [],
  };
}

export function findManagementCity(
  database: sqlite3.Database,
  cityId: number
): Promise<ManagementCity | null> {
  return queryOne<ManagementCity>(
    database,
    'SELECT id, name, region_id FROM city WHERE id = ?',
    [cityId]
  );
}

export async function findManagementGameDate(database: sqlite3.Database): Promise<string | null> {
  const gameState = await queryOne<{ current_date: string | null }>(
    database,
    'SELECT "current_date" AS current_date FROM game_state ORDER BY last_played_at DESC, id DESC LIMIT 1'
  );
  return gameState?.current_date ?? null;
}

export function regionExists(database: sqlite3.Database, regionId: number): Promise<boolean> {
  return queryOne<{ id: number }>(database, 'SELECT id FROM region WHERE id = ?', [regionId])
    .then((region) => region !== null);
}

export function updateTrainerProfile(
  database: sqlite3.Database,
  trainerId: number,
  profile: ProfileProposal
): Promise<StatementResult> {
  const assignments: string[] = [];
  const values: Array<number | string | boolean> = [];

  if (profile.regionId !== undefined) {
    assignments.push('region_id = ?');
    values.push(profile.regionId);
  }
  if (profile.birthdate !== undefined) {
    assignments.push('birthdate = ?');
    values.push(profile.birthdate);
  }
  if (profile.pwtrRating !== undefined) {
    assignments.push('pwtr_rating = ?');
    values.push(profile.pwtrRating);
  }
  if (profile.peakRating !== undefined) {
    assignments.push('peak_rating = ?');
    values.push(profile.peakRating);
  }
  if (profile.peakRank !== undefined) {
    assignments.push('peak_rank = ?');
    values.push(profile.peakRank);
  }
  if (profile.activeStatus !== undefined) {
    assignments.push('active_status = ?');
    values.push(profile.activeStatus);
  }

  if (assignments.length === 0) {
    return Promise.resolve({ changes: 0, lastInsertId: 0 });
  }

  return runStatement(
    database,
    `UPDATE trainer SET ${assignments.join(', ')} WHERE id = ?`,
    [...values, trainerId]
  );
}

export function addTrainerHometown(
  database: sqlite3.Database,
  trainerId: number,
  cityId: number
): Promise<StatementResult> {
  return runStatement(
    database,
    `
      INSERT INTO trainer_hometown (trainer_id, city_id)
      SELECT ?, ?
      WHERE NOT EXISTS (
        SELECT 1
        FROM trainer_hometown
        WHERE trainer_id = ? AND city_id = ?
      )
    `,
    [trainerId, cityId, trainerId, cityId]
  );
}

export function createManagementTrainer(
  database: sqlite3.Database,
  profile: NewTrainerProfileProposal
): Promise<StatementResult> {
  return runStatement(
    database,
    `
      INSERT INTO trainer (
        fname, lname, region_id, birthdate, pwtr_rating, peak_rating, peak_rank, active_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      profile.fname,
      profile.lname,
      profile.regionId,
      profile.birthdate,
      profile.pwtrRating,
      profile.peakRating,
      profile.peakRank,
      profile.activeStatus,
    ]
  );
}

export function createGeneralRating(
  database: sqlite3.Database,
  trainerId: number,
  year: number,
  rating: GeneralRatingProposal
): Promise<StatementResult> {
  return runStatement(
    database,
    `
      INSERT INTO rating (
        trainer_id, year, overall_rating, typing_rating, mixed_rating, special_rating
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      trainerId,
      year,
      rating.overallRating,
      rating.typingRating,
      rating.mixedRating,
      rating.specialRating,
    ]
  );
}

export function fillMissingGeneralRating(
  database: sqlite3.Database,
  ratingId: number,
  rating: GeneralRatingProposal
): Promise<StatementResult> {
  return runStatement(
    database,
    `
      UPDATE rating
      SET
        overall_rating = COALESCE(overall_rating, ?),
        typing_rating = COALESCE(typing_rating, ?),
        mixed_rating = COALESCE(mixed_rating, ?),
        special_rating = COALESCE(special_rating, ?)
      WHERE id = ?
    `,
    [
      rating.overallRating,
      rating.typingRating,
      rating.mixedRating,
      rating.specialRating,
      ratingId,
    ]
  );
}
