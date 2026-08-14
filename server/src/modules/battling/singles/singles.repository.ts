import sqlite3 from 'sqlite3';
import { queryAll, queryOne } from '../../../infrastructure/database/sqlite';
import { fieldIdForName } from '../../../engines/battling/team-picker';
import type { PokemonRow, TrainerRow } from '../../../types/database';

interface FieldRatingRow {
  rating_value: number | null;
}

function fieldRatingColumn(fieldName: string): string | null {
  if (fieldIdForName(fieldName) === null) {
    return null;
  }

  return `${fieldName.toLowerCase().replace(/_/g, '')}_field_rating`;
}

export function findBattleTrainer(
  database: sqlite3.Database,
  trainerId: number
): Promise<TrainerRow | null> {
  return queryOne<TrainerRow>(database, 'SELECT * FROM trainer WHERE id = ?', [trainerId]);
}

export function findBattlePokemon(
  database: sqlite3.Database,
  trainerId: number
): Promise<PokemonRow[]> {
  return queryAll<PokemonRow>(database, 'SELECT * FROM pokemon WHERE trainer_id = ?', [trainerId]);
}

export async function findTrainerFieldRating(
  database: sqlite3.Database,
  trainerId: number,
  fieldName: string
): Promise<number> {
  const column = fieldRatingColumn(fieldName);
  if (!column) {
    throw new Error(`Unsupported battle field: ${fieldName}`);
  }

  const rating = await queryOne<FieldRatingRow>(
    database,
    `
      SELECT fr.${column} AS rating_value
      FROM field_rating fr
      JOIN rating r ON fr.rating_id = r.id
      WHERE r.trainer_id = ?
      ORDER BY r.year DESC
      LIMIT 1
    `,
    [trainerId]
  );
  return rating?.rating_value || 0;
}
