import { Router } from 'express';
import { advanceWorldSimulation, getSimulationStatus } from './simulation.controller';

const router: Router = Router();

router.post('/advance', advanceWorldSimulation);
router.get('/status', getSimulationStatus);

export default router;
