import { Router } from 'express';
import { getPokemon, listPokemon } from './pokemon.controller';

const router: Router = Router();

router.get('/', listPokemon);
router.get('/:id', getPokemon);

export default router;
