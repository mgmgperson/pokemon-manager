import { Router, Request, Response } from 'express';
import { getActiveDB } from '../services/dbManager';

const router: Router = Router();

// Get the 50 most recent messages
router.get('/', (req: Request, res: Response) => {
  const db = getActiveDB();
  const sql = `
    SELECT * FROM message 
    ORDER BY sent_at DESC 
    LIMIT 50
  `;
  
  db.all(sql, [], (err: Error | null, rows: any[]) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    return res.json({
      message: 'success',
      data: rows
    });
  });
});

// Get a specific message by ID
router.get('/:id', (req: Request, res: Response) => {
  const db = getActiveDB();
  const messageId = req.params.id;
  const sql = 'SELECT * FROM message WHERE id = ?';
  
  db.get(sql, [messageId], (err: Error | null, row: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: 'Message not found' });
    }
    return res.json({
      message: 'success',
      data: row
    });
  });
});

// Mark a message as read
router.patch('/:id/read', (req: Request, res: Response) => {
  const db = getActiveDB();
  const messageId = req.params.id;
  const sql = 'UPDATE message SET is_read = TRUE WHERE id = ?';
  
  db.run(sql, [messageId], (err: Error | null) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    return res.json({
      message: 'success',
    });
  });
});

export default router;