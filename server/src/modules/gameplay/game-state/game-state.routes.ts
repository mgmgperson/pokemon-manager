import { Router } from 'express';
import { getActiveTrainer, getHomeGameState } from './game-state.controller';

const router: Router = Router();

router.get('/home', getHomeGameState);
router.get('/active-trainer', getActiveTrainer);

export default router;
