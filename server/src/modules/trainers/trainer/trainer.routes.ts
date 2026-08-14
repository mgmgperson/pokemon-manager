import { Router } from 'express';
import {
  createTrainerController,
  getTrainer,
  listInactiveTrainers,
  listTrainerPokemon,
  listTrainers,
  updateFieldRatingsController,
  updateFormatRatingsController,
  updateMentalRatingsController,
  updateTrainerController,
} from './trainer.controller';

const router: Router = Router();

router.get('/', listTrainers);
router.get('/inactive', listInactiveTrainers);
router.get('/:id', getTrainer);
router.get('/:id/pokemon', listTrainerPokemon);
router.post('/', createTrainerController);
router.put('/:id', updateTrainerController);
router.put('/:id/field_ratings', updateFieldRatingsController);
router.put('/:id/mental_ratings', updateMentalRatingsController);
router.put('/:id/format_ratings', updateFormatRatingsController);

export default router;
