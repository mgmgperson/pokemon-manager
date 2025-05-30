import { Router, Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import { generateFormatRatingsFixed } from '../generators/formatRatingGenerator';
import { generateName } from '../generators/nameGenerator';
import { generateRandomTrainer } from '../generators/trainerGenerator';
import { generateGeneralRatings } from '../generators/generalRatingGenerator';
import { generatePokemonTeam, convertPWTRToOverallRating } from '../generators/pokemonGenerator';
import { Types } from '../data/enums/types';
import { Fields } from '../data/enums/fields';
import { generateFieldRatings } from '../generators/fieldRatingGenerator';
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

/**
 * GET /generate-general-ratings/:trainerId
 * 
 * 1. Fetch the trainer row from DB
 * 2. Generate general ratings based on pwtr_rating
 * 3. Return generated rating object
 */
router.get('/generate-general-ratings/:trainerId', (req: Request, res: Response) => {
  const { trainerId } = req.params;

  // Fetch trainer data to get pwtr_rating
  const sqlTrainer = `SELECT * FROM trainer WHERE id = ?`;
  db.get(sqlTrainer, [trainerId], (err: Error | null, trainerRow: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!trainerRow) {
      return res.status(404).json({ error: `No trainer found with ID ${trainerId}` });
    }

    // Generate ratings based on the trainer's pwtr_rating
    const pwtrRating = trainerRow.pwtr_rating;
    const generatedRatings = generateGeneralRatings(parseInt(trainerId), pwtrRating);
    
    return res.json(generatedRatings);
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

/**
 * GET /generate-pokemon-team
 * 
 * Generates a team of Pokémon for a trainer based on:
 * - overall_rating or pwtr_rating
 * - type preferences (optional)
 * - generation preferences (optional)
 * - field preferences (optional)
 * 
 * Returns an array of Pokémon with species_id, pokemon_id, names, and levels.
 */
router.get('/generate-pokemon-team', (req: Request, res: Response) => {
  try {
    const { 
      overall_rating, 
      pwtr_rating, 
      types, 
      generations, 
      fields 
    } = req.query;
    
    // Calculate the overall rating to use
    let overallRatingNum: number;
    
    if (overall_rating) {
      overallRatingNum = parseInt(overall_rating as string);
      if (isNaN(overallRatingNum) || overallRatingNum < 0 || overallRatingNum > 99) {
        res.status(400).json({ error: 'overall_rating must be a number between 0 and 99' });
        return;
      }
    } else if (pwtr_rating) {
      const pwtrRatingNum = parseFloat(pwtr_rating as string);
      if (isNaN(pwtrRatingNum) || pwtrRatingNum < 1000 || pwtrRatingNum > 4500) {
        res.status(400).json({ error: 'pwtr_rating must be a number between 1000 and 4500' });
        return;
      }
      overallRatingNum = convertPWTRToOverallRating(pwtrRatingNum);
    } else {
      res.status(400).json({ error: 'Either overall_rating or pwtr_rating must be provided' });
      return;
    }
    
        // Parse type preferences
    let typePreferences: Types[] | undefined;
    if (types) {
      try {
        if (typeof types === 'string') {
          // Split the string by commas and parse each value
          typePreferences = types.split(',').map(t => parseInt(t.trim()));
        } else if (Array.isArray(types)) {
          // Handle array input (e.g., types[]=1&types[]=2)
          typePreferences = types.map(t => parseInt(t as string));
        } else {
          typePreferences = [parseInt(types as unknown as string)];
        }
        // Validate that all values are valid Types
        if (typePreferences.some(t => isNaN(t) || t < 1 || t > 19)) {
          res.status(400).json({ error: 'Invalid type value. Types must be between 1 and 19.' });
          return;
        }
      } catch (error) {
        res.status(400).json({ error: 'Invalid types format' });
        return;
      }
    }
    
    console.log('Type preferences:', typePreferences);
    
    // Parse generation preferences
    let generationPreferences: number[] | undefined;
    if (generations) {
      try {
        if (typeof generations === 'string') {
          // Split the string by commas and parse each value
          generationPreferences = generations.split(',').map(g => parseInt(g.trim()));
        } else if (Array.isArray(generations)) {
          // Handle array input (e.g., generations[]=1&generations[]=2)
          generationPreferences = generations.map(g => parseInt(g as string));
        } else {
          generationPreferences = [parseInt(generations as unknown as string)];
        }
        // Validate that all values are valid generations (1-9)
        if (generationPreferences.some(g => isNaN(g) || g < 1 || g > 9)) {
          res.status(400).json({ error: 'Invalid generation value. Generations must be between 1 and 9.' });
          return;
        }
      } catch (error) {
        res.status(400).json({ error: 'Invalid generations format' });
        return;
      }
    }
    
    // Parse field preferences
    let fieldPreferences: Fields[] | undefined;
    if (fields) {
      try {
        if (typeof fields === 'string') {
          // Split the string by commas and parse each value
          fieldPreferences = fields.split(',').map(f => parseInt(f.trim()));
        } else if (Array.isArray(fields)) {
          // Handle array input (e.g., fields[]=1&fields[]=2)
          fieldPreferences = fields.map(f => parseInt(f as string));
        } else {
          fieldPreferences = [parseInt(fields as unknown as string)];
        }
        // Validate that all values are valid Fields
        if (fieldPreferences.some(f => isNaN(f) || f < 1 || f > 50)) {
          res.status(400).json({ error: 'Invalid field value. Fields must be between 1 and 50.' });
          return;
        }
      } catch (error) {
        res.status(400).json({ error: 'Invalid fields format' });
        return;
      }
    }
    
    // Generate the team
    const team = generatePokemonTeam(
      overallRatingNum,
      typePreferences,
      generationPreferences,
      fieldPreferences
    );
    
    res.json({ 
      team,
      team_size: team.length,
      overall_rating: overallRatingNum
    });
    return;
    
  } catch (error) {
    console.error('Error generating Pokémon team:', error);
    res.status(500).json({ error: 'Failed to generate Pokémon team' });
    return;
  }
});

/**
 * GET /generate-field-ratings/:trainerId
 * 
 * 1. Fetch the trainer row from DB
 * 2. Fetch the LATEST rating row from DB for that trainer
 * 3. If everything is found, generate random field ratings (unsaved) 
 *    and return them in JSON.
 */
router.get('/generate-field-ratings/:trainerId', (req: Request, res: Response) => {
  const { trainerId } = req.params;

  // (A) First, check if we have a trainer row

  console.log('Fetching trainer with ID:', trainerId);
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

      // (C) We have an overall_rating. Let's generate field ratings
      const overallRating = ratingRow.overall_rating || 50; // fallback to 50 if null?
      
      // Get the trainer's Pokémon team
      const sqlPokemon = `
        SELECT * FROM pokemon WHERE trainer_id = ?
      `;
      db.all(sqlPokemon, [trainerId], (err3: Error | null, pokemonRows: any[]) => {
        if (err3) {
          return res.status(400).json({ error: err3.message });
        }
        
        if (!pokemonRows || pokemonRows.length === 0) {
          return res.status(404).json({ error: `No Pokemon found for trainer ${trainerId}` });
        }
        
        console.log(`Found ${pokemonRows.length} Pokemon for trainer ${trainerId}`);
        console.log(ratingRow);
        // Pass the pokemon rows directly to the generator
        const generated = generateFieldRatings(
          pokemonRows, 
          {
            overall: ratingRow.overall_rating || 50,
            typing: ratingRow.typing_rating || 50, 
            mixed: ratingRow.mixed_rating || 50,
            special: ratingRow.special_rating || 50
          }
        );

        return res.json(generated);
      });
    });
  });
});

export default router;
