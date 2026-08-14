import { Router } from 'express';
import { getSimulationData } from './simulation-info.controller';

const router: Router = Router();

router.get('/simulation-data', getSimulationData);

export default router;
