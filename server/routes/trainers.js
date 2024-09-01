const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

const db = new sqlite3.Database('../database/db.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    }
});

// Define the /trainers route
router.get('/', (req, res) => {
    const sql = `
        SELECT 
            trainer.*, 
            home_region.name as region_name,
            CASE
                WHEN grand_champion.trainer_id IS NOT NULL THEN 'Grand Champion'
                WHEN gym_leader.id IS NOT NULL THEN CONCAT(type, ' Leader of ', city.name)
                WHEN elite_four.id IS NOT NULL THEN CONCAT('Elite Four of ', elite_region.name)
                WHEN champion.id IS NOT NULL THEN CONCAT('Champion of ', champion_region.name)
                ELSE 'None'
            END as title
        FROM trainer 
        LEFT JOIN region as home_region ON trainer.region_id = home_region.id
        LEFT JOIN gym_leader ON trainer.id = gym_leader.trainer_id
        LEFT JOIN city ON gym_leader.city_id = city.id
        LEFT JOIN elite_four ON trainer.id = elite_four.trainer_id
        LEFT JOIN region as elite_region ON elite_four.region_id = elite_region.id
        LEFT JOIN champion ON trainer.id = champion.trainer_id
        LEFT JOIN region as champion_region ON champion.region_id = champion_region.id
        LEFT JOIN grand_champion ON trainer.id = grand_champion.trainer_id
        WHERE trainer.active_status = 1 
        ORDER BY trainer.pwtr_rating DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }

        // Add rank to each row
        rows.forEach((row, index) => {
            row.rank = index + 1;
        });

        res.json({
            message: 'success',
            data: rows
        });
    });
});

// Define the /trainers/inactive route
router.get('/inactive', (req, res) => {
    const sql = 'SELECT * FROM trainer WHERE active_status = 0 ORDER BY pwtr_rating DESC';
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

// Define the /trainer/:id route
router.get('/:id', (req, res) => {
    const trainerId = req.params.id;

    const sqlTrainer = `
        WITH ranked_trainers AS (
            SELECT 
                id, 
                RANK() OVER (ORDER BY pwtr_rating DESC) AS rank
            FROM trainer
        )
        SELECT 
            trainer.*, 
            home_region.name AS region_name,
            ranked_trainers.rank AS rank,
            CASE
                WHEN grand_champion.trainer_id IS NOT NULL THEN 'Grand Champion'
                WHEN gym_leader.id IS NOT NULL THEN CONCAT(type, ' Leader of ', city.name)
                WHEN elite_four.id IS NOT NULL THEN CONCAT('Elite Four of ', elite_region.name)
                WHEN champion.id IS NOT NULL THEN CONCAT('Champion of ', champion_region.name)
                ELSE 'None'
            END AS title
        FROM trainer 
        LEFT JOIN region AS home_region ON trainer.region_id = home_region.id
        LEFT JOIN gym_leader ON trainer.id = gym_leader.trainer_id
        LEFT JOIN city ON gym_leader.city_id = city.id
        LEFT JOIN elite_four ON trainer.id = elite_four.trainer_id
        LEFT JOIN region AS elite_region ON elite_four.region_id = elite_region.id
        LEFT JOIN champion ON trainer.id = champion.trainer_id
        LEFT JOIN region AS champion_region ON champion.region_id = champion_region.id
        LEFT JOIN grand_champion ON trainer.id = grand_champion.trainer_id
        LEFT JOIN ranked_trainers ON trainer.id = ranked_trainers.id
        WHERE trainer.id = ?
    `;

    const sqlHometowns = `
        SELECT 
            city.id as city_id,
            city.name as city_name,
            city.region_id as region_id,
            region.name as region_name
        FROM trainer_hometown 
        JOIN city ON trainer_hometown.city_id = city.id
        JOIN region ON city.region_id = region.id
        WHERE trainer_hometown.trainer_id = ?
    `;

    const sqlRating = `
        SELECT * FROM rating 
        WHERE trainer_id = ? 
        ORDER BY year DESC 
        LIMIT 1
    `;

    const sqlFormatRating = `
        SELECT * FROM format_rating WHERE rating_id = ?
    `;

    const sqlFieldRating = `
        SELECT * FROM field_rating WHERE rating_id = ?
    `;

    const sqlMentalRating = `
        SELECT * FROM mental_rating WHERE rating_id = ?
    `;

    db.get(sqlTrainer, [trainerId], (err, trainerRow) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }

        if (!trainerRow) {
            res.status(404).json({ error: "Trainer not found" });
            return;
        }

        db.get(sqlRating, [trainerId], (err, ratingRow) => {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }

            if (!ratingRow) {
                // No rating found, return nulls or empty objects for rating fields
                res.json({
                    message: 'success',
                    data: {
                        trainer: trainerRow,
                        rating: null,
                        format_rating: null,
                        field_rating: null,
                        mental_rating: null,
                        hometowns: []
                    }
                });
                return;
            }

            const ratingId = ratingRow.id;

            db.get(sqlFormatRating, [ratingId], (err, formatRatingRow) => {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }

                db.get(sqlFieldRating, [ratingId], (err, fieldRatingRow) => {
                    if (err) {
                        res.status(400).json({ error: err.message });
                        return;
                    }

                    db.get(sqlMentalRating, [ratingId], (err, mentalRatingRow) => {
                        if (err) {
                            res.status(400).json({ error: err.message });
                            return;
                        }

                        db.all(sqlHometowns, [trainerId], (err, hometownsRows) => {
                            if (err) {
                                res.status(400).json({ error: err.message });
                                return;
                            }

                            res.json({
                                message: 'success',
                                data: {
                                    trainer: trainerRow,
                                    rating: ratingRow,
                                    format_rating: formatRatingRow,
                                    field_rating: fieldRatingRow,
                                    mental_rating: mentalRatingRow,
                                    hometowns: hometownsRows // Include hometowns
                                }
                            });
                        });
                    });
                });
            });
        });
    });
});


// Define the /trainers/:id/pokemon route
router.get('/:id/pokemon', (req, res) => {
    const trainerId = req.params.id;

    const sql = `
        SELECT * FROM pokemon WHERE trainer_id = ?
    `;

    db.all(sql, [trainerId], (err, rows) => {
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

// Define the POST /trainers route for creating a new trainer
router.post('/', (req, res) => {
    const {
        fname, lname, region_id, birthdate, pwtr_rating, peak_rating, peak_rank, active_status
    } = req.body;

    const sqlInsertTrainer = `
        INSERT INTO trainer (fname, lname, region_id, birthdate, pwtr_rating, peak_rating, peak_rank, active_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sqlInsertTrainer, [fname, lname, region_id, birthdate, pwtr_rating, peak_rating, peak_rank, active_status], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }

        res.json({
            message: 'success',
            data: {
                id: this.lastID,
                fname,
                lname,
                region_id,
                birthdate,
                pwtr_rating,
                peak_rating,
                peak_rank,
                active_status
            }
        });
    });
});

// Define the PUT /trainers/:id route for updating a trainer
router.put('/:id', (req, res) => {
    const trainerId = req.params.id;
    const {
        fname, lname, region_id, birthdate, pwtr_rating, peak_rating, peak_rank, active_status
    } = req.body;

    const sqlUpdateTrainer = `
        UPDATE trainer
        SET fname = ?, lname = ?, region_id = ?, birthdate = ?, pwtr_rating = ?, peak_rating = ?, peak_rank = ?, active_status = ?
        WHERE id = ?
    `;

    db.run(sqlUpdateTrainer, [fname, lname, region_id, birthdate, pwtr_rating, peak_rating, peak_rank, active_status, trainerId], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }

        res.json({
            message: 'success',
            data: {
                id: trainerId,
                fname,
                lname,
                region_id,
                birthdate,
                pwtr_rating,
                peak_rating,
                peak_rank,
                active_status
            },
            changes: this.changes
        });
    });
});

// Define the /trainers/:id/field_ratings PUT route
router.put('/:id/field_ratings', (req, res) => {
    const fieldRatingId = req.body.id;
    const updatedFieldRatings = req.body; 

    const sqlUpdate = `
        UPDATE field_rating
        SET 
            pumped_field_rating = ?,
            windy_field_rating = ?,
            corrosive_field_rating = ?,
            desert_field_rating = ?,
            cliffs_field_rating = ?,
            swarm_field_rating = ?,
            haunted_field_rating = ?,
            factory_field_rating = ?,
            infernal_field_rating = ?,
            watersurface_field_rating = ?,
            grassy_field_rating = ?,
            electirized_field_rating = ?,
            psychic_field_rating = ?,
            icy_field_rating = ?,
            draconidden_field_rating = ?,
            darkcavern_field_rating = ?,
            misty_field_rating = ?,
            city_field_rating = ?,
            mirror_field_rating = ?,
            concertvenue_field_rating = ?,
            crystalcavern_field_rating = ?,
            waterfall_field_rating = ?,
            volcanic_field_rating = ?,
            forest_field_rating = ?,
            flowergarden_field_rating = ?,
            swamp_field_rating = ?,
            bewitchedwoods_field_rating = ?,
            murkwatersurface_field_rating = ?,
            smoky_field_rating = ?,
            frozendimensional_field_rating = ?,
            valleyofwinds_field_rating = ?,
            losthotel_field_rating = ?,
            taiga_field_rating = ?,
            ashenbeach_field_rating = ?,
            underwater_field_rating = ?,
            starlightarena_field_rating = ?,
            snowymountain_field_rating = ?,
            bigtop_field_rating = ?,
            backalley_field_rating = ?,
            neutral_field_rating = ?,
            chess_field_rating = ?,
            deepearth_field_rating = ?,
            inverse_field_rating = ?,
            glitch_field_rating = ?,
            dimensional_field_rating = ?,
            colosseum_field_rating = ?,
            trickster_field_rating = ?,
            fantasy_field_rating = ?,
            rainbow_field_rating = ?,
            newworld_field_rating = ?
        WHERE id = ?
    `;

    const values = [
        updatedFieldRatings.pumped_field_rating,
        updatedFieldRatings.windy_field_rating,
        updatedFieldRatings.corrosive_field_rating,
        updatedFieldRatings.desert_field_rating,
        updatedFieldRatings.cliffs_field_rating,
        updatedFieldRatings.swarm_field_rating,
        updatedFieldRatings.haunted_field_rating,
        updatedFieldRatings.factory_field_rating,
        updatedFieldRatings.infernal_field_rating,
        updatedFieldRatings.watersurface_field_rating,
        updatedFieldRatings.grassy_field_rating,
        updatedFieldRatings.electirized_field_rating,
        updatedFieldRatings.psychic_field_rating,
        updatedFieldRatings.icy_field_rating,
        updatedFieldRatings.draconidden_field_rating,
        updatedFieldRatings.darkcavern_field_rating,
        updatedFieldRatings.misty_field_rating,
        updatedFieldRatings.city_field_rating,
        updatedFieldRatings.mirror_field_rating,
        updatedFieldRatings.concertvenue_field_rating,
        updatedFieldRatings.crystalcavern_field_rating,
        updatedFieldRatings.waterfall_field_rating,
        updatedFieldRatings.volcanic_field_rating,
        updatedFieldRatings.forest_field_rating,
        updatedFieldRatings.flowergarden_field_rating,
        updatedFieldRatings.swamp_field_rating,
        updatedFieldRatings.bewitchedwoods_field_rating,
        updatedFieldRatings.murkwatersurface_field_rating,
        updatedFieldRatings.smoky_field_rating,
        updatedFieldRatings.frozendimensional_field_rating,
        updatedFieldRatings.valleyofwinds_field_rating,
        updatedFieldRatings.losthotel_field_rating,
        updatedFieldRatings.taiga_field_rating,
        updatedFieldRatings.ashenbeach_field_rating,
        updatedFieldRatings.underwater_field_rating,
        updatedFieldRatings.starlightarena_field_rating,
        updatedFieldRatings.snowymountain_field_rating,
        updatedFieldRatings.bigtop_field_rating,
        updatedFieldRatings.backalley_field_rating,
        updatedFieldRatings.neutral_field_rating,
        updatedFieldRatings.chess_field_rating,
        updatedFieldRatings.deepearth_field_rating,
        updatedFieldRatings.inverse_field_rating,
        updatedFieldRatings.glitch_field_rating,
        updatedFieldRatings.dimensional_field_rating,
        updatedFieldRatings.colosseum_field_rating,
        updatedFieldRatings.trickster_field_rating,
        updatedFieldRatings.fantasy_field_rating,
        updatedFieldRatings.rainbow_field_rating,
        updatedFieldRatings.newworld_field_rating,
        fieldRatingId
    ];

    db.run(sqlUpdate, values, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'success', data: updatedFieldRatings, changes: this.changes });
    });
});

// Define the PUT /trainers/:id/mental_ratings route
router.put('/:id/mental_ratings', (req, res) => {
    const mentalRatingId = req.body.id; 
    const updatedMentalRatings = req.body;

    const sqlUpdate = `
        UPDATE mental_rating
        SET 
            planning_rating = ?,
            risk_rating = ?,
            prediction_rating = ?,
            clutch_rating = ?,
            consistency_rating = ?,
            motivation_rating = ?,
            pokemon_knowledge_rating = ?,
            trainer_knowledge_rating = ?,
            training_rating = ?,
            conditioning_rating = ?,
            determination_rating = ?,
            facilities_rating = ?,
            attack_rating = ?,
            defense_rating = ?,
            speed_rating = ?,
            gimmick_rating = ?
        WHERE id = ?
    `;

    const values = [
        updatedMentalRatings.planning_rating,
        updatedMentalRatings.risk_rating,
        updatedMentalRatings.prediction_rating,
        updatedMentalRatings.clutch_rating,
        updatedMentalRatings.consistency_rating,
        updatedMentalRatings.motivation_rating,
        updatedMentalRatings.pokemon_knowledge_rating,
        updatedMentalRatings.trainer_knowledge_rating,
        updatedMentalRatings.training_rating,
        updatedMentalRatings.conditioning_rating,
        updatedMentalRatings.determination_rating,
        updatedMentalRatings.facilities_rating,
        updatedMentalRatings.attack_rating,
        updatedMentalRatings.defense_rating,
        updatedMentalRatings.speed_rating,
        updatedMentalRatings.gimmick_rating,
        mentalRatingId
    ];

    db.run(sqlUpdate, values, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'success', data: updatedMentalRatings, changes: this.changes });
    });
});

// Define the PUT /trainers/:id/format_ratings route
router.put('/:id/format_ratings', (req, res) => {
    const formatRatingId = req.body.id; 
    const updatedFormatRatings = req.body; 

    const sqlUpdate = `
        UPDATE format_rating
        SET 
            singles_rating = ?,
            doubles_rating = ?,
            tag_battle_rating = ?,
            battle_factory_rating = ?,
            rotation_rating = ?,
            sixes_rating = ?,
            threes_rating = ?,
            twos_rating = ?
        WHERE id = ?
    `;

    const values = [
        updatedFormatRatings.singles_rating,
        updatedFormatRatings.doubles_rating,
        updatedFormatRatings.tag_battle_rating,
        updatedFormatRatings.battle_factory_rating,
        updatedFormatRatings.rotation_rating,
        updatedFormatRatings.sixes_rating,
        updatedFormatRatings.threes_rating,
        updatedFormatRatings.twos_rating,
        formatRatingId
    ];

    db.run(sqlUpdate, values, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'success', data: updatedFormatRatings, changes: this.changes });
    });
});



module.exports = router;
