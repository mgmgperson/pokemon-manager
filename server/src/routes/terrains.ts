import { Router, Request, Response } from 'express';
import sqlite3 from 'sqlite3';
const { Database } = sqlite3.verbose();

const router: Router = Router();

const db = new Database('../database/db.sqlite', (err: Error | null) => {
    if (err) {
        console.error('Error opening database:', err.message);
    }
});

// Get all terrains
router.get('/', (req: Request, res: Response) => {
    const sql = `
        SELECT 
            t.id,
            t.code,
            t.name,
            t.description,
            t.default_field_id
        FROM terrain t
        ORDER BY t.name
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

// Get a specific terrain by ID
router.get('/:id', (req: Request, res: Response) => {
    const terrainId = req.params.id;
    
    const sql = `
        SELECT 
            t.id,
            t.code,
            t.name,
            t.description,
            t.default_field_id
        FROM terrain t
        WHERE t.id = ?
    `;

    db.get(sql, [terrainId], (err: Error | null, row: any) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        
        if (!row) {
            return res.status(404).json({ message: 'Terrain not found' });
        }

        return res.json({
            message: 'success',
            data: row
        });
    });
});

export default router;
