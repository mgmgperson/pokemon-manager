import { Router, Request, Response } from 'express';
import { getActiveDB } from '../services/dbManager';

const router: Router = Router();

// Get all terrains
router.get('/', (req: Request, res: Response) => {
    const db = getActiveDB();
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
    const db = getActiveDB();
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
