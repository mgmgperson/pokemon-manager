import { Router, Request, Response } from 'express';
import { getActiveDB } from '../services/dbManager';

const router: Router = Router();

// GET /history/travel/:trainerId - Get travel log for a trainer
router.get('/travel/:trainerId', (req: Request, res: Response) => {
    const db = getActiveDB();
    const trainerId = req.params.trainerId;

    const sql = `
        SELECT 
            tl.id,
            tl.trainer_id,
            tl.from_location_id,
            tl.to_location_id,
            tl.departure_time,
            tl.arrival_time,
            tl.notes,
            fromLoc.name as from_location_name,
            toLoc.name as to_location_name,
            fromRegion.name as from_region_name,
            toRegion.name as to_region_name
        FROM travel_log tl
        LEFT JOIN location fromLoc ON tl.from_location_id = fromLoc.id
        LEFT JOIN location toLoc ON tl.to_location_id = toLoc.id
        LEFT JOIN region fromRegion ON fromLoc.region_id = fromRegion.id
        LEFT JOIN region toRegion ON toLoc.region_id = toRegion.id
        WHERE tl.trainer_id = ?
        ORDER BY tl.departure_time DESC, tl.id DESC
        LIMIT 50
    `;

    db.all(sql, [trainerId], (err: Error | null, rows: any[]) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        return res.json({
            success: true,
            data: rows
        });
    });
});

// GET /history/matches/:trainerId - Get match history for a trainer
router.get('/matches/:trainerId', (req: Request, res: Response) => {
    const db = getActiveDB();
    const trainerId = req.params.trainerId;

    const sql = `
        SELECT 
            m.id as match_id,
            m.round,
            m.scheduled_at,
            m.winner_id,
            s.name as stadium_name,
            s.type as stadium_type,
            c.name as city_name,
            r.name as region_name,
            te.edition_label as tournament_edition,
            tt.name as tournament_name,
            pa.id as participant_a_id,
            pb.id as participant_b_id,
            ta.fname as trainer_a_fname,
            ta.lname as trainer_a_lname,
            tb.fname as trainer_b_fname,
            tb.lname as trainer_b_lname,
            tw.fname as winner_fname,
            tw.lname as winner_lname
        FROM match m
        JOIN stage_event se ON m.stage_event_id = se.id
        JOIN tournament_event te ON se.tournament_event_id = te.id
        JOIN tournament_template tt ON te.template_id = tt.id
        LEFT JOIN stadium s ON m.stadium_id = s.id
        LEFT JOIN city c ON s.city_id = c.id
        LEFT JOIN region r ON c.region_id = r.id
        JOIN tournament_participant pa ON m.participant_a_id = pa.id
        JOIN tournament_participant pb ON m.participant_b_id = pb.id
        LEFT JOIN team_member tma ON pa.id = tma.participant_id
        LEFT JOIN team_member tmb ON pb.id = tmb.participant_id
        LEFT JOIN trainer ta ON tma.trainer_id = ta.id
        LEFT JOIN trainer tb ON tmb.trainer_id = tb.id
        LEFT JOIN tournament_participant pw ON m.winner_id = pw.id
        LEFT JOIN team_member tmw ON pw.id = tmw.participant_id
        LEFT JOIN trainer tw ON tmw.trainer_id = tw.id
        WHERE tma.trainer_id = ? OR tmb.trainer_id = ?
        ORDER BY m.scheduled_at DESC
        LIMIT 50
    `;

    db.all(sql, [trainerId, trainerId], (err: Error | null, rows: any[]) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        return res.json({
            success: true,
            data: rows
        });
    });
});

// GET /history/pokemon/:trainerId - Get recent Pokemon caught by trainer
router.get('/pokemon/:trainerId', (req: Request, res: Response) => {
    const db = getActiveDB();
    const trainerId = req.params.trainerId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const sql = `
        SELECT 
            p.id,
            p.pokemon_id,
            p.species_id,
            p.nickname,
            p.level,
            p.level_met_at,
            p.date_met_at,
            p.location_met_at,
            p.ot_name,
            p.ot_id,
            p.gender,
            p.shiny,
            p.pokeball_id
        FROM pokemon p
        WHERE p.trainer_id = ?
        ORDER BY p.date_met_at DESC, p.id DESC
        LIMIT ?
    `;

    db.all(sql, [trainerId, limit], (err: Error | null, rows: any[]) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        return res.json({
            success: true,
            data: rows
        });
    });
});

export default router;
