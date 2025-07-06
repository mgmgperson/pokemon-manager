import { Router, Request, Response } from 'express';
import sqlite3 from 'sqlite3';
const { Database } = sqlite3.verbose();

const router: Router = Router();

const db = new Database('../database/db.sqlite', (err: Error | null) => {
  if (err) {
    console.error('Error opening database:', err.message);
  }
});

// Define the /cities route to get all cities
router.get('/', (req: Request, res: Response) => {
  const sql = 'SELECT * FROM city';
  db.all(sql, [], (err: Error | null, rows: any[]) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    return res.json({
      message: 'success',
      data: rows
    });
  });
});

// Define the POST /cities route for creating a new city
router.post('/', (req: Request, res: Response): void => {
  const { name, region_id, population, description, x_coordinate, y_coordinate } = req.body;

  // Validate required fields
  if (!name || !region_id) {
    res.status(400).json({ error: 'Name and region_id are required' });
    return;
  }

  const insertCitySQL = `
    INSERT INTO city (name, region_id, population, description, x_coordinate, y_coordinate)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(insertCitySQL, [
    name,
    region_id,
    population || null,
    description || null,
    x_coordinate || 0.5,
    y_coordinate || 0.5
  ], function(err: Error | null) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    
    res.json({
      message: 'City created successfully',
      data: { 
        id: this.lastID,
        name,
        region_id,
        population,
        description,
        x_coordinate: x_coordinate || 0.5,
        y_coordinate: y_coordinate || 0.5
      }
    });
  });
});

// Route to get a specific city and its details by city ID
router.get('/:id', (req: Request, res: Response) => {
  const cityId = req.params.id;

  const sqlCity = `
    SELECT c.id, c.name, c.population, c.description, c.x_coordinate, c.y_coordinate,
           r.id as region_id, r.name as region_name
    FROM city c
    JOIN region r ON c.region_id = r.id
    WHERE c.id = ?
  `;
  
  const sqlStadiums = `
    SELECT s.id, s.name, s.type, s.capacity
    FROM stadium s
    WHERE s.city_id = ?
  `;

  const sqlGymLeaders = `
    SELECT g.id, g.badge, g.type, g.trainer_id, t.fname, t.lname
    FROM gym_leader g
    JOIN trainer t ON g.trainer_id = t.id
    WHERE g.city_id = ?
  `;

  db.get(sqlCity, [cityId], (err: Error | null, cityRow: any) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    if (!cityRow) {
      return res.status(404).json({ message: 'City not found' });
    }
    
    db.all(sqlStadiums, [cityId], (err2: Error | null, stadiumRows: any[]) => {
      if (err2) {
        return res.status(400).json({ error: err2.message });
      }
      
      db.all(sqlGymLeaders, [cityId], (err3: Error | null, gymLeaderRows: any[]) => {
        if (err3) {
          return res.status(400).json({ error: err3.message });
        }
        
        const city = {
          id: cityRow.id,
          name: cityRow.name,
          population: cityRow.population,
          description: cityRow.description,
          x_coordinate: cityRow.x_coordinate,
          y_coordinate: cityRow.y_coordinate,
          region: {
            id: cityRow.region_id,
            name: cityRow.region_name
          },
          stadiums: stadiumRows.map(stadium => ({
            id: stadium.id,
            name: stadium.name,
            type: stadium.type,
            capacity: stadium.capacity
          })),
          gymLeaders: gymLeaderRows.map(leader => ({
            id: leader.id,
            trainer_id: leader.trainer_id,
            name: `${leader.fname} ${leader.lname || ''}`,
            badge: leader.badge,
            type: leader.type
          }))
        };
        
        return res.json({
          message: 'success',
          data: city
        });
      });
    });
  });
});

// Route to update a city by ID
router.put('/:id', (req: Request, res: Response) => {
  const cityId = req.params.id;
  const { name, region_id, population, description, x_coordinate, y_coordinate, stadiums, gymLeaders } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Update city data
    const updateCitySQL = `
      UPDATE city
      SET name = ?,
          region_id = ?,
          population = ?,
          description = ?,
          x_coordinate = ?,
          y_coordinate = ?
      WHERE id = ?
    `;

    db.run(updateCitySQL, [
      name,
      region_id,
      population,
      description,
      x_coordinate,
      y_coordinate,
      cityId
    ], function(err: Error | null) {
      if (err) {
        db.run('ROLLBACK');
        return res.status(400).json({ error: err.message });
      }

      // Handle stadiums
      if (stadiums && Array.isArray(stadiums)) {
        // First, delete existing stadiums for this city
        db.run('DELETE FROM stadium WHERE city_id = ?', [cityId], function(err: Error | null) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: err.message });
          }

          // Insert new stadiums
          const insertStadiumSQL = 'INSERT INTO stadium (name, type, capacity, city_id) VALUES (?, ?, ?, ?)';
          
          for (const stadium of stadiums) {
            db.run(insertStadiumSQL, [
              stadium.name,
              stadium.type || null,
              stadium.capacity || null,
              cityId
            ], function(err: Error | null) {
              if (err) {
                db.run('ROLLBACK');
                return res.status(400).json({ error: err.message });
              }
            });
          }
        });
      }

      // Handle gym leaders
      if (gymLeaders && Array.isArray(gymLeaders)) {
        console.log('Processing gym leaders:', gymLeaders);
        
        // First, delete existing gym leaders for this city
        db.run('DELETE FROM gym_leader WHERE city_id = ?', [cityId], function(err: Error | null) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: err.message });
          }

          // Insert new gym leaders
          const insertGymLeaderSQL = 'INSERT INTO gym_leader (trainer_id, badge, type, city_id) VALUES (?, ?, ?, ?)';
          
          for (const leader of gymLeaders) {
            // Ensure trainer_id is a number
            const trainerId = Number(leader.trainer_id);
            if (isNaN(trainerId)) {
              db.run('ROLLBACK');
              return res.status(400).json({ 
                error: `Invalid trainer_id: ${leader.trainer_id} is not a number`,
                leader: leader
              });
            }
            
            db.run(insertGymLeaderSQL, [
              trainerId,
              leader.badge || null,
              leader.type,
              cityId
            ], function(err: Error | null) {
              if (err) {
                db.run('ROLLBACK');
                return res.status(400).json({ error: err.message });
              }
            });
          }
        });
      }

      // Commit transaction
      db.run('COMMIT', function(err: Error | null) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: err.message });
        }
        return res.json({
          message: 'City updated successfully',
          data: { id: cityId }
        });
      });
    });
  });
});

export default router;