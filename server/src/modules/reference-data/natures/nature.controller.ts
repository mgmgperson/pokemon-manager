import { type Request, type Response } from 'express';
import { findNatureById, listNatures } from './nature.catalog';

interface NatureQuery {
  limit?: string | string[];
}

function parsePositiveInteger(value: string | string[] | undefined): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isSafeInteger(parsedValue) ? parsedValue : null;
}

export function listNatureCatalog(
  request: Request<Record<string, never>, unknown, unknown, NatureQuery>,
  response: Response
): void {
  try {
    const limit = parsePositiveInteger(request.query.limit);

    if (limit === null) {
      response.status(400).json({
        success: false,
        message: 'Invalid limit parameter',
      });
      return;
    }

    response.json({
      success: true,
      data: listNatures(limit),
    });
  } catch (error) {
    console.error('Error fetching natures:', error);
    response.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

export function getNatureCatalogEntry(
  request: Request<{ id: string }>,
  response: Response
): void {
  try {
    const natureId = parsePositiveInteger(request.params.id);

    if (natureId === null || natureId === undefined) {
      response.status(400).json({
        success: false,
        message: 'Invalid nature ID',
      });
      return;
    }

    const nature = findNatureById(natureId);

    if (!nature) {
      response.status(404).json({
        success: false,
        message: 'Nature not found',
      });
      return;
    }

    response.json({
      success: true,
      data: nature,
    });
  } catch (error) {
    console.error('Error fetching nature:', error);
    response.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
