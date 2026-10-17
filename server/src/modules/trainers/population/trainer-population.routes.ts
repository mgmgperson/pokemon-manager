import { json, Router, type RequestHandler } from 'express';
import { applyPopulation, inspectPopulation, planPopulation, proposePopulation, rerollPopulation, reviewPopulation, validatePopulationBrief } from './trainer-population.controller';

const router: Router = Router();
export const populationJson: RequestHandler = json({ limit: '10mb' });
router.get('/', inspectPopulation);
router.post('/plan', planPopulation);
router.post('/brief', validatePopulationBrief);
router.post('/proposals', proposePopulation);
router.post('/review', reviewPopulation);
router.post('/reroll', rerollPopulation);
router.post('/apply', applyPopulation);

export default router;
