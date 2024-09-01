import os
import sqlite3

# Connect to the SQLite database
script_dir = os.path.dirname(__file__)
conn = sqlite3.connect(os.path.join(script_dir, '..', 'db.sqlite'))
cursor = conn.cursor()

# Check for trainers without associated ratings
cursor.execute("""
    SELECT id FROM trainer
    WHERE id NOT IN (SELECT DISTINCT trainer_id FROM rating)
""")
trainers_without_ratings = cursor.fetchall()

# Iterate through each trainer without ratings
for trainer_id_tuple in trainers_without_ratings:
    trainer_id = trainer_id_tuple[0]

    # Insert a new rating for the trainer
    cursor.execute("""
        INSERT INTO rating (trainer_id, year, overall_rating, typing_rating, mixed_rating, special_rating)
        VALUES (?, 2036, NULL, NULL, NULL, NULL)
    """, (trainer_id,))
    
    # Get the ID of the newly created rating
    rating_id = cursor.lastrowid

    # Insert blank format_rating associated with the rating
    cursor.execute("""
        INSERT INTO format_rating (rating_id, singles_rating, doubles_rating, tag_battle_rating, 
        battle_factory_rating, rotation_rating, sixes_rating, threes_rating, twos_rating)
        VALUES (?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    """, (rating_id,))

    # Insert blank field_rating associated with the rating
    cursor.execute("""
        INSERT INTO field_rating (rating_id, pumped_field_rating, windy_field_rating, corrosive_field_rating, 
        desert_field_rating, cliffs_field_rating, swarm_field_rating, haunted_field_rating, factory_field_rating, 
        infernal_field_rating, watersurface_field_rating, grassy_field_rating, electirized_field_rating, psychic_field_rating, 
        icy_field_rating, draconidden_field_rating, darkcavern_field_rating, misty_field_rating, city_field_rating, 
        mirror_field_rating, concertvenue_field_rating, crystalcavern_field_rating, waterfall_field_rating, 
        volcanic_field_rating, forest_field_rating, flowergarden_field_rating, swamp_field_rating, 
        bewitchedwoods_field_rating, murkwatersurface_field_rating, smoky_field_rating, frozendimensional_field_rating, 
        valleyofwinds_field_rating, losthotel_field_rating, taiga_field_rating, ashenbeach_field_rating, 
        underwater_field_rating, starlightarena_field_rating, snowymountain_field_rating, bigtop_field_rating, 
        backalley_field_rating, neutral_field_rating, chess_field_rating, deepearth_field_rating, inverse_field_rating, 
        glitch_field_rating, dimensional_field_rating, colosseum_field_rating, trickster_field_rating, fantasy_field_rating, 
        rainbow_field_rating, newworld_field_rating)
        VALUES (?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    """, (rating_id,))

    # Insert blank mental_rating associated with the rating
    cursor.execute("""
        INSERT INTO mental_rating (rating_id, planning_rating, risk_rating, prediction_rating, clutch_rating, 
        consistency_rating, motivation_rating, pokemon_knowledge_rating, trainer_knowledge_rating, training_rating, 
        conditioning_rating, determination_rating, facilities_rating, attack_rating, defense_rating, 
        speed_rating, gimmick_rating)
        VALUES (?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
    """, (rating_id,))

# Commit the transaction
conn.commit()

# Close the database connection
conn.close()
