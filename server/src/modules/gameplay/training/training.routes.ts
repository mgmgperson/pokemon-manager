import { Router } from 'express';
import {
  createTrainingProgramController,
  createTrainingSessionController,
  deleteTrainingSessionController,
  getTrainingProgram,
  getTrainingSession,
  listPokemonSessions,
  listProgramSessions,
  listTrainingPrograms,
  updateTrainingProgramController,
  updateTrainingSessionController,
} from './training.controller';

const router: Router = Router();

router.get('/programs/:trainerId', listTrainingPrograms);
router.get('/programs/detail/:id', getTrainingProgram);
router.post('/programs', createTrainingProgramController);
router.put('/programs/:id', updateTrainingProgramController);
router.get('/sessions/program/:programId', listProgramSessions);
router.get('/sessions/pokemon/:pokemonId', listPokemonSessions);
router.post('/sessions', createTrainingSessionController);
router.put('/sessions/:id', updateTrainingSessionController);
router.get('/sessions/:id', getTrainingSession);
router.delete('/sessions/:id', deleteTrainingSessionController);

export default router;
