import json
import sqlite3
import os

# Get the directory of the current script
script_dir = os.path.dirname(__file__)

def create_tables(cursor):
    # Construct the path to schema.sql relative to the script's directory
    schema_path = os.path.join(script_dir, '..', 'schema.sql')
    with open(schema_path, 'r') as file:
        schema = file.read()
        cursor.executescript(schema)

def get_region_id(cursor, region_name):
    cursor.execute('SELECT id FROM region WHERE name = ?', (region_name,))
    return cursor.fetchone()[0]

def get_city_id(cursor, city_name, region_name):
    region_id = get_region_id(cursor, region_name)
    cursor.execute('''
        SELECT id FROM city 
        WHERE name = ? AND region_id = ?
    ''', (city_name, region_id))
    return cursor.fetchone()[0]

def import_regions(cursor, regions):
    for region in regions:
        cursor.execute('INSERT INTO region (name) VALUES (?)', 
                       (region['name'],))
        region_id = cursor.lastrowid

        for city in region['cities']:
            cursor.execute('''
                INSERT INTO city (name, region_id, x_coordinate, y_coordinate)
                VALUES (?, ?, ?, ?)
            ''', (
                city['name'], region_id, 
                float(city['xCoordinate']['$numberDecimal']),
                float(city['yCoordinate']['$numberDecimal'])
            ))
            city_id = cursor.lastrowid

            if 'stadiums' in city:
                for stadium in city['stadiums']:
                    cursor.execute('''
                        INSERT INTO stadium (name, capacity, city_id)
                        VALUES (?, ?, ?)
                    ''', (
                        stadium['name'], stadium['capacity'], city_id
                    ))

def import_trainers(cursor, trainers):
    for trainer in trainers:
        region_id = get_region_id(cursor, trainer['region']) if 'region' in trainer else None
        pwtr_rating = float(trainer['pwtrRating']['$numberDecimal']) if 'pwtrRating' in trainer else None
        lname = trainer['lName'] if 'lName' in trainer else None
        cursor.execute('''
            INSERT INTO trainer (fname, lname, region_id, pwtr_rating, active_status)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            trainer['fName'], lname, region_id, 
            pwtr_rating,
            trainer['activeStatus']
        ))
        trainer_id = cursor.lastrowid

        for pokemon in trainer['pokemonOwned']:
            cursor.execute('''
                INSERT INTO pokemon (trainer_id, species, level, form)
                VALUES (?, ?, ?, ?)
            ''', (
                trainer_id, pokemon['baseForm'], pokemon['level'], pokemon['species']
            ))


def import_gym_leaders(cursor, regions):
    for region in regions:
        for city in region['cities']:
            city_id = get_city_id(cursor, city['name'], region['name'])
            if 'currentGymLeaders' in city:
                for leader in city['currentGymLeaders']:
                    cursor.execute('''
                        INSERT INTO gym_leader (trainer_id, city_id, type)
                        VALUES (?, ?, ?)
                    ''', (
                        leader['trainerID'], city_id, leader['type']
                    ))


def import_elite_four(cursor, regions):
    for region in regions:
        region_id = get_region_id(cursor, region['name'])
        if 'currentEliteFour' in region:
            for elite in region['currentEliteFour']:
                cursor.execute('''
                    INSERT INTO elite_four (trainer_id, region_id)
                    VALUES (?, ?)
                ''', (
                    elite['trainerID'], region_id
                ))

def import_champions(cursor, regions):
    for region in regions:
        region_id = get_region_id(cursor, region['name'])
        if 'currentChampion' in region:
            champion = region['currentChampion']
            cursor.execute('''
                INSERT INTO champion (trainer_id, region_id)
                VALUES (?, ?)
            ''', (
                champion['trainerID'], region_id
            ))

def import_hometowns(cursor, trainers):
    for trainer in trainers:
        print(trainer['fName'])
        trainer_id = trainer['trainerID']
        for hometown in trainer['hometowns']:
            city_name, region_name = hometown.split(', ')
            city_id = get_city_id(cursor, city_name.strip(), region_name.strip())
            cursor.execute('''
                INSERT INTO trainer_hometown (trainer_id, city_id)
                VALUES (?, ?)
            ''', (trainer_id, city_id))

def import_ratings(cursor, ratings):
    for rating in ratings:
        trainer_id = rating['trainerID']
        cursor.execute('''
            INSERT INTO rating (trainer_id, year, overall_rating, typing_rating, mixed_rating, special_rating)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            trainer_id, rating['year'], rating['overallRating'],
            rating['typingRating'], rating['mixedRating'], rating['specialRating']
        ))
        rating_id = cursor.lastrowid

        field_ratings = rating['fieldRatings']
        
        values = (
            rating_id, field_ratings['pumpedFieldRating'], field_ratings['windyFieldRating'],
            field_ratings['corrosiveFieldRating'], field_ratings['desertFieldRating'], field_ratings['cliffsFieldRating'],
            field_ratings['swarmFieldRating'], field_ratings['hauntedFieldRating'], field_ratings['factoryFieldRating'],
            field_ratings['infernalFieldRating'], field_ratings['watersurfaceFieldRating'], field_ratings['grassyFieldRating'],
            field_ratings['electirizedFieldRating'], field_ratings['psychicFieldRating'], field_ratings['icyFieldRating'],
            field_ratings['draconiddenFieldRating'], field_ratings['darkcavernFieldRating'], field_ratings['mistyFieldRating'],
            field_ratings['cityFieldRating'], field_ratings['mirrorFieldRating'], field_ratings['concertvenueFieldRating'],
            field_ratings['crystalcavernFieldRating'], field_ratings['waterfallFieldRating'], field_ratings['volcanicFieldRating'],
            field_ratings['forestFieldRating'], field_ratings['flowergardenFieldRating'], field_ratings['swampFieldRating'],
            field_ratings['bewitchedwoodsFieldRating'], field_ratings['murkwatersurfaceFieldRating'], field_ratings['smokyFieldRating'],
            field_ratings['frozendimensionalFieldRating'], field_ratings['valleyofwindsFieldRating'], field_ratings['losthotelFieldRating'],
            field_ratings['taigaFieldRating'], field_ratings['ashenbeachFieldRating'], field_ratings['underwaterFieldRating'],
            field_ratings['starlightarenaFieldRating'], field_ratings['snowymountainFieldRating'], field_ratings['bigtopFieldRating'],
            field_ratings['backalleyFieldRating'], field_ratings['neutralFieldRating'], field_ratings['chessFieldRating'],
            field_ratings['deepearthFieldRating'], field_ratings['inverseFieldRating'], field_ratings['glitchFieldRating'],
            field_ratings['dimensionalFieldRating'], field_ratings['colosseumFieldRating'], field_ratings['tricksterFieldRating'],
            field_ratings['fantasyFieldRating'], field_ratings['rainbowFieldRating'], field_ratings['newworldFieldRating']
        )
        
        print(len(values), values)  # Debugging line to check number of values
        
        cursor.execute('''
            INSERT INTO field_rating (
                rating_id, pumped_field_rating, windy_field_rating, corrosive_field_rating, desert_field_rating,
                cliffs_field_rating, swarm_field_rating, haunted_field_rating, factory_field_rating,
                infernal_field_rating, watersurface_field_rating, grassy_field_rating, electirized_field_rating,
                psychic_field_rating, icy_field_rating, draconidden_field_rating, darkcavern_field_rating,
                misty_field_rating, city_field_rating, mirror_field_rating, concertvenue_field_rating,
                crystalcavern_field_rating, waterfall_field_rating, volcanic_field_rating, forest_field_rating,
                flowergarden_field_rating, swamp_field_rating, bewitchedwoods_field_rating, murkwatersurface_field_rating,
                smoky_field_rating, frozendimensional_field_rating, valleyofwinds_field_rating, losthotel_field_rating,
                taiga_field_rating, ashenbeach_field_rating, underwater_field_rating, starlightarena_field_rating,
                snowymountain_field_rating, bigtop_field_rating, backalley_field_rating, neutral_field_rating,
                chess_field_rating, deepearth_field_rating, inverse_field_rating, glitch_field_rating,
                dimensional_field_rating, colosseum_field_rating, trickster_field_rating, fantasy_field_rating,
                rainbow_field_rating, newworld_field_rating
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', values)



def main():
    # Construct the path to regions.json relative to the script's directory
    json_path = os.path.join(script_dir, '..', 'oldjson', 'regions.json')
    with open(json_path, 'r') as file:
        regions = json.load(file)

    json_path = os.path.join(script_dir, '..', 'oldjson', 'players.json')
    with open(json_path, 'r') as file:
        trainers = json.load(file)

    json_path = os.path.join(script_dir, '..', 'oldjson', 'ratings.json')
    with open(json_path, 'r') as file:
        ratings = json.load(file)

    # print to check regions
    #print(regions)

    # Connect to SQLite database
    conn = sqlite3.connect(os.path.join(script_dir, '..', 'db.sqlite'))
    cursor = conn.cursor()

    # Create tables
    #create_tables(cursor)

    # Import data
    #import_regions(cursor, regions)
    #import_trainers(cursor, trainers)
    #import_gym_leaders(cursor, regions)
    #import_elite_four(cursor, regions)
    #import_champions(cursor, regions)
    #import_hometowns(cursor, trainers)
    import_ratings(cursor, ratings)

    # Commit and close
    conn.commit()
    conn.close()

if __name__ == '__main__':
    main()
