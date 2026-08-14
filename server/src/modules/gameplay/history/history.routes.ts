import { Router } from 'express';
import { getMatchHistory, getRecentPokemon, getTravelHistory } from './history.controller';

const router: Router = Router();

router.get('/travel/:trainerId', getTravelHistory);
router.get('/matches/:trainerId', getMatchHistory);
router.get('/pokemon/:trainerId', getRecentPokemon);

export default router;
