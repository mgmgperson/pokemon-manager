import { Router, Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import { generateFormatRatingsFixed } from '../generators/formatRatingGenerator';
import { generateName } from '../generators/nameGenerator';
import { generateRandomTrainer } from '../generators/trainerGenerator';
const { Database } = sqlite3.verbose();

const router: Router = Router();
const db = new Database('../database/db.sqlite', (err: Error | null) => {
  if (err) {
    console.error('Error opening database:', err.message);
  }
});

router.get('/generate-trainer', (req: Request, res: Response): void => {
  const { regionId, gender, age, pwtr_rating } = req.query;
  
  // Parse optional parameters
  let regionIdNum: number | undefined = undefined;
  let ageNum: number | undefined = undefined;
  let pwtrRatingNum: number | undefined = undefined;
  
  if (regionId) {
    regionIdNum = parseInt(regionId as string);
    if (isNaN(regionIdNum)) {
      res.status(400).json({ error: 'regionId must be a number' });
      return;
    }
  }
  
  if (age) {
    ageNum = parseInt(age as string);
    if (isNaN(ageNum)) {
      res.status(400).json({ error: 'age must be a number' });
      return;
    }
    
    if (ageNum < 14 || ageNum > 80) {
      res.status(400).json({ error: 'age must be between 14 and 80' });
      return;
    }
  }
  
  if (pwtr_rating) {
    pwtrRatingNum = parseFloat(pwtr_rating as string);
    if (isNaN(pwtrRatingNum)) {
      res.status(400).json({ error: 'pwtr_rating must be a number' });
      return;
    }
    
    if (pwtrRatingNum < 1000 || pwtrRatingNum > 4500) {
      res.status(400).json({ error: 'pwtr_rating must be between 1000 and 4500' });
      return;
    }
  }
  
  // Validate gender if provided
  let genderVal: 'M' | 'F' | undefined = undefined;
  if (gender) {
    if (gender === 'M' || gender === 'F') {
      genderVal = gender as 'M' | 'F';
    } else {
      res.status(400).json({ error: 'gender must be either M or F' });
      return;
    }
  }
  
  // Generate random trainer
  generateRandomTrainer(regionIdNum, genderVal, ageNum, pwtrRatingNum)
    .then(result => res.json(result))
    .catch(error => {
      console.error('Error generating trainer:', error);
      res.status(500).json({ error: 'Failed to generate trainer' });
    });
});

/**
 * Helper to pick a random integer in [min, max].
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random mental ratings
 */
function generateMentalRatings(overall: number, trainerId: number, ratingId: number) {
  return {
    id:                       ratingId,
    rating_id:                ratingId,
    planning_rating:          randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
    risk_rating:              randomInt(Math.max(0, overall - 15), Math.min(99, overall + 5)),
    prediction_rating:        randomInt(Math.max(0, overall - 20), Math.min(99, overall + 20)),
    clutch_rating:            randomInt(Math.max(0, overall - 10), Math.min(99, overall + 15)),
    consistency_rating:       randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
    motivation_rating:        randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15)),
    pokemon_knowledge_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
    trainer_knowledge_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
    training_rating:          randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
    conditioning_rating:      randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
    determination_rating:     randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15)),
    facilities_rating:        randomInt(Math.max(0, overall - 15), Math.min(99, overall + 20)),
    attack_rating:            randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15)),
    defense_rating:           randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15)),
    speed_rating:             randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15)),
    gimmick_rating:           randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15)),
  };
}

/**
 * GET /generate-mental-ratings/:trainerId
 * 
 * 1. Fetch the trainer row from DB
 * 2. Fetch the LATEST rating row from DB for that trainer
 * 3. If everything is found, generate random mental ratings (unsaved) 
 *    and return them in JSON.
 */
router.get('/generate-mental-ratings/:trainerId', (req: Request, res: Response) => {
  const { trainerId } = req.params;

  // (A) First, check if we have a trainer row
  const sqlTrainer = `
    SELECT * FROM trainer WHERE id = ?
  `;
  db.get(sqlTrainer, [trainerId], (err: Error | null, trainerRow: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!trainerRow) {
      return res.status(404).json({ error: `No trainer found with ID ${trainerId}` });
    }

    // (B) Next, find the LATEST rating row
    const sqlRating = `
      SELECT * FROM rating
      WHERE trainer_id = ?
      ORDER BY year DESC
      LIMIT 1
    `;
    db.get(sqlRating, [trainerId], (err2: Error | null, ratingRow: any) => {
      if (err2) {
        return res.status(400).json({ error: err2.message });
      }
      if (!ratingRow) {
        return res.status(404).json({ error: `No rating record found for trainer ${trainerId}` });
      }

      // (C) We have an overall_rating. Let's generate mental ratings
      const overallRating = ratingRow.overall_rating || 50; // fallback to 50 if null?
      const generated = generateMentalRatings(overallRating, trainerRow.id, ratingRow.id);

      return res.json(generated);
    });
  });
});

router.get('/generate-format-ratings/:trainerId', (req: Request, res: Response) => {
    const { trainerId } = req.params;
  
    // (A) Check trainer
    const sqlTrainer = `SELECT * FROM trainer WHERE id = ?`;
    db.get(sqlTrainer, [trainerId], (err: Error | null, trainerRow: any) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (!trainerRow) {
        return res.status(404).json({ error: `No trainer found with ID ${trainerId}` });
      }
  
      // (B) Check the rating row
      const sqlRating = `
        SELECT * FROM rating
        WHERE trainer_id = ?
        ORDER BY year DESC
        LIMIT 1
      `;
      db.get(sqlRating, [trainerId], (err2: Error | null, ratingRow: any) => {
        if (err2) {
          return res.status(400).json({ error: err2.message });
        }
        if (!ratingRow) {
          return res.status(404).json({ error: `No rating record found for trainer ${trainerId}` });
        }
  
        // (C) Weighted approach
        const overallRating = ratingRow.overall_rating || 50;
        const generated = generateFormatRatingsFixed(overallRating, trainerRow.id, ratingRow.id);
  
        return res.json(generated);
      });
    });
  });

router.get('/generate-name', (req: Request, res: Response): void => {
  const { regionId, gender } = req.query;

  // Validate parameters exist
  if (!regionId || !gender) {
    res.status(400).json({ error: 'Both regionId and gender are required' });
    return;
  }

  // Validate gender
  if (gender !== 'M' && gender !== 'F') {
    res.status(400).json({ error: 'Gender must be either M or F' });
    return;
  }

  // Validate regionId is a number
  const regionIdNum = parseInt(regionId as string);
  if (isNaN(regionIdNum)) {
    res.status(400).json({ error: 'regionId must be a number' });
    return;
  }

  // Validate region exists
  const sqlRegion = `SELECT id FROM region WHERE id = ?`;
  db.get(sqlRegion, [regionIdNum], (err: Error | null, regionRow: any) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (!regionRow) {
      res.status(404).json({ error: `No region found with ID ${regionId}` });
      return;
    }

    // Generate name
    generateName(regionIdNum, gender as 'M' | 'F')
      .then(name => res.json(name))
      .catch(error => {
        console.error('Error generating name:', error);
        res.status(500).json({ error: 'Failed to generate name' });
      });
  });
});

export default router;
