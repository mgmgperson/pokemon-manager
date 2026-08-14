import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import { runSingles6v6Battle } from './singles.service';

interface SinglesQuery {
  field?: string | string[];
  trainer1?: string | string[];
  trainer2?: string | string[];
}

export async function runSinglesBattle(
  request: Request<Record<string, never>, unknown, unknown, SinglesQuery>,
  response: Response
): Promise<void> {
  const { field, trainer1, trainer2 } = request.query;
  if (!field || !trainer1 || !trainer2) {
    response.status(400).json({
      error: 'Missing query parameters. Usage: ?field=WINDY&trainer1=1&trainer2=2',
    });
    return;
  }

  const fieldName = String(field);
  const trainer1Id = parseInt(String(trainer1), 10);
  const trainer2Id = parseInt(String(trainer2), 10);
  if (Number.isNaN(trainer1Id) || Number.isNaN(trainer2Id)) {
    response.status(400).json({ error: 'Invalid trainer IDs (must be numbers).' });
    return;
  }

  try {
    const battleResult = await runSingles6v6Battle(getActiveDB(), fieldName, trainer1Id, trainer2Id);
    response.json({ message: 'Battle simulation complete', data: battleResult });
  } catch (error) {
    response.status(500).json({ error: (error as Error).message });
  }
}
