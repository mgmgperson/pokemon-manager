import { Router } from 'express';
import {
  applyNewTrainerProposalController,
  applyExistingTrainerProposalController,
  applyRosterProposalController,
  previewNewTrainerProposal,
  previewExistingTrainerProposal,
  previewRosterProposal,
} from './trainer-management.controller';

const router: Router = Router();

router.post('/trainers/:trainerId/proposal', previewExistingTrainerProposal);
router.post('/trainers/:trainerId/apply', applyExistingTrainerProposalController);
router.post('/trainers/:trainerId/roster-proposal', previewRosterProposal);
router.post('/trainers/:trainerId/roster-apply', applyRosterProposalController);
router.post('/new-trainer/proposal', previewNewTrainerProposal);
router.post('/new-trainer/apply', applyNewTrainerProposalController);

export default router;
