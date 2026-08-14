import { Router } from 'express';
import { getTerrain, listTerrains } from './terrain.controller';

const router: Router = Router();

router.get('/', listTerrains);
router.get('/:id', getTerrain);

export default router;
