import { Router } from 'express';
import { applyBulkLinks, changeCityLocation, createMunicipalities, generateMunicipalities, generateMunicipalityName,
  readBulkLinkPreview, readCityLocationReview, readLocationBudget, readMunicipalityReview, readRegionLocations, validateMunicipalities } from './city-management.controller';

const router: Router = Router();

router.get('/bulk-links/preview', readBulkLinkPreview);
router.post('/bulk-links/apply', applyBulkLinks);
router.get('/locations/:id', readLocationBudget);
router.get('/regions/:id/locations', readRegionLocations);
router.get('/locations/:id/generation', readMunicipalityReview);
router.post('/locations/:id/proposals', generateMunicipalities);
router.post('/locations/:id/proposals/review', validateMunicipalities);
router.post('/locations/:id/proposals/apply', createMunicipalities);
router.post('/locations/:id/names', generateMunicipalityName);
router.get('/cities/:id/locations', readCityLocationReview);
router.put('/cities/:id/location', changeCityLocation);

export default router;
