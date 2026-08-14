import { Router } from 'express';
import { getMessage, listMessages, markMessageAsRead } from './message.controller';

const router: Router = Router();

router.get('/', listMessages);
router.get('/:id', getMessage);
router.patch('/:id/read', markMessageAsRead);

export default router;
