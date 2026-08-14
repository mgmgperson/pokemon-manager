import { Router } from 'express';
import {
  buyItems,
  createShopController,
  getShop,
  getShopForEditing,
  listAvailableShops,
  listShops,
  updateShopController,
} from './shop.controller';

const router: Router = Router();

router.get('/available', listAvailableShops);
router.get('/:id', getShop);
router.post('/:id/buy', buyItems);
router.get('/', listShops);
router.put('/:id', updateShopController);
router.get('/:id/edit', getShopForEditing);
router.post('/', createShopController);

export default router;
