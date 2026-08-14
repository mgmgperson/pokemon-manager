import { Router } from 'express';
import { createLeagueController } from './league-creation.controller';

const router: Router = Router();

router.post('/', createLeagueController);

export default router;
