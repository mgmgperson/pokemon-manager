import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import crypto from 'crypto';
import { populateDefaultData } from '../data/defaults/defaulthelper';
import { populateFullSaveData } from '../generators/fullSaveGenerator';
import { populateGeneratedTrainers } from '../generators/populateTrainerGenerator';
import { populatePokemonDetails } from '../generators/pokemonSetGenerator';

const router: Router = Router();

// POST /create-league - Create a new league database
router.post('/', (req: Request, res: Response) => {
  try {
    const { leagueName, setupType } = req.body;

    if (!leagueName || leagueName.trim() === '') {
      res.status(400).json({ error: 'League name is required' });
      return;
    }

    // Sanitize league name for filename
    const sanitizedName = leagueName.trim().replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_');
    
    if (sanitizedName === '') {
      res.status(400).json({ error: 'League name contains invalid characters' });
      return;
    }

    // Create the saves directory path
    const savesDir = path.join(__dirname, '..', '..', '..', 'database');
    
    // Ensure saves directory exists
    if (!fs.existsSync(savesDir)) {
      fs.mkdirSync(savesDir, { recursive: true });
    }

    // Create the database filename with timestamp to avoid conflicts
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dbFilename = `${sanitizedName}_${timestamp}.sqlite`;
    const dbPath = path.join(savesDir, dbFilename);

    // Check if file already exists (unlikely with timestamp, but safety check)
    if (fs.existsSync(dbPath)) {
      res.status(409).json({ error: 'A database with this name already exists' });
      return;
    }

    // Create new SQLite database
    const db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error('Error creating database:', err);
        res.status(500).json({ error: 'Failed to create database file' });
        return;
      }

      // Database created successfully
      console.log(`New league database created: ${dbPath}`);
      // Record start time for total create-league operation
      const createStartTime = Date.now();
      
      try {
        // If setupType is 'default', populate with default data
        if (setupType === 'default') {
          let stepStartTime = Date.now();
          console.log('Populating database with default data...');
          await populateDefaultData(db);
          let stepEndTime = Date.now();
          let stepElapsed = ((stepEndTime - stepStartTime) / 1000).toFixed(2);
          console.log(`Default data population completed - elapsed ${stepElapsed}s`);

          stepStartTime = Date.now();
          console.log('Generating full save enhancements...');
          await populateFullSaveData(db);
          stepEndTime = Date.now();
          stepElapsed = ((stepEndTime - stepStartTime) / 1000).toFixed(2);
          console.log(`Full save data generation completed - elapsed ${stepElapsed}s`);

          stepStartTime = Date.now();
          console.log('Generating additional trainers to reach 5000 total...');
          await populateGeneratedTrainers(db);
          stepEndTime = Date.now();
          stepElapsed = ((stepEndTime - stepStartTime) / 1000).toFixed(2);
          console.log(`Trainer generation completed - elapsed ${stepElapsed}s`);

          stepStartTime = Date.now();
          console.log('Populating Pokemon details (OT, gender, shiny, stats, etc.)...');
          await populatePokemonDetails(db);
          stepEndTime = Date.now();
          stepElapsed = ((stepEndTime - stepStartTime) / 1000).toFixed(2);
          console.log(`Pokemon details population completed - elapsed ${stepElapsed}s`);
        }
        
        // Generate a unique code for the save slot
        const saveCode = crypto.randomBytes(8).toString('hex');
        
        // Add entry to meta database save_slot table
        const metaDbPath = path.join(__dirname, '..', '..', '..', 'database', 'meta.sqlite');
        
        // Check if meta database exists, if not create it with the schema
        if (!fs.existsSync(metaDbPath)) {
          console.log('Meta database not found, creating it...');
          // Create meta database with schema
          const metaDb = new sqlite3.Database(metaDbPath, (createErr) => {
            if (createErr) {
              console.error('Error creating meta database:', createErr);
              db.close();
              res.status(500).json({ error: 'Failed to create meta database' });
              return;
            }
            
            // Create save_slot table
            const createTableSql = `
              CREATE TABLE save_slot (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                last_played_at TEXT,
                path TEXT NOT NULL
              )
            `;
            
            metaDb.run(createTableSql, (tableErr) => {
              if (tableErr) {
                console.error('Error creating save_slot table:', tableErr);
                db.close();
                metaDb.close();
                res.status(500).json({ error: 'Failed to create save_slot table' });
                return;
              }
              
              // Now insert the save slot
              insertSaveSlot(metaDb);
            });
          });
        } else {
          // Meta database exists, open it and insert
          const metaDb = new sqlite3.Database(metaDbPath, (metaErr) => {
            if (metaErr) {
              console.error('Error opening meta database:', metaErr);
              db.close();
              res.status(500).json({ error: 'Failed to update save registry' });
              return;
            }
            
            insertSaveSlot(metaDb);
          });
        }
        
        // Helper function to insert save slot
        function insertSaveSlot(metaDb: sqlite3.Database) {
          const insertSql = `
            INSERT INTO save_slot (code, name, path, created_at)
            VALUES (?, ?, ?, datetime('now'))
          `;
          
          // Store the relative path from server directory to the database file
          const relativePath = `../database/${dbFilename}`;
          
          metaDb.run(insertSql, [saveCode, leagueName, relativePath], function(insertErr) {
            if (insertErr) {
              console.error('Error inserting into save_slot:', insertErr);
              // Clean up - remove the created database file
              fs.unlinkSync(dbPath);
              db.close();
              metaDb.close();
              res.status(500).json({ error: 'Failed to register save slot' });
              return;
            }

            console.log(`Save slot registered with code: ${saveCode}`);
            
            // Close both database connections
            db.close((closeErr) => {
              if (closeErr) {
                console.error('Error closing league database:', closeErr);
              }
            });
            
            metaDb.close((metaCloseErr) => {
              if (metaCloseErr) {
                console.error('Error closing meta database:', metaCloseErr);
              }
            });

            // Return success response
            const createEndTime = Date.now();
            const elapsedMs = createEndTime - createStartTime;
            const elapsedSeconds = (elapsedMs / 1000).toFixed(2);
            console.log(`Create-league total time: ${elapsedSeconds}s`);

            res.json({
              message: 'League created successfully',
              data: {
                leagueName,
                dbFilename,
                saveCode,
                setupType,
                createdAt: new Date().toISOString(),
                defaultDataPopulated: setupType === 'default',
                elapsedSeconds: Number(elapsedSeconds)
              }
            });
          });
        }
        
      } catch (populateError) {
        console.error('Error during database population:', populateError);
        db.close();
        // Clean up - remove the created database file
        fs.unlinkSync(dbPath);
        res.status(500).json({ error: 'Failed to populate database with default data' });
      }
    });

  } catch (error) {
    console.error('Error in create-league route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
