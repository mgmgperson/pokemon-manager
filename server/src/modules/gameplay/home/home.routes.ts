import { Router } from 'express';
import { getNextEvents, getTrainersAround } from './home.controller';

const router: Router = Router();

router.get('/trainers-around/:locationId', getTrainersAround);
router.get('/next-events/:trainerId', getNextEvents);

export default router;
