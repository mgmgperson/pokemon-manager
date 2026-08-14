import sqlite3 from 'sqlite3';
import { runInTransaction } from '../../../infrastructure/database/sqlite';
import {
  findRatingIdForFormatRating,
  updateFormatRatings,
  updateOverallRating,
} from './trainer.repository';
import type { FormatRatingWriteInput } from './trainer.types';

export interface FormatRatingUpdateResult {
  changes: number;
  overallRating: number;
}

function calculateOverallRating(rating: FormatRatingWriteInput): number {
  const totalWeighted =
    5 * rating.singles_rating +
    5 * rating.sixes_rating +
    3.5 * rating.doubles_rating +
    2.5 * rating.tag_battle_rating +
    2.5 * rating.battle_factory_rating +
    2 * rating.rotation_rating +
    rating.threes_rating +
    rating.twos_rating;

  return Math.round(totalWeighted / 22.5);
}

export function updateFormatRatingsAndOverall(
  database: sqlite3.Database,
  rating: FormatRatingWriteInput
): Promise<FormatRatingUpdateResult> {
  return runInTransaction(database, async () => {
    await updateFormatRatings(database, rating);

    const ratingId = await findRatingIdForFormatRating(database, rating.id);
    if (ratingId === null) {
      throw new Error('Could not find rating_id');
    }

    const overallRating = calculateOverallRating(rating);
    const updateResult = await updateOverallRating(database, ratingId, overallRating);
    return { changes: updateResult.changes, overallRating };
  });
}
