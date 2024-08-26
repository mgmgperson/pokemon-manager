import sqlite3
import os

# Path to your database
script_dir = os.path.dirname(__file__)
conn = sqlite3.connect(os.path.join(script_dir, '..', 'db.sqlite'))

# Connect to the SQLite database
cursor = conn.cursor()

# SQL statements to insert rows into the tables
mental_rating_sql = '''
    INSERT INTO mental_rating (
        id, rating_id, planning_rating, risk_rating, prediction_rating, 
        clutch_rating, consistency_rating, motivation_rating, 
        pokemon_knowledge_rating, trainer_knowledge_rating, 
        training_rating, conditioning_rating, determination_rating, 
        facilities_rating, attack_rating, defense_rating, 
        speed_rating, gimmick_rating
    ) VALUES (?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
'''

format_rating_sql = '''
    INSERT INTO format_rating (
        id, rating_id, singles_rating, doubles_rating, tag_battle_rating, 
        battle_factory_rating, rotation_rating, sixes_rating, threes_rating, twos_rating
    ) VALUES (?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
'''

try:
    # Loop to insert 257 rows into each table
    for i in range(1, 258):
        cursor.execute(mental_rating_sql, (i, i))
        cursor.execute(format_rating_sql, (i, i))

    # Commit the transactions
    conn.commit()
    print("Inserted 257 rows into mental_rating and format_rating tables.")

except sqlite3.Error as e:
    print(f"SQLite error: {e}")
    conn.rollback()

finally:
    # Close the connection
    conn.close()
