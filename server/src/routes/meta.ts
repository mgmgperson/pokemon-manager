import { Router, Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import { resolve } from 'path';
import { setActiveSave } from '../services/dbManager';

const router = Router();

// Interface for save slot data
export interface SaveSlot {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  lastPlayedAt: string | null;
  path: string;
}

// Get all save slots
router.get('/saves', (req: Request, res: Response) => {
  const db = new sqlite3.Database(resolve(__dirname, '../../../database/meta.sqlite'), (err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      return res.status(500).json({ error: 'Failed to connect to database' });
    }

    db.all(`
      SELECT 
        id,
        code,
        name,
        created_at as createdAt,
        last_played_at as lastPlayedAt,
        path
      FROM save_slot
      ORDER BY created_at DESC
    `, [], (err, rows: SaveSlot[]) => {
      if (err) {
        console.error('Error fetching save slots:', err);
        return res.status(500).json({ error: 'Failed to fetch save slots' });
      }
      
      res.json({ saves: rows });
      db.close();
    });
  });
});

router.post('/activate-save', (req, res) => {
  const { code, path } = req.body as { code: string; path: string };
  try {
    setActiveSave(code, path);
    res.json({ message: 'active_save_set', code });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;