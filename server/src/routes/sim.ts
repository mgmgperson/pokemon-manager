/**
 * routes/sim.ts
 * 
 * API endpoint for world simulation.
 * 
 * POST /sim/advance - Advance the simulation
 *   Request body (SimAdvanceRequest):
 *     - mode: 'byTime' | 'toNextEvent'
 *     - step: 'hour' | 'day' | 'week' (default: 'day')
 *     - amount: number (default: 1)
 *     - maxOps: number (default: 1000)
 *     - seed: number (optional, for determinism)
 *     - dryRun: boolean (default: false)
 *     - gameStateId: number (optional)
 * 
 *   Response body (SimReport):
 *     - fromTime: string
 *     - toTime: string
 *     - resolvedEventInstanceIds: number[]
 *     - simmedMatchIds: number[]
 *     - awardedBadges: AwardedBadge[]
 *     - notes: string[]
 */

import { Router, Request, Response } from 'express';
import { getActiveDB } from '../services/dbManager';
import { advanceWorld } from '../sim/WorldSim';
import { SimAdvanceRequest, SimReport } from '../types/sim';

const router: Router = Router();

/**
 * POST /sim/advance
 * 
 * Advance the world simulation by time or to the next event.
 */
router.post('/advance', async (req: Request, res: Response) => {
    try {
        const db = getActiveDB();

        // Parse request body
        const {
            mode = 'byTime',
            step = 'day',
            amount = 1,
            maxOps = 1000,
            seed,
            dryRun = false,
            gameStateId
        } = req.body;

        // Validate mode
        if (mode !== 'byTime' && mode !== 'toNextEvent') {
            res.status(400).json({
                success: false,
                error: `Invalid mode: ${mode}. Must be 'byTime' or 'toNextEvent'.`
            });
            return;
        }

        // Validate step
        if (step !== 'hour' && step !== 'day' && step !== 'week') {
            res.status(400).json({
                success: false,
                error: `Invalid step: ${step}. Must be 'hour', 'day', or 'week'.`
            });
            return;
        }

        // Validate amount
        if (typeof amount !== 'number' || amount < 1 || amount > 365) {
            res.status(400).json({
                success: false,
                error: `Invalid amount: ${amount}. Must be between 1 and 365.`
            });
            return;
        }

        // Validate maxOps
        if (typeof maxOps !== 'number' || maxOps < 1 || maxOps > 100000) {
            res.status(400).json({
                success: false,
                error: `Invalid maxOps: ${maxOps}. Must be between 1 and 100000.`
            });
            return;
        }

        // Build request object
        const request: SimAdvanceRequest = {
            mode,
            step,
            amount,
            maxOps,
            seed,
            dryRun,
            gameStateId
        };

        // Run simulation
        const report: SimReport = await advanceWorld(db, request);

        res.json({
            success: true,
            data: report
        });
        return;

    } catch (err: any) {
        console.error('Simulation error:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Internal server error during simulation'
        });
        return;
    }
});

/**
 * GET /sim/status
 * 
 * Get current simulation status (game time, pending events, etc.)
 */
router.get('/status', (req: Request, res: Response) => {
    const db = getActiveDB();
    const gameStateId = req.query.gameStateId as string | undefined;

    let sql: string;
    let params: any[];

    if (gameStateId) {
        sql = 'SELECT * FROM game_state WHERE id = ? LIMIT 1';
        params = [gameStateId];
    } else {
        sql = 'SELECT * FROM game_state ORDER BY id LIMIT 1';
        params = [];
    }

    db.get(sql, params, (err: Error | null, gameState: any) => {
        if (err) {
            return res.status(400).json({
                success: false,
                error: err.message
            });
        }

        if (!gameState) {
            return res.status(404).json({
                success: false,
                error: 'No game_state found'
            });
        }

        // Get counts of pending items
        const countSql = `
            SELECT
                (SELECT COUNT(*) FROM match WHERE winner_id IS NULL AND scheduled_at IS NOT NULL) as pending_matches,
                (SELECT COUNT(*) FROM event_instance WHERE status = 'scheduled') as scheduled_events,
                (SELECT COUNT(*) FROM tournament_event WHERE status = 'scheduled') as scheduled_tournaments,
                (SELECT COUNT(*) FROM tournament_event WHERE status = 'ongoing') as ongoing_tournaments
        `;

        db.get(countSql, [], (err2: Error | null, counts: any) => {
            if (err2) {
                return res.status(400).json({
                    success: false,
                    error: err2.message
                });
            }

            return res.json({
                success: true,
                data: {
                    gameState,
                    pendingMatches: counts?.pending_matches || 0,
                    scheduledEvents: counts?.scheduled_events || 0,
                    scheduledTournaments: counts?.scheduled_tournaments || 0,
                    ongoingTournaments: counts?.ongoing_tournaments || 0
                }
            });
        });
    });
});

export default router;