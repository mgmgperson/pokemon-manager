import sqlite3 from 'sqlite3';
import { queryAll, queryOne } from '../../../infrastructure/database/sqlite';

interface GrandChampionRow {
  id: number;
  fname: string | null;
  lname: string | null;
}

interface RegionalChampionRow extends GrandChampionRow {
  region_id: number;
  region_name: string;
}

export interface LeagueOverview {
  grandChampion: { id: number; name: string } | null;
  champions: Array<{ region: string; region_id: number; id: number; name: string }>;
  eliteFour: Array<{
    region: string;
    region_id: number;
    eliteFour: Array<{ id: number; name: string }>;
  }>;
}

function trainerName(trainer: GrandChampionRow): string {
  return `${trainer.fname} ${trainer.lname}`;
}

export async function findLeagueOverview(database: sqlite3.Database): Promise<LeagueOverview> {
  const [grandChampionRow, championRows, eliteFourRows] = await Promise.all([
    queryOne<GrandChampionRow>(
      database,
      `
        SELECT t.id, t.fname, t.lname
        FROM grand_champion gc
        JOIN trainer t ON gc.trainer_id = t.id
      `
    ),
    queryAll<RegionalChampionRow>(
      database,
      `
        SELECT t.id, r.id AS region_id, r.name AS region_name, t.fname, t.lname
        FROM champion ch
        JOIN trainer t ON ch.trainer_id = t.id
        JOIN region r ON ch.region_id = r.id
      `
    ),
    queryAll<RegionalChampionRow>(
      database,
      `
        SELECT t.id, r.id AS region_id, r.name AS region_name, t.fname, t.lname
        FROM elite_four ef
        JOIN trainer t ON ef.trainer_id = t.id
        JOIN region r ON ef.region_id = r.id
      `
    ),
  ]);
  const eliteFourByRegion = new Map<
    string,
    { region_id: number; members: Array<{ id: number; name: string }> }
  >();

  for (const row of eliteFourRows) {
    const currentRegion = eliteFourByRegion.get(row.region_name) ?? {
      region_id: row.region_id,
      members: [],
    };
    currentRegion.members.push({ id: row.id, name: trainerName(row) });
    eliteFourByRegion.set(row.region_name, currentRegion);
  }

  return {
    grandChampion: grandChampionRow
      ? { id: grandChampionRow.id, name: trainerName(grandChampionRow) }
      : null,
    champions: championRows.map((row) => ({
      region: row.region_name,
      region_id: row.region_id,
      id: row.id,
      name: trainerName(row),
    })),
    eliteFour: Array.from(eliteFourByRegion, ([region, value]) => ({
      region,
      region_id: value.region_id,
      eliteFour: value.members,
    })),
  };
}
