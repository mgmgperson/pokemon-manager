import { Router } from 'express';
import {
  createPokemonInstance,
  getPokemonInstance,
  updatePokemonInstance,
} from './pokemon.controller';

const router: Router = Router();

router.get('/:id', getPokemonInstance);
router.put('/:id', updatePokemonInstance);
router.post('/', createPokemonInstance);

export default router;
