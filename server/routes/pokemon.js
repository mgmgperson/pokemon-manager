const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

const db = new sqlite3.Database('../database/db.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    }
});

// Define the /:id route to get a Pokémon by its ID
router.get('/:id', (req, res) => {
    const pokemonId = req.params.id;
    
    const sql = `
        SELECT 
            p.*, 
            t.fname as trainer_fname, 
            t.lname as trainer_lname
        FROM 
            pokemon p
        JOIN 
            trainer t ON p.trainer_id = t.id
        WHERE 
            p.id = ?
    `;
    
    db.get(sql, [pokemonId], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }

        if (!row) {
            res.status(404).json({ message: 'Pokémon not found' });
            return;
        }

        res.json({
            message: 'success',
            data: row
        });
    });
});

module.exports = router;
