import { Router } from 'express';
import {
  generateFieldRatingPreview,
  generateFormatRatingPreview,
  generateGeneralRatingPreview,
  generateMentalRatingPreview,
  generateNamePreview,
  generatePokemonStatsPreview,
  generatePokemonTeamPreview,
  generateTrainer,
} from './randomizer.controller';

const router: Router = Router();

router.get('/generate-trainer', generateTrainer);
router.get('/generate-mental-ratings/:trainerId', generateMentalRatingPreview);
router.get('/generate-format-ratings/:trainerId', generateFormatRatingPreview);
router.get('/generate-general-ratings/:trainerId', generateGeneralRatingPreview);
router.get('/generate-name', generateNamePreview);
router.get('/generate-pokemon-team', generatePokemonTeamPreview);
router.get('/generate-field-ratings/:trainerId', generateFieldRatingPreview);
router.get('/generate-pokemon-stats/:trainerId/:pokemonId', generatePokemonStatsPreview);

export default router;
