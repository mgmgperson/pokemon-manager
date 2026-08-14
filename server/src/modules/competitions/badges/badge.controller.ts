import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import { findBadgeDetails, findBadges } from './badge.repository';

interface BadgeQuery {
  category?: string | string[];
  region_id?: string | string[];
}

export async function listBadges(
  request: Request<Record<string, never>, unknown, unknown, BadgeQuery>,
  response: Response
): Promise<void> {
  try {
    const badges = await findBadges(getActiveDB(), {
      category: typeof request.query.category === 'string' ? request.query.category : undefined,
      regionId: typeof request.query.region_id === 'string' ? request.query.region_id : undefined,
    });
    response.json({ success: true, data: badges });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function getBadge(
  request: Request<{ id: string }>,
  response: Response
): Promise<void> {
  try {
    const badgeDetails = await findBadgeDetails(getActiveDB(), request.params.id);

    if (!badgeDetails) {
      response.status(404).json({ error: 'Badge not found' });
      return;
    }

    response.json({ success: true, data: badgeDetails });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}
