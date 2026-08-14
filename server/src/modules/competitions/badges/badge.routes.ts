import { Router } from 'express';
import { getBadge, listBadges } from './badge.controller';

const router: Router = Router();

router.get('/', listBadges);
router.get('/:id', getBadge);

export default router;
