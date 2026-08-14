import { Router } from 'express';
import { getInventory, listItemCatalog, sellItems } from './item.controller';

const router: Router = Router();

router.get('/inventory', getInventory);
router.post('/sell', sellItems);
router.get('/all', listItemCatalog);

export default router;
