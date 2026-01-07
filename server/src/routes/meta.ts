import { Router, Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import { resolve } from 'path';
import { copyFileSync, unlinkSync, existsSync } from 'fs';
import { setActiveSave } from '../services/dbManager';

const router = Router();

// Interface for save slot data
export interface SaveSlot {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  lastPlayedAt: string | null;
  path: string;
}

// Helper to get meta database connection
function getMetaDB(): sqlite3.Database {
  return new sqlite3.Database(resolve(__dirname, '../../../database/meta.sqlite'));
}

// Get all save slots
router.get('/saves', (req: Request, res: Response) => {
  const db = getMetaDB();
  
  db.all(`
    SELECT 
      id,
      code,
      name,
      created_at as createdAt,
      last_played_at as lastPlayedAt,
      path
    FROM save_slot
    ORDER BY created_at DESC
  `, [], (err, rows: SaveSlot[]) => {
    if (err) {
      console.error('Error fetching save slots:', err);
      db.close();
      res.status(500).json({ error: 'Failed to fetch save slots' });
      return;
    }
    
    res.json({ saves: rows });
    db.close();
  });
});

router.post('/activate-save', (req, res) => {
  const { code, path } = req.body as { code: string; path: string };
  try {
    setActiveSave(code, path);
    res.json({ message: 'active_save_set', code });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Rename a save slot
router.put('/saves/:id/rename', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body as { name: string };

  if (!name || name.trim().length === 0) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  const db = getMetaDB();

  db.run(
    'UPDATE save_slot SET name = ? WHERE id = ?',
    [name.trim(), id],
    function(err) {
      if (err) {
        console.error('Error renaming save:', err);
        db.close();
        res.status(500).json({ error: 'Failed to rename save' });
        return;
      }

      if (this.changes === 0) {
        db.close();
        res.status(404).json({ error: 'Save not found' });
        return;
      }

      res.json({ success: true, message: 'Save renamed successfully' });
      db.close();
    }
  );
});

// Export a save (download the sqlite file)
router.get('/saves/:id/export', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getMetaDB();

  db.get(
    'SELECT path, name, code FROM save_slot WHERE id = ?',
    [id],
    (err, row: { path: string; name: string; code: string } | undefined) => {
      db.close();

      if (err) {
        console.error('Error fetching save for export:', err);
        res.status(500).json({ error: 'Failed to fetch save' });
        return;
      }

      if (!row) {
        res.status(404).json({ error: 'Save not found' });
        return;
      }

      // Handle path resolution - stored paths are like '../database/file.sqlite'
      // We're in server/src/routes, so go up 3 to project root, then path is relative to server/
      const projectRoot = resolve(__dirname, '../../../');
      const filePath = resolve(projectRoot, 'server', row.path);

      if (!existsSync(filePath)) {
        console.error('Save file not found:', filePath);
        res.status(404).json({ error: 'Save file not found on disk' });
        return;
      }

      // Generate a safe filename
      const safeName = row.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeName}_${row.code}.sqlite`;

      res.download(filePath, filename, (downloadErr) => {
        if (downloadErr) {
          console.error('Error sending file:', downloadErr);
          // Don't send another response if headers already sent
          if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to download file' });
          }
        }
      });
    }
  );
});

// Clone a save
router.post('/saves/:id/clone', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getMetaDB();

  db.get(
    'SELECT path, name, code FROM save_slot WHERE id = ?',
    [id],
    (err, row: { path: string; name: string; code: string } | undefined) => {
      if (err) {
        console.error('Error fetching save for clone:', err);
        db.close();
        res.status(500).json({ error: 'Failed to fetch save' });
        return;
      }

      if (!row) {
        db.close();
        res.status(404).json({ error: 'Save not found' });
        return;
      }

      // Handle path resolution - stored paths are like '../database/file.sqlite'
      const projectRoot = resolve(__dirname, '../../../');
      const originalPath = resolve(projectRoot, 'server', row.path);

      if (!existsSync(originalPath)) {
        console.error('Original save file not found:', originalPath);
        db.close();
        res.status(404).json({ error: 'Save file not found on disk' });
        return;
      }

      // Generate new code and path for the clone
      const timestamp = Date.now();
      const newCode = `${row.code}_clone_${timestamp}`;
      const newName = `${row.name} Clone`;
      
      // Determine the directory and create new path
      const pathParts = row.path.split('/');
      const fileName = pathParts.pop();
      const directory = pathParts.join('/');
      const newFileName = `${newCode}.sqlite`;
      const newRelativePath = `${directory}/${newFileName}`;
      const newAbsolutePath = resolve(projectRoot, 'server', newRelativePath);

      try {
        // Copy the sqlite file
        copyFileSync(originalPath, newAbsolutePath);

        // Insert new save_slot record
        db.run(
          `INSERT INTO save_slot (code, name, path, created_at) 
           VALUES (?, ?, ?, datetime('now'))`,
          [newCode, newName, newRelativePath],
          function(insertErr) {
            if (insertErr) {
              console.error('Error inserting cloned save:', insertErr);
              // Clean up the copied file
              try {
                unlinkSync(newAbsolutePath);
              } catch (_) {}
              db.close();
              res.status(500).json({ error: 'Failed to create clone record' });
              return;
            }

            const newId = this.lastID;
            res.json({
              success: true,
              message: 'Save cloned successfully',
              save: {
                id: newId,
                code: newCode,
                name: newName,
                path: newRelativePath
              }
            });
            db.close();
          }
        );
      } catch (copyErr) {
        console.error('Error copying save file:', copyErr);
        db.close();
        res.status(500).json({ error: 'Failed to copy save file' });
      }
    }
  );
});

// Delete a save
router.delete('/saves/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getMetaDB();

  db.get(
    'SELECT path, code FROM save_slot WHERE id = ?',
    [id],
    (err, row: { path: string; code: string } | undefined) => {
      if (err) {
        console.error('Error fetching save for deletion:', err);
        db.close();
        res.status(500).json({ error: 'Failed to fetch save' });
        return;
      }

      if (!row) {
        db.close();
        res.status(404).json({ error: 'Save not found' });
        return;
      }

      // Handle path resolution - stored paths are like '../database/file.sqlite'
      const projectRoot = resolve(__dirname, '../../../');
      const filePath = resolve(projectRoot, 'server', row.path);

      // Delete the database record first
      db.run('DELETE FROM save_slot WHERE id = ?', [id], function(deleteErr) {
        if (deleteErr) {
          console.error('Error deleting save record:', deleteErr);
          db.close();
          res.status(500).json({ error: 'Failed to delete save record' });
          return;
        }

        if (this.changes === 0) {
          db.close();
          res.status(404).json({ error: 'Save not found' });
          return;
        }

        // Try to delete the file (don't fail if file doesn't exist)
        try {
          if (existsSync(filePath)) {
            unlinkSync(filePath);
          }
        } catch (fileErr) {
          console.warn('Could not delete save file:', fileErr);
          // Continue anyway - the record is deleted
        }

        res.json({ success: true, message: 'Save deleted successfully' });
        db.close();
      });
    }
  );
});

export default router;