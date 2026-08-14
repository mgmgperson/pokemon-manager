import { type Request, type Response } from 'express';
import { existsSync } from 'fs';
import { setActiveSave } from '../../../infrastructure/database/activeSave';
import {
  SaveFileNotFoundError,
  SaveNotFoundError,
  cloneSaveSlot,
  deleteSaveSlotById,
  getSaveForDownload,
  listSaveSlots,
  renameSaveSlotById,
} from './save.service';

interface ActivateSaveBody { code?: unknown; path?: unknown; }
interface RenameSaveBody { name?: unknown; }

export async function listSaves(_request: Request, response: Response): Promise<void> {
  try {
    response.json({ saves: await listSaveSlots() });
  } catch (error) {
    console.error('Error fetching save slots:', error);
    response.status(500).json({ error: 'Failed to fetch save slots' });
  }
}

export async function activateSave(
  request: Request<Record<string, never>, unknown, ActivateSaveBody>, response: Response
): Promise<void> {
  const { code, path } = request.body;
  if (typeof code !== 'string' || code.length === 0 || typeof path !== 'string' || path.length === 0) {
    response.status(400).json({ error: 'Save code and path are required' });
    return;
  }
  try {
    await setActiveSave(code, path);
    response.json({ message: 'active_save_set', code });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function renameSave(
  request: Request<{ id: string }, unknown, RenameSaveBody>, response: Response
): Promise<void> {
  const name = request.body.name;
  if (typeof name !== 'string' || name.trim().length === 0) {
    response.status(400).json({ error: 'Name is required' });
    return;
  }
  try {
    const renamed = await renameSaveSlotById(request.params.id, name.trim());
    if (!renamed) {
      response.status(404).json({ error: 'Save not found' });
      return;
    }
    response.json({ success: true, message: 'Save renamed successfully' });
  } catch (error) {
    console.error('Error renaming save:', error);
    response.status(500).json({ error: 'Failed to rename save' });
  }
}

export async function exportSave(request: Request<{ id: string }>, response: Response): Promise<void> {
  try {
    const download = await getSaveForDownload(request.params.id);
    if (!download) {
      response.status(404).json({ error: 'Save not found' });
      return;
    }
    if (!existsSync(download.path)) {
      response.status(404).json({ error: 'Save file not found on disk' });
      return;
    }
    const safeName = download.save.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    response.download(download.path, `${safeName}_${download.save.code}.sqlite`, (error) => {
      if (error && !response.headersSent) {
        response.status(500).json({ error: 'Failed to download file' });
      }
    });
  } catch (error) {
    console.error('Error fetching save for export:', error);
    response.status(500).json({ error: 'Failed to fetch save' });
  }
}

export async function cloneSave(request: Request<{ id: string }>, response: Response): Promise<void> {
  try {
    const save = await cloneSaveSlot(request.params.id);
    response.json({ success: true, message: 'Save cloned successfully', save });
  } catch (error) {
    if (error instanceof SaveNotFoundError) {
      response.status(404).json({ error: 'Save not found' });
      return;
    }
    if (error instanceof SaveFileNotFoundError) {
      response.status(404).json({ error: 'Original save file not found on disk' });
      return;
    }
    console.error('Error copying save file:', error);
    response.status(500).json({ error: 'Failed to copy save file' });
  }
}

export async function deleteSave(request: Request<{ id: string }>, response: Response): Promise<void> {
  try {
    const deleted = await deleteSaveSlotById(request.params.id);
    if (!deleted) {
      response.status(404).json({ error: 'Save not found' });
      return;
    }
    response.json({ success: true, message: 'Save deleted successfully' });
  } catch (error) {
    console.error('Error deleting save record:', error);
    response.status(500).json({ error: 'Failed to delete save record' });
  }
}
