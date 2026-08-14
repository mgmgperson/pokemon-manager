import { Router } from 'express';
import {
  changeTerrainRates, createLocation, getLocation, listLocations, listSubLocations, listTerrains, updateLocationController,
} from './location.controller';

const router: Router = Router();

router.get('/', listLocations);
router.post('/', createLocation);
router.put('/terrain-rates', changeTerrainRates);
router.get('/:id', getLocation);
router.get('/:id/sub-locations', listSubLocations);
router.put('/:id', updateLocationController);
router.get('/terrains/all', listTerrains);

export default router;
