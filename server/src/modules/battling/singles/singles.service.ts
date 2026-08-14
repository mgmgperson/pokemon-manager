import sqlite3 from 'sqlite3';
import { simulateSingles6v6Battle, type BattleResult } from '../../../engines/battling/singles-engine';
import { pickBest6PokemonForField } from '../../../engines/battling/team-picker';
import {
  findBattlePokemon,
  findBattleTrainer,
  findTrainerFieldRating,
} from './singles.repository';

function trainerName(trainerId: number, trainer: Awaited<ReturnType<typeof findBattleTrainer>>): string {
  return trainer ? `${trainer.fname} ${trainer.lname}` : `Trainer ${trainerId}`;
}

export async function runSingles6v6Battle(
  database: sqlite3.Database,
  fieldName: string,
  trainer1Id: number,
  trainer2Id: number
): Promise<BattleResult> {
  const [trainer1, trainer2, trainer1Pokemon, trainer2Pokemon, trainer1FieldRating, trainer2FieldRating] = await Promise.all([
    findBattleTrainer(database, trainer1Id),
    findBattleTrainer(database, trainer2Id),
    findBattlePokemon(database, trainer1Id),
    findBattlePokemon(database, trainer2Id),
    findTrainerFieldRating(database, trainer1Id, fieldName),
    findTrainerFieldRating(database, trainer2Id, fieldName),
  ]);

  return simulateSingles6v6Battle({
    trainer1Name: trainerName(trainer1Id, trainer1),
    trainer2Name: trainerName(trainer2Id, trainer2),
    trainer1Team: pickBest6PokemonForField(trainer1Pokemon, fieldName, trainer1FieldRating),
    trainer2Team: pickBest6PokemonForField(trainer2Pokemon, fieldName, trainer2FieldRating),
  });
}
