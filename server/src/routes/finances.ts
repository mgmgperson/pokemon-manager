import { Router, Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import { getActiveDB } from '../services/dbManager';

const router: Router = Router();

// Define route to get financial status
router.get('/status', (req: Request, res: Response) => {
  const db = getActiveDB();
  const sql = `
    SELECT tf.balance, tf.debt
    FROM trainer_finance tf
    JOIN game_state gs ON tf.trainer_id = gs.active_trainer_id
  `;

  db.get(sql, [], (err: Error | null, row: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    return res.json({
      message: 'success',
      data: row || { balance: 0, debt: 0 }
    });
  });
});

// Define route to get transaction history
router.get('/transactions', (req: Request, res: Response) => {
  const db = getActiveDB();
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const category = req.query.category as string;

  let sql = `
    SELECT ft.*
    FROM financial_transaction ft
    JOIN game_state gs ON ft.trainer_id = gs.active_trainer_id
  `;

  const params: any[] = [];

  if (category) {
    sql += ' WHERE ft.category = ?';
    params.push(category);
  }

  sql += ' ORDER BY ft.date DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  // First get total count
  const countSql = `
    SELECT COUNT(*) as total
    FROM financial_transaction ft
    JOIN game_state gs ON ft.trainer_id = gs.active_trainer_id
    ${category ? 'WHERE ft.category = ?' : ''}
  `;

  db.get(countSql, category ? [category] : [], (err: Error | null, countRow: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    // Then get paginated results
    db.all(sql, params, (err: Error | null, rows: any[]) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      return res.json({
        message: 'success',
        data: {
          transactions: rows,
          total: countRow.total,
          limit,
          offset
        }
      });
    });
  });
});

// Define route to get transaction categories
router.get('/categories', function (req: Request, res: Response) {
  const categories = [
    'prize',
    'wages',
    'sponsor',
    'training',
    'travel',
    'item_purchase',
    'sale',
    'taxes',
    'misc'
  ];

  res.json({
    message: 'success',
    data: categories
  });
});

export default router;