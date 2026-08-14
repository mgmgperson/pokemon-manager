import sqlite3 from 'sqlite3';
import { runInTransaction } from '../../../infrastructure/database/sqlite';
import {
  createGymLeader,
  createStadium,
  deleteGymLeadersForCity,
  deleteStadiumsForCity,
  updateCity,
  type CityWriteInput,
  type GymLeaderWriteInput,
  type StadiumWriteInput,
} from './city.repository';

export interface CityUpdateInput extends CityWriteInput {
  stadiums?: StadiumWriteInput[];
  gymLeaders?: GymLeaderWriteInput[];
}

export class CityUpdateError extends Error {
  readonly leader: GymLeaderWriteInput;

  constructor(leader: GymLeaderWriteInput) {
    super(`Invalid trainer_id: ${leader.trainer_id} is not a number`);
    this.leader = leader;
  }
}

export function updateCityDetails(
  database: sqlite3.Database,
  cityId: string,
  city: CityUpdateInput
): Promise<void> {
  return runInTransaction(database, async () => {
    await updateCity(database, cityId, city);

    if (Array.isArray(city.stadiums)) {
      await deleteStadiumsForCity(database, cityId);
      for (const stadium of city.stadiums) {
        await createStadium(database, cityId, stadium);
      }
    }

    if (Array.isArray(city.gymLeaders)) {
      await deleteGymLeadersForCity(database, cityId);
      for (const leader of city.gymLeaders) {
        const trainerId = Number(leader.trainer_id);
        if (Number.isNaN(trainerId)) {
          throw new CityUpdateError(leader);
        }
        await createGymLeader(database, cityId, trainerId, leader);
      }
    }
  });
}
