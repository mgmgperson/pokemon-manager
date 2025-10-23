import { Router, Request, Response } from 'express';
import { getActiveDB } from '../services/dbManager';

const router: Router = Router();

// Get all training programs for a trainer
router.get('/programs/:trainerId', (req: Request, res: Response) => {
    const db = getActiveDB();
    const trainerId = req.params.trainerId;

    const sql = `
        SELECT 
            p.id,
            p.name,
            p.focus_stat,
            p.base_duration,
            p.fatigue_cost,
            p.cost,
            p.description,
            p.trainer_id
        FROM training_program p
        WHERE p.trainer_id = ?
        ORDER BY p.name
    `;

    db.all(sql, [trainerId], (err: Error | null, rows: any[]) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        return res.json({
            message: 'success',
            data: rows
        });
    });
});

// Get a specific training program
router.get('/programs/detail/:id', (req: Request, res: Response) => {
    const db = getActiveDB();
    const programId = req.params.id;
    
    const sql = `
        SELECT 
            p.id,
            p.name,
            p.focus_stat,
            p.base_duration,
            p.fatigue_cost,
            p.cost,
            p.description,
            p.trainer_id
        FROM training_program p
        WHERE p.id = ?
    `;

    db.get(sql, [programId], (err: Error | null, row: any) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        
        if (!row) {
            return res.status(404).json({ message: 'Training program not found' });
        }

        return res.json({
            message: 'success',
            data: row
        });
    });
});

// Create a new training program
router.post('/programs', (req: Request, res: Response) => {
    const db = getActiveDB();
    const {
        name,
        focus_stat,
        base_duration,
        fatigue_cost,
        cost,
        trainer_id,
        description
    } = req.body;

    const sql = `
        INSERT INTO training_program (
            name,
            focus_stat,
            base_duration,
            fatigue_cost,
            cost,
            trainer_id,
            description
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [name, focus_stat, base_duration, fatigue_cost, cost, trainer_id, description];

    db.run(sql, params, function(err: Error | null) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        return res.json({
            message: 'success',
            data: { id: this.lastID }
        });
    });
});

// Update a training program
router.put('/programs/:id', (req: Request, res: Response) => {
    const db = getActiveDB();
    const programId = req.params.id;
    const {
        name,
        focus_stat,
        base_duration,
        fatigue_cost,
        cost,
        description
    } = req.body;

    const sql = `
        UPDATE training_program
        SET name = ?,
            focus_stat = ?,
            base_duration = ?,
            fatigue_cost = ?,
            cost = ?,
            description = ?
        WHERE id = ?
    `;

    const params = [name, focus_stat, base_duration, fatigue_cost, cost, description, programId];

    db.run(sql, params, function(err: Error | null) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        return res.json({
            message: 'success',
            data: { id: programId }
        });
    });
});

// Get all training sessions for a program
router.get('/sessions/program/:programId', (req: Request, res: Response) => {
    const db = getActiveDB();
    const programId = req.params.programId;

    const sql = `
        SELECT 
            s.id,
            s.pokemon_id,
            s.program_id,
            s.start_time,
            s.end_time,
            s.success,
            s.fatigue,
            s.notes,
            p.nickname as pokemon_name
        FROM training_session s
        JOIN pokemon p ON s.pokemon_id = p.id
        WHERE s.program_id = ?
        ORDER BY s.start_time DESC
    `;

    db.all(sql, [programId], (err: Error | null, rows: any[]) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        return res.json({
            message: 'success',
            data: rows
        });
    });
});

// Get all training sessions for a Pokemon
router.get('/sessions/pokemon/:pokemonId', (req: Request, res: Response) => {
    const db = getActiveDB();
    const pokemonId = req.params.pokemonId;

    const sql = `
        SELECT 
            s.id,
            s.pokemon_id,
            s.program_id,
            s.start_time,
            s.end_time,
            s.success,
            s.fatigue,
            s.notes,
            p.name as program_name
        FROM training_session s
        JOIN training_program p ON s.program_id = p.id
        WHERE s.pokemon_id = ?
        ORDER BY s.start_time DESC
    `;

    db.all(sql, [pokemonId], (err: Error | null, rows: any[]) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        return res.json({
            message: 'success',
            data: rows
        });
    });
});

// Create a new training session
router.post('/sessions', (req: Request, res: Response) => {
    const db = getActiveDB();
    const {
        pokemon_id,
        program_id,
        start_time,
        end_time,
        success,
        fatigue,
        notes
    } = req.body;

    const sql = `
        INSERT INTO training_session (
            pokemon_id,
            program_id,
            start_time,
            end_time,
            success,
            fatigue,
            notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [pokemon_id, program_id, start_time, end_time, success, fatigue, notes];

    db.run(sql, params, function(err: Error | null) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        return res.json({
            message: 'success',
            data: { id: this.lastID }
        });
    });
});

// Update a training session
router.put('/sessions/:id', (req: Request, res: Response) => {
    const db = getActiveDB();
    const sessionId = req.params.id;
    const {
        start_time,
        end_time,
        success,
        fatigue,
        notes
    } = req.body;

    const sql = `
        UPDATE training_session
        SET start_time = COALESCE(?, start_time),
            end_time = ?,
            success = ?,
            fatigue = ?,
            notes = ?
        WHERE id = ?
    `;

    const params = [start_time, end_time, success, fatigue, notes, sessionId];

    db.run(sql, params, function(err: Error | null) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        return res.json({
            message: 'success',
            data: { id: sessionId }
        });
    });
});

// Get a specific training session
router.get('/sessions/:id', (req: Request, res: Response) => {
    const db = getActiveDB();
    const sessionId = req.params.id;
    
    const sql = `
        SELECT 
            s.id,
            s.pokemon_id,
            s.program_id,
            s.start_time,
            s.end_time,
            s.success,
            s.fatigue,
            s.notes,
            p.nickname as pokemon_name,
            tp.name as program_name
        FROM training_session s
        JOIN pokemon p ON s.pokemon_id = p.id
        JOIN training_program tp ON s.program_id = tp.id
        WHERE s.id = ?
    `;

    db.get(sql, [sessionId], (err: Error | null, row: any) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        
        if (!row) {
            return res.status(404).json({ message: 'Training session not found' });
        }

        return res.json({
            message: 'success',
            data: row
        });
    });
});

// Delete a training session
router.delete('/sessions/:id', (req: Request, res: Response) => {
    const db = getActiveDB();
    const sessionId = req.params.id;

    const sql = `DELETE FROM training_session WHERE id = ?`;

    db.run(sql, [sessionId], function(err: Error | null) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        return res.json({
            message: 'success',
            data: { id: sessionId }
        });
    });
});

export default router;