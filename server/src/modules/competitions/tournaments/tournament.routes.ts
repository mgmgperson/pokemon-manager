import { Router } from 'express';
import {
  getRuleSet, getTournament, getTournamentEvent, listTournaments, listTournamentBadges,
  listTournamentEvents, listTournamentMatches, listTrainerTournamentBadges,
} from './tournament.controller';

const router: Router = Router();

router.get('/', listTournaments);
router.get('/:id', getTournament);
router.get('/:id/events', listTournamentEvents);
router.get('/events/:eventId', getTournamentEvent);
router.get('/rule-sets/:ruleSetId', getRuleSet);
router.get('/events/:eventId/matches', listTournamentMatches);
router.get('/badges', listTournamentBadges);
router.get('/trainers/:trainerId/badges', listTrainerTournamentBadges);

export default router;
