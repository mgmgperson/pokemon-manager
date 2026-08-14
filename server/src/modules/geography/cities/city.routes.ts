import { Router } from 'express';
import { createCityController, getCity, listCities, updateCityController } from './city.controller';

const router: Router = Router();

router.get('/', listCities);
router.post('/', createCityController);
router.get('/:id', getCity);
router.put('/:id', updateCityController);

export default router;
