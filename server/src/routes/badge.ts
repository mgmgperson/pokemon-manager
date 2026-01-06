import { Router, Request, Response } from 'express';
import { getActiveDB } from '../services/dbManager';

const router: Router = Router();

// GET /badges - Get all badges
router.get('/', (req: Request, res: Response) => {
    const db = getActiveDB();
    const category = req.query.category as string | undefined;
    const regionId = req.query.region_id as string | undefined;

    let sql = `
        SELECT 
            b.id,
            b.code,
            b.name,
            b.category,
            b.image,
            b.description,
            b.region_id,
            r.name as region_name,
            b.tournament_template_id,
            tt.name as tournament_name,
            COUNT(tb.id) as trainer_count
        FROM badge b
        LEFT JOIN region r ON b.region_id = r.id
        LEFT JOIN tournament_template tt ON b.tournament_template_id = tt.id
        LEFT JOIN trainer_badge tb ON b.id = tb.badge_id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (category) {
        conditions.push('b.category = ?');
        params.push(category);
    }

    if (regionId) {
        conditions.push('b.region_id = ?');
        params.push(regionId);
    }

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += `
        GROUP BY b.id
        ORDER BY b.category, b.region_id, b.id
    `;

    db.all(sql, params, (err: Error | null, rows: any[]) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        return res.json({
            success: true,
            data: rows
        });
    });
});

// GET /badges/:id - Get badge details with trainers who have it
router.get('/:id', (req: Request, res: Response) => {
    const db = getActiveDB();
    const badgeId = req.params.id;

    // Get badge details
    const sqlBadge = `
        SELECT 
            b.id,
            b.code,
            b.name,
            b.category,
            b.image,
            b.description,
            b.region_id,
            r.name as region_name,
            b.tournament_template_id,
            tt.name as tournament_name,
            tt.team_type as tournament_team_type,
            tt.frequency as tournament_frequency,
            tt.start_month as tournament_start_month
        FROM badge b
        LEFT JOIN region r ON b.region_id = r.id
        LEFT JOIN tournament_template tt ON b.tournament_template_id = tt.id
        WHERE b.id = ?
    `;

    db.get(sqlBadge, [badgeId], (err: Error | null, badge: any) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (!badge) {
            return res.status(404).json({ error: 'Badge not found' });
        }

        // Get trainers who have this badge
        const sqlTrainers = `
            SELECT 
                t.id as trainer_id,
                t.fname,
                t.lname,
                t.pwtr_rating,
                t.peak_rating,
                t.peak_rank,
                t.region_id,
                r.name as region_name,
                tb.awarded_at,
                tb.notes,
                te.edition_label as event_edition
            FROM trainer_badge tb
            JOIN trainer t ON tb.trainer_id = t.id
            LEFT JOIN region r ON t.region_id = r.id
            LEFT JOIN tournament_event te ON tb.source_event_id = te.id
            WHERE tb.badge_id = ?
            ORDER BY tb.awarded_at DESC, t.peak_rating DESC
        `;

        db.all(sqlTrainers, [badgeId], (err: Error | null, trainers: any[]) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            return res.json({
                success: true,
                data: {
                    badge: badge,
                    trainers: trainers
                }
            });
        });
    });
});

export default router;