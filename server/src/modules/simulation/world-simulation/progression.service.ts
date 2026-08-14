import sqlite3 from 'sqlite3';
import { calculateEloChange } from '../../../engines/simulation/progression-engine';
import type { SimReport } from '../../../types/sim';
import { updateTrainerRating as updateTrainerRatingRecord } from './simulation.repository';

export { calculateEloChange };

export async function applyPostMatchProgression(
  _database: sqlite3.Database,
  matchIds: number[],
  report: SimReport
): Promise<void> {
  if (matchIds.length === 0) {
    return;
  }

  // TODO: Apply Elo changes and Pokemon match statistics after the tournament
  // model supplies the complete winner, loser, and roster context.
  report.notes.push(
    `NPCProgression: stub - would process ${matchIds.length} match(es) for rating changes`
  );
}

export async function applyPassiveProgression(
  _database: sqlite3.Database,
  _cursorTime: string,
  _report: SimReport
): Promise<void> {
  // TODO: Define passive trainer and Pokemon progression rules before adding
  // mutations here.
}

export function updateTrainerRating(
  database: sqlite3.Database,
  trainerId: number,
  ratingChange: number
): Promise<void> {
  return updateTrainerRatingRecord(database, trainerId, ratingChange);
}

export async function updatePokemonBattleStats(
  _database: sqlite3.Database,
  _pokemonIds: number[],
  _won: boolean
): Promise<void> {
  // TODO: Define battle-stat and experience effects with the tournament
  // simulation rules before persisting them.
}
