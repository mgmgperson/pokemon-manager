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

// Define the PUT /pokemon/:id route for updating a Pokémon
router.put('/:id', (req, res) => {
    const pokemonId = req.params.id;
    const {
        species_id, pokemon_id, level,
        ot_name, ot_id,
        nickname, attack, defense, special_attack, special_defense, speed, hp, happiness,
        iv_hp, iv_attack, iv_defense, iv_special_attack, iv_special_defense, iv_speed,
        ev_hp, ev_attack, ev_defense, ev_special_attack, ev_special_defense, ev_speed,
        nature_id, ability_id,
        gender, shiny, pokeball_id, held_item_id, experience_points, is_gigantamax, is_mega,
        date_met_at, location_met_at, level_met_at,
        current_hp, current_strength, status_id,
        battles_won, battles_lost, kills, deaths,
        training_efficiency
    } = req.body;

    const sqlUpdatePokemon = `
        UPDATE pokemon
        SET species_id = ?, pokemon_id = ?, level = ?, 
            ot_name = ?, ot_id = ?, 
            nickname = ?, attack = ?, defense = ?, special_attack = ?, special_defense = ?, speed = ?, hp = ?, happiness = ?, 
            iv_hp = ?, iv_attack = ?, iv_defense = ?, iv_special_attack = ?, iv_special_defense = ?, iv_speed = ?, 
            ev_hp = ?, ev_attack = ?, ev_defense = ?, ev_special_attack = ?, ev_special_defense = ?, ev_speed = ?, 
            nature_id = ?, ability_id = ?, 
            gender = ?, shiny = ?, pokeball_id = ?, held_item_id = ?, experience_points = ?, is_gigantamax = ?, is_mega = ?, 
            date_met_at = ?, location_met_at = ?, level_met_at = ?, 
            current_hp = ?, current_strength = ?, status_id = ?, 
            battles_won = ?, battles_lost = ?, kills = ?, deaths = ?, 
            training_efficiency = ?
        WHERE id = ?
    `;

    db.run(sqlUpdatePokemon, [
        species_id, pokemon_id, level,
        ot_name, ot_id,
        nickname, attack, defense, special_attack, special_defense, speed, hp, happiness,
        iv_hp, iv_attack, iv_defense, iv_special_attack, iv_special_defense, iv_speed,
        ev_hp, ev_attack, ev_defense, ev_special_attack, ev_special_defense, ev_speed,
        nature_id, ability_id,
        gender, shiny, pokeball_id, held_item_id, experience_points, is_gigantamax, is_mega,
        date_met_at, location_met_at, level_met_at,
        current_hp, current_strength, status_id,
        battles_won, battles_lost, kills, deaths,
        training_efficiency,
        pokemonId
    ], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }

        res.json({
            message: 'success',
            data: req.body,
            changes: this.changes
        });
    });
});



module.exports = router;
