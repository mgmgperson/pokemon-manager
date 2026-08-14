import { Router } from 'express';
import { activateSave, cloneSave, deleteSave, exportSave, listSaves, renameSave } from './save.controller';

const router: Router = Router();

router.get('/saves', listSaves);
router.post('/activate-save', activateSave);
router.put('/saves/:id/rename', renameSave);
router.get('/saves/:id/export', exportSave);
router.post('/saves/:id/clone', cloneSave);
router.delete('/saves/:id', deleteSave);

export default router;
