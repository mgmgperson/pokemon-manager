import sqlite3 from 'sqlite3';
import { runStatement } from '../../../infrastructure/database/sqlite';
import { FIELD_RATING_COLUMNS, FORMAT_RATING_COLUMNS, MENTAL_RATING_COLUMNS } from '../trainer/trainer.types';
import type { PopulationTrainerProposal } from './trainer-population-proposal.types';

export async function createPopulationRatingFamilies(
  database: sqlite3.Database,
  ratingId: number,
  trainer: PopulationTrainerProposal
): Promise<void> {
  const families = [
    { table: 'format_rating', columns: FORMAT_RATING_COLUMNS, values: trainer.formatRatings },
    { table: 'mental_rating', columns: MENTAL_RATING_COLUMNS, values: trainer.mentalRatings },
    { table: 'field_rating', columns: FIELD_RATING_COLUMNS, values: trainer.fieldRatings },
  ] as const;
  for (const family of families) {
    const values = family.values as Record<string, number>;
    await runStatement(database,
      `INSERT INTO ${family.table} (rating_id, ${family.columns.join(', ')}) VALUES (?, ${family.columns.map(() => '?').join(', ')})`,
      [ratingId, ...family.columns.map((column) => values[column])]);
  }
}
