import { Router, Request, Response } from 'express';
import { getActiveDB } from '../services/dbManager';

const router: Router = Router();


// Define the /regions route to get all regions
router.get('/', (req: Request, res: Response) => {
  const db = getActiveDB();
  const sql = 'SELECT * FROM region';
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

// Route to get a specific region and its cities by region ID
router.get('/:id', (req: Request, res: Response) => {
  const db = getActiveDB();
  const regionId = req.params.id;

  const sqlRegion = `
    SELECT r.name as region_name, r.population as region_population, 
           c.id as city_id, c.name as city_name, c.population as city_population, 
           c.x_coordinate as x_coordinate, c.y_coordinate as y_coordinate
    FROM region r
    LEFT JOIN city c ON r.id = c.region_id
    WHERE r.id = ?
    ORDER BY c.population DESC
  `;
  const sqlLocations = `
    SELECT l.*,
           GROUP_CONCAT(DISTINCT t.name) as terrain_types
    FROM location l
    LEFT JOIN location_terrain lt ON l.id = lt.location_id
    LEFT JOIN terrain t ON lt.terrain_id = t.id
    WHERE l.region_id = ?
    GROUP BY l.id
  `;
  const sqlChampion = `
    SELECT t.id as trainer_id, t.fname, t.lname
    FROM champion ch
    JOIN trainer t ON ch.trainer_id = t.id
    WHERE ch.region_id = ?
  `;
  const sqlEliteFour = `
    SELECT t.id as trainer_id, t.fname, t.lname
    FROM elite_four ef
    JOIN trainer t ON ef.trainer_id = t.id
    WHERE ef.region_id = ?
  `;
  const sqlGymLeaders = `
    SELECT t.id as trainer_id, t.fname, t.lname, g.type, c.id as city_id, c.name as city_name
    FROM gym_leader g
    JOIN trainer t ON g.trainer_id = t.id
    JOIN city c ON g.city_id = c.id
    WHERE c.region_id = ?
  `;

  db.all(sqlRegion, [regionId], (err: Error | null, regionRows: any[]) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!regionRows || regionRows.length === 0) {
      return res.status(404).json({ message: 'Region not found' });
    }
    
    db.all(sqlLocations, [regionId], (err2: Error | null, locationRows: any[]) => {
      if (err2) {
        return res.status(400).json({ error: err2.message });
      }

      // Process locations data
      const processedLocations = locationRows.map(loc => ({
        ...loc,
        terrain_types: loc.terrain_types ? loc.terrain_types.split(',') : [],
        area_coordinates: loc.area_coordinates ? JSON.parse(loc.area_coordinates) : null
      }));

      db.get(sqlChampion, [regionId], (err3: Error | null, championRow: any) => {
        if (err3) {
          return res.status(400).json({ error: err3.message });
        }
        db.all(sqlEliteFour, [regionId], (err4: Error | null, eliteFourRows: any[]) => {
          if (err4) {
            return res.status(400).json({ error: err4.message });
          }
          db.all(sqlGymLeaders, [regionId], (err5: Error | null, gymLeaderRows: any[]) => {
            if (err5) {
              return res.status(400).json({ error: err5.message });
            }

            const region = {
              name: regionRows[0].region_name,
              population: regionRows[0].region_population,
              cities: regionRows.map((row) => ({
                id: row.city_id,
                name: row.city_name,
                population: row.city_population,
                x_coordinate: row.x_coordinate,
                y_coordinate: row.y_coordinate
              })),
              locations: processedLocations,
              champion: championRow
                ? {
                    id: championRow.trainer_id,
                    name: `${championRow.fname} ${championRow.lname || ''}`
                  }
                : null,
              eliteFour: eliteFourRows.map(
                (row) => ({
                  id: row.trainer_id,
                  name: `${row.fname} ${row.lname || ''}`
                })
              ),
              gymLeaders: gymLeaderRows.map((row) => ({
                id: row.trainer_id,
                name: `${row.fname} ${row.lname || ''}`,
                type: row.type,
                city_id: row.city_id,
                city_name: row.city_name
              })),
            };

            return res.json({
              message: 'success',
              data: region,
            });
          });
        });
      });
    });
  });
});

export default router;
