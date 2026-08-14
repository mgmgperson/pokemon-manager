import { Router } from 'express';
import { getSpecies, listSpecies } from './pokemon.controller';

const router: Router = Router();

router.get('/', listSpecies);
router.get('/:id', getSpecies);

export default router;
