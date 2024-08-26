const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

const db = new sqlite3.Database('../database/db.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    }
});

// Define the /regions route to get all regions
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM region';
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: 'success',
            data: rows
        });
    });
});

// Route to get a specific region and its cities by region ID,
router.get('/:id', (req, res) => {
    const regionId = req.params.id;

    const sqlRegion = `
        SELECT r.name as region_name, r.population as region_population, c.name as city_name, c.population as city_population, c.x_coordinate as x_coordinate, c.y_coordinate as y_coordinate
        FROM region r
        LEFT JOIN city c ON r.id = c.region_id
        WHERE r.id = ?
        ORDER BY c.population DESC
    `;
    const sqlChampion = `
        SELECT t.fname, t.lname
        FROM champion ch
        JOIN trainer t ON ch.trainer_id = t.id
        WHERE ch.region_id = ?
    `;

    const sqlEliteFour = `
        SELECT t.fname, t.lname
        FROM elite_four ef
        JOIN trainer t ON ef.trainer_id = t.id
        WHERE ef.region_id = ?
    `;

    const sqlGymLeaders = `
        SELECT t.fname, t.lname, g.type, c.name as city_name
        FROM gym_leader g
        JOIN trainer t ON g.trainer_id = t.id
        JOIN city c ON g.city_id = c.id
        WHERE c.region_id = ?
    `;

    db.all(sqlRegion, [regionId], (err, regionRows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }

        db.get(sqlChampion, [regionId], (err, championRow) => {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }

            db.all(sqlEliteFour, [regionId], (err, eliteFourRows) => {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }

                db.all(sqlGymLeaders, [regionId], (err, gymLeaderRows) => {
                    if (err) {
                        res.status(400).json({ error: err.message });
                        return;
                    }

                    const region = {
                        name: regionRows[0].region_name,
                        population: regionRows[0].region_population,
                        cities: regionRows.map(row => ({
                            name: row.city_name,
                            population: row.city_population,
                            x_coordinate: row.x_coordinate,
                            y_coordinate: row.y_coordinate
                        })),
                        champion: championRow ? `${championRow.fname} ${championRow.lname || ''}` : null,
                        eliteFour: eliteFourRows.map(row => `${row.fname} ${row.lname || ''}`),
                        gymLeaders: gymLeaderRows.map(row => ({
                            name: `${row.fname} ${row.lname || ''}`,
                            type: row.type,
                            city_name: row.city_name
                        }))
                    };

                    res.json({
                        message: 'success',
                        data: region
                    });
                });
            });
        });
    });
});


module.exports = router;

