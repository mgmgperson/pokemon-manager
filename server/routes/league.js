const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Open the database
const db = new sqlite3.Database('../database/db.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    }
});

// Route to get the grand champion, champions, and elite four across all regions
router.get('/', (req, res) => {
    const sqlGrandChampion = `
        SELECT t.id, t.fname, t.lname
        FROM grand_champion gc
        JOIN trainer t ON gc.trainer_id = t.id
    `;

    const sqlChampions = `
        SELECT t.id, r.name as region_name, t.fname, t.lname
        FROM champion ch
        JOIN trainer t ON ch.trainer_id = t.id
        JOIN region r ON ch.region_id = r.id
    `;

    const sqlEliteFour = `
        SELECT t.id, r.name as region_name, t.fname, t.lname
        FROM elite_four ef
        JOIN trainer t ON ef.trainer_id = t.id
        JOIN region r ON ef.region_id = r.id
    `;

    // Execute SQL queries in sequence
    db.get(sqlGrandChampion, [], (err, grandChampionRow) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }

        db.all(sqlChampions, [], (err, championRows) => {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }

            db.all(sqlEliteFour, [], (err, eliteFourRows) => {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }

                // Process data to match expected structure

                // Grand Champion - Single object with id and name
                const grandChampion = grandChampionRow ? {
                    id: grandChampionRow.id,
                    name: `${grandChampionRow.fname} ${grandChampionRow.lname}`
                } : null;

                // Champions - Array of objects with region, id, and name
                const champions = championRows.map(row => ({
                    region: row.region_name,
                    id: row.id,
                    name: `${row.fname} ${row.lname}`
                }));

                // Elite Four - Array of objects with region and array of elite four members with id and name
                const eliteFourMap = {};
                eliteFourRows.forEach(row => {
                    if (!eliteFourMap[row.region_name]) {
                        eliteFourMap[row.region_name] = [];
                    }
                    eliteFourMap[row.region_name].push({
                        id: row.id,
                        name: `${row.fname} ${row.lname}`
                    });
                });

                const eliteFour = Object.keys(eliteFourMap).map(region => ({
                    region: region,
                    eliteFour: eliteFourMap[region]
                }));

                // Final response
                res.json({
                    message: 'success',
                    data: {
                        grandChampion,
                        champions,
                        eliteFour
                    }
                });
            });
        });
    });
});

module.exports = router;