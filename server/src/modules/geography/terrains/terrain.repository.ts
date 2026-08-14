import sqlite3 from 'sqlite3';
import { queryAll, queryOne } from '../../../infrastructure/database/sqlite';

interface TerrainRow {
  id: number;
  code: string;
  name: string;
  description: string | null;
  default_field_id: number | null;
}

export interface Terrain {
  id: number;
  code: string;
  name: string;
  description: string | null;
  defaultFieldId: number | null;
}

const TERRAIN_COLUMNS = `
  t.id,
  t.code,
  t.name,
  t.description,
  t.default_field_id
`;

function mapTerrain(row: TerrainRow): Terrain {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    defaultFieldId: row.default_field_id,
  };
}

export async function findAllTerrains(database: sqlite3.Database): Promise<Terrain[]> {
  const rows = await queryAll<TerrainRow>(
    database,
    `
      SELECT ${TERRAIN_COLUMNS}
      FROM terrain t
      ORDER BY t.name
    `,
    []
  );

  return rows.map(mapTerrain);
}

export async function findTerrainById(
  database: sqlite3.Database,
  terrainId: number
): Promise<Terrain | null> {
  const row = await queryOne<TerrainRow>(
    database,
    `
      SELECT ${TERRAIN_COLUMNS}
      FROM terrain t
      WHERE t.id = ?
    `,
    [terrainId]
  );

  return row ? mapTerrain(row) : null;
}
