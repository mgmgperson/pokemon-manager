import { Router } from 'express';
import { getNatureCatalogEntry, listNatureCatalog } from './nature.controller';

const router: Router = Router();

router.get('/', listNatureCatalog);
router.get('/:id', getNatureCatalogEntry);

export default router;
