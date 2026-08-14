import { Router } from 'express';
import { getRegion, listRegions } from './region.controller';

const router: Router = Router();

router.get('/', listRegions);
router.get('/:id', getRegion);

export default router;
