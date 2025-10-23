import { Router, Request, Response } from 'express';
import { getActiveDB } from '../services/dbManager';

const router: Router = Router();


// Get all locations (optionally filtered by region)
router.get('/', (req: Request, res: Response) => {
    const db = getActiveDB();
    const regionId = req.query.region_id;
    
    let sql = `
        SELECT l.*,
               r.name as region_name,
               pl.name as parent_location_name
        FROM location l
        LEFT JOIN region r ON l.region_id = r.id
        LEFT JOIN location pl ON l.parent_location_id = pl.id
    `;

    const params: any[] = [];
    if (regionId) {
        sql += ' WHERE l.region_id = ?';
        params.push(regionId);
    }

    sql += ' ORDER BY l.id';

    db.all(sql, params, (err: Error | null, rows: any[]) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        // Get terrain details for each location
        const locationPromises = rows.map(location => {
            return new Promise((resolve) => {
                const terrainsSql = `
                    SELECT 
                        t.id as terrain_id,
                        t.name,
                        t.code,
                        t.description,
                        lt.rate,
                        lt.field_id
                    FROM location_terrain lt
                    JOIN terrain t ON lt.terrain_id = t.id
                    WHERE lt.location_id = ?
                    ORDER BY t.name
                `;
                
                db.all(terrainsSql, [location.id], (err: Error | null, terrains: any[]) => {
                    if (err) {
                        console.error('Error fetching terrains for location:', err);
                        terrains = [];
                    }
                    
                    resolve({
                        ...location,
                        area_coordinates: location.area_coordinates ? JSON.parse(location.area_coordinates) : null,
                        terrains: terrains || []
                    });
                });
            });
        });

        Promise.all(locationPromises).then(processedRows => {
            return res.json({
                message: 'success',
                data: processedRows
            });
        });
    });
});

// Create a new location
router.post('/', (req: Request, res: Response): void => {
    const db = getActiveDB();
    const {
        name,
        region_id,
        description,
        population,
        area_coordinates,
        travel_time,
        parent_location_id,
        accessibility
    } = req.body;

    // Validate required fields
    if (!name || !region_id) {
        res.status(400).json({ error: 'Name and region_id are required' });
        return;
    }

    const insertLocationSQL = `
        INSERT INTO location (
            name,
            region_id,
            description,
            population,
            area_coordinates,
            travel_time,
            parent_location_id,
            accessibility
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertLocationSQL, [
        name,
        region_id,
        description || null,
        population || null,
        JSON.stringify(area_coordinates) || '[]',
        travel_time || 1,
        parent_location_id || null,
        accessibility || 1
    ], function(err: Error | null) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        
        res.json({
            message: 'Location created successfully',
            data: { 
                id: this.lastID,
                name,
                region_id,
                description,
                population,
                area_coordinates,
                travel_time: travel_time || 1,
                parent_location_id,
                accessibility: accessibility || 1
            }
        });
    });
});

// Batch update terrain rates for multiple locations
router.put('/terrain-rates', (req: Request, res: Response): void => {
    const db = getActiveDB();
    const { updates } = req.body; // Array of { location_id, terrain_id, rate }
    console.log('Received updates:', updates);
    
    if (!updates || !Array.isArray(updates)) {
        res.status(400).json({ error: 'Updates array is required' });
        return;
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        let completed = 0;
        let hasError = false;

        if (updates.length === 0) {
            db.run('COMMIT');
            res.json({ message: 'No updates to process' });
            return;
        }

        updates.forEach(({ location_id, terrain_id, rate }) => {
            if (rate === null || rate === 0) {
                // Remove the terrain association
                db.run(
                    'DELETE FROM location_terrain WHERE location_id = ? AND terrain_id = ?',
                    [location_id, terrain_id],
                    function(err: Error | null) {
                        if (err && !hasError) {
                            hasError = true;
                            db.run('ROLLBACK');
                            res.status(400).json({ error: err.message });
                            return;
                        }
                        
                        completed++;
                        if (completed === updates.length && !hasError) {
                            db.run('COMMIT');
                            res.json({ message: 'Terrain rates updated successfully' });
                        }
                    }
                );
            } else {
                // Get the default field_id from terrain table
                db.get(
                    'SELECT default_field_id FROM terrain WHERE id = ?',
                    [terrain_id],
                    function(err: Error | null, terrainRow: any) {
                        if (err && !hasError) {
                            hasError = true;
                            db.run('ROLLBACK');
                            res.status(400).json({ error: err.message });
                            return;
                        }

                        const fieldId = terrainRow?.default_field_id || null;
                        
                        // Insert or update the terrain association
                        db.run(
                            `INSERT OR REPLACE INTO location_terrain (location_id, terrain_id, rate, field_id) 
                             VALUES (?, ?, ?, ?)`,
                            [location_id, terrain_id, rate, fieldId],
                            function(err: Error | null) {
                                if (err && !hasError) {
                                    hasError = true;
                                    db.run('ROLLBACK');
                                    res.status(400).json({ error: err.message });
                                    return;
                                }
                                
                                completed++;
                                if (completed === updates.length && !hasError) {
                                    db.run('COMMIT');
                                    res.json({ message: 'Terrain rates updated successfully' });
                                }
                            }
                        );
                    }
                );
            }
        });
    });
});

// Get a specific location by ID
router.get('/:id', (req: Request, res: Response) => {
    const db = getActiveDB();
    const locationId = req.params.id;

    const sqlLocation = `
        SELECT l.*,
               r.name as region_name,
               pl.name as parent_location_name,
               GROUP_CONCAT(DISTINCT t.name) as terrain_types,
               (
                   SELECT GROUP_CONCAT(sl.name)
                   FROM location sl
                   WHERE sl.parent_location_id = l.id
               ) as sub_locations
        FROM location l
        LEFT JOIN region r ON l.region_id = r.id
        LEFT JOIN location pl ON l.parent_location_id = pl.id
        LEFT JOIN location_terrain lt ON l.id = lt.location_id
        LEFT JOIN terrain t ON lt.terrain_id = t.id
        WHERE l.id = ?
        GROUP BY l.id
    `;

    const terrainsSql = `
        SELECT 
            t.id as terrain_id,
            t.name,
            t.code,
            t.description,
            lt.rate,
            lt.field_id
        FROM location_terrain lt
        JOIN terrain t ON lt.terrain_id = t.id
        WHERE lt.location_id = ?
    `;

    const shopsSql = `
        WITH location_info AS (
            SELECT 
                l.id as location_id,
                l.region_id,
                COALESCE(
                    json_group_array(DISTINCT lt.terrain_id),
                    '[]'
                ) as terrain_ids
            FROM location l
            LEFT JOIN location_terrain lt ON l.id = lt.location_id
            WHERE l.id = ?
            GROUP BY l.id
        )
        SELECT DISTINCT
            s.*,
            CASE 
                WHEN s.scope = 'special' THEN 'Location-specific'
                WHEN s.scope = 'regional' THEN 'Regional'
            END as shop_type
        FROM shop s
        JOIN location_info li
        WHERE 
            (s.scope = 'special' AND s.location_id = li.location_id)
            OR
            (s.scope = 'regional' AND s.region_id = li.region_id AND s.terrain_id IN (
                SELECT value 
                FROM json_each(li.terrain_ids)
                WHERE value IS NOT NULL
            ))
    `;

    db.get(sqlLocation, [locationId], (err: Error | null, location: any) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        // Process arrays and JSON fields
        location.terrain_types = location.terrain_types ? location.terrain_types.split(',') : [];
        location.sub_locations = location.sub_locations ? location.sub_locations.split(',') : [];
        location.area_coordinates = location.area_coordinates ? JSON.parse(location.area_coordinates) : [];

        // Get terrains for this location
        db.all(terrainsSql, [locationId], (err: Error | null, terrains: any[]) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            location.terrains = terrains;

            // Get shops in this location
            db.all(shopsSql, [locationId], (err: Error | null, shops: any[]) => {
                if (err) {
                    return res.status(400).json({ error: err.message });
                }

                location.shops = shops;

                return res.json({
                    message: 'success',
                    data: location
                });
            });
        });
    });
});

// Get all sub-locations for a location
router.get('/:id/sub-locations', (req: Request, res: Response) => {
    const db = getActiveDB();
    const locationId = req.params.id;

    const sql = `
        SELECT l.*,
               GROUP_CONCAT(DISTINCT t.name) as terrain_types
        FROM location l
        LEFT JOIN location_terrain lt ON l.id = lt.location_id
        LEFT JOIN terrain t ON lt.terrain_id = t.id
        WHERE l.parent_location_id = ?
        GROUP BY l.id
    `;

    db.all(sql, [locationId], (err: Error | null, rows: any[]) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        // Process terrain_types and area_coordinates for each sub-location
        const processedRows = rows.map(row => ({
            ...row,
            terrain_types: row.terrain_types ? row.terrain_types.split(',') : [],
            area_coordinates: row.area_coordinates ? JSON.parse(row.area_coordinates) : null
        }));

        return res.json({
            message: 'success',
            data: processedRows
        });
    });
});

// Update a location by ID
router.put('/:id', (req: Request, res: Response) => {
    const db = getActiveDB();
    const locationId = req.params.id;
    const {
        name,
        region_id,
        description,
        population,
        area_coordinates,
        travel_time,
        parent_location_id,
        accessibility,
        terrains
    } = req.body;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Update location data
        const updateLocationSQL = `
            UPDATE location
            SET name = ?,
                region_id = ?,
                description = ?,
                population = ?,
                area_coordinates = ?,
                travel_time = ?,
                parent_location_id = ?,
                accessibility = ?
            WHERE id = ?
        `;

        db.run(updateLocationSQL, [
            name,
            region_id,
            description,
            population,
            JSON.stringify(area_coordinates),
            travel_time,
            parent_location_id,
            accessibility,
            locationId
        ], function(err: Error | null) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(400).json({ error: err.message });
            }

            // Handle terrains
            if (terrains && Array.isArray(terrains)) {
                // First, delete existing terrains for this location
                db.run('DELETE FROM location_terrain WHERE location_id = ?', [locationId], function(err: Error | null) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(400).json({ error: err.message });
                    }

                    // Insert new terrains
                    const insertTerrainSQL = 'INSERT INTO location_terrain (location_id, terrain_id, rate, field_id) VALUES (?, ?, ?, ?)';
                    
                    for (const terrain of terrains) {
                        db.run(insertTerrainSQL, [
                            locationId,
                            terrain.terrain_id,
                            terrain.rate,
                            terrain.field_id || null
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
                    message: 'Location updated successfully',
                    data: { id: locationId }
                });
            });
        });
    });
});

// Create a new location
router.post('/', (req: Request, res: Response) => {
    const db = getActiveDB();
    const {
        name,
        region_id,
        description,
        population,
        area_coordinates,
        travel_time,
        parent_location_id,
        accessibility,
        terrains
    } = req.body;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Insert location data
        const insertLocationSQL = `
            INSERT INTO location (
                name,
                region_id,
                description,
                population,
                area_coordinates,
                travel_time,
                parent_location_id,
                accessibility
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(insertLocationSQL, [
            name,
            region_id,
            description,
            population,
            JSON.stringify(area_coordinates),
            travel_time,
            parent_location_id,
            accessibility
        ], function(err: Error | null) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(400).json({ error: err.message });
            }

            const locationId = this.lastID;

            // Handle terrains
            if (terrains && Array.isArray(terrains)) {
                const insertTerrainSQL = `
                    INSERT INTO location_terrain (location_id, terrain_id, rate, field_id)
                    VALUES (?, ?, ?, ?)
                `;

                for (const terrain of terrains) {
                    db.run(insertTerrainSQL, [
                        locationId,
                        terrain.terrain_id,
                        terrain.rate,
                        terrain.field_id
                    ], (err: Error | null) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(400).json({ error: err.message });
                        }
                    });
                }
            }

            // Commit transaction
            db.run('COMMIT', function(err: Error | null) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(400).json({ error: err.message });
                }
                return res.json({
                    message: 'success',
                    data: { id: locationId }
                });
            });
        });
    });
});

// Get all terrains
router.get('/terrains/all', (req: Request, res: Response) => {
    const db = getActiveDB();
    const sql = 'SELECT * FROM terrain ORDER BY name';
    
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

export default router;
