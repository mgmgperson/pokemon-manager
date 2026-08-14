import { Router } from 'express';
import { getLeagueOverview } from './league.controller';

const router: Router = Router();

router.get('/', getLeagueOverview);

export default router;
