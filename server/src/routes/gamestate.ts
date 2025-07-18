import { Router, Request, Response } from 'express';
import sqlite3 from 'sqlite3';
const { Database } = sqlite3.verbose();

const router: Router = Router();

const db = new Database('../database/db.sqlite', (err: Error | null) => {
  if (err) {
    console.error('Error opening database:', err.message);
  }
});

// GET /home - Get current game state info
router.get('/home', (req: Request, res: Response) => {
  const sql = `
    SELECT 
      gs.*,
      t.fname as trainer_fname,
      t.lname as trainer_lname,
      l.name as location_name,
      r.name as region_name
    FROM game_state gs
    LEFT JOIN trainer t ON gs.active_trainer_id = t.id
    LEFT JOIN location l ON gs.active_location_id = l.id
    LEFT JOIN region r ON l.region_id = r.id
    ORDER BY gs.last_played_at DESC
    LIMIT 1
  `;

  db.get(sql, [], (err: Error | null, row: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: 'No game state found' });
    }
    return res.json({
      message: 'success',
      data: row,
    });
  });
});

// GET /active-trainer - Get just the active trainer ID
router.get('/active-trainer', (req: Request, res: Response) => {
  const sql = `
    SELECT active_trainer_id
    FROM game_state
    ORDER BY last_played_at DESC
    LIMIT 1
  `;

  db.get(sql, [], (err: Error | null, row: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: 'No game state found' });
    }
    return res.json({
      message: 'success',
      data: { active_trainer_id: row.active_trainer_id },
    });
  });
});

export default router;
