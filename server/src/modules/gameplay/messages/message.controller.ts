import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import { findMessageById, findRecentMessages, markMessageRead } from './message.repository';

export async function listMessages(_request: Request, response: Response): Promise<void> {
  try {
    const messages = await findRecentMessages(getActiveDB());
    response.json({ message: 'success', data: messages });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function getMessage(
  request: Request<{ id: string }>,
  response: Response
): Promise<void> {
  try {
    const message = await findMessageById(getActiveDB(), request.params.id);

    if (!message) {
      response.status(404).json({ message: 'Message not found' });
      return;
    }

    response.json({ message: 'success', data: message });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function markMessageAsRead(
  request: Request<{ id: string }>,
  response: Response
): Promise<void> {
  try {
    await markMessageRead(getActiveDB(), request.params.id);
    response.json({ message: 'success' });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}
