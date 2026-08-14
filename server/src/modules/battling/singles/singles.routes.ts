import { Router } from 'express';
import { runSinglesBattle } from './singles.controller';

const router: Router = Router();

router.get('/singles6v6', runSinglesBattle);

export default router;
