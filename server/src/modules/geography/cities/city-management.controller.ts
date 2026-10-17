import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import { sendCityError } from './city.controller';
import { CityLocationError, getCityLocationReview, getLocationBudget, parseGeographyId, requirePositiveInteger } from './city-location.service';
import { updateCityDetails } from './city.service';
import { applyBulkCityLinks, previewBulkCityLinks } from './city-bulk-links.service';
import { findLocationPolygons } from './city-location.repository';
import { applyMunicipalities, getMunicipalityReview, proposeMunicipalities, rerollMunicipalityName, reviewMunicipalities } from './city-generation.service';

export async function readRegionLocations(request: Request<{ id: string }>, response: Response): Promise<void> {
  try {
    response.json({ message: 'success', data: await findLocationPolygons(getActiveDB(), parseGeographyId(request.params.id)) });
  } catch (error) { sendCityError(response, error); }
}

export async function readMunicipalityReview(request: Request<{ id: string }>, response: Response): Promise<void> {
  try {
    response.json({ message: 'success', data: await getMunicipalityReview(getActiveDB(), parseGeographyId(request.params.id)) });
  } catch (error) { sendCityError(response, error); }
}

export async function generateMunicipalities(request: Request<{ id: string }, unknown, unknown>, response: Response): Promise<void> {
  try {
    response.json({ message: 'Non-persisting proposal', data: await proposeMunicipalities(getActiveDB(), parseGeographyId(request.params.id), request.body) });
  } catch (error) { sendCityError(response, error); }
}

export async function validateMunicipalities(request: Request<{ id: string }, unknown, unknown>, response: Response): Promise<void> {
  try {
    response.json({ message: 'Proposal reviewed; no cities created', data: await reviewMunicipalities(getActiveDB(), parseGeographyId(request.params.id), request.body) });
  } catch (error) { sendCityError(response, error); }
}

export async function createMunicipalities(request: Request<{ id: string }, unknown, unknown>, response: Response): Promise<void> {
  try {
    response.json({ message: 'Reviewed cities created', data: await applyMunicipalities(getActiveDB(), parseGeographyId(request.params.id), request.body) });
  } catch (error) { sendCityError(response, error); }
}

export async function generateMunicipalityName(request: Request<{ id: string }, unknown, unknown>, response: Response): Promise<void> {
  try {
    response.json({ message: 'success', data: await rerollMunicipalityName(getActiveDB(), parseGeographyId(request.params.id), request.body) });
  } catch (error) { sendCityError(response, error); }
}

export async function readBulkLinkPreview(_request: Request, response: Response): Promise<void> {
  try {
    response.json({ message: 'success', data: await previewBulkCityLinks(getActiveDB()) });
  } catch (error) {
    sendCityError(response, error);
  }
}

export async function applyBulkLinks(request: Request<Record<string, never>, unknown, unknown>, response: Response): Promise<void> {
  try {
    response.json({ message: 'City links applied successfully', data: await applyBulkCityLinks(getActiveDB(), request.body) });
  } catch (error) {
    sendCityError(response, error);
  }
}

export async function readLocationBudget(request: Request<{ id: string }>, response: Response): Promise<void> {
  try {
    const locationId = parseGeographyId(request.params.id);
    response.json({ message: 'success', data: await getLocationBudget(getActiveDB(), locationId) });
  } catch (error) {
    sendCityError(response, error);
  }
}

export async function readCityLocationReview(request: Request<{ id: string }>, response: Response): Promise<void> {
  try {
    const cityId = parseGeographyId(request.params.id);
    response.json({ message: 'success', data: await getCityLocationReview(getActiveDB(), cityId) });
  } catch (error) {
    sendCityError(response, error);
  }
}

export async function changeCityLocation(
  request: Request<{ id: string }, unknown, unknown>, response: Response
): Promise<void> {
  try {
    const cityId = parseGeographyId(request.params.id);
    const body = request.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new CityLocationError(400, 'Request body must be an object');
    }
    const locationId = (body as Record<string, unknown>).location_id;
    const location_id = locationId === null ? null : requirePositiveInteger(locationId, 'location_id');
    await updateCityDetails(getActiveDB(), String(cityId), { location_id });
    response.json({ message: 'City location updated successfully', data: { id: cityId, location_id } });
  } catch (error) {
    sendCityError(response, error);
  }
}
