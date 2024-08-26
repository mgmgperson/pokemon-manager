import sqlite3
import requests
import os

# PokeAPI URLs
POKEAPI_SPECIES_URL = 'https://pokeapi.co/api/v2/pokemon-species/{}/'
POKEAPI_FORM_URL = 'https://pokeapi.co/api/v2/pokemon/{}/'
script_dir = os.path.dirname(__file__)


# Open the old database
old_db_conn = sqlite3.connect(os.path.join(script_dir, '..', 'db.sqlite'))
old_cursor = old_db_conn.cursor()

# Open the new database
new_db_conn = sqlite3.connect(os.path.join(script_dir, '..', 'db_copy_2.sqlite'))
new_cursor = new_db_conn.cursor()

# Fetch all old pokemon data
old_cursor.execute("SELECT id, trainer_id, species, level, form FROM pokemon WHERE id > 2531")
old_pokemon_data = old_cursor.fetchall()

# Helper function to fetch from PokeAPI
def fetch_from_pokeapi(url):
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
        else:
            return None
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None

# Migration logic
for pokemon in old_pokemon_data:
    pokemon_id, trainer_id, species, level, form = pokemon
    
    # Handle species
    species_name = species.lower().replace(" ", "-")
    if species_name.endswith("alola"):
        species_name = species_name[:-5]
    elif species_name.endswith("galar"):
        species_name = species_name[:-5]
    elif species_name.endswith("hisui"):
        species_name = species_name[:-5]
    
    #handle species missing names
    if species_name == "mrmime":
        species_name = "mr-mime"
        form = "mr-mime"
    elif species_name == "mrrime":
        species_name = "mr-rime"
        form = "mr-rime"
    elif species_name == "hooh":
        species_name = "ho-oh"
        form = "ho-oh"
    elif species_name == "porygonz":
        species_name = "porygon-z"
        form = "porygon-z"
    elif species_name == "lycanrocdusk":
        species_name = "lycanroc"
        form = "lycanroc-dusk"
    elif species_name == "lycanrocmidnight":
        species_name = "lycanroc"
        form = "lycanroc-midnight"
    elif species_name == "kommoo":
        species_name = "kommo-o"
        form = "kommo-o"
    elif species_name == "ursalunabloodmoon":
        species_name = "ursaluna"
        form = "ursaluna-blood-moon"
    elif species_name == "rotomwash":
        species_name = "rotom"
        form = "rotom-wash"
    elif species_name == "rotomheat":
        species_name = "rotom"
        form = "rotom-heat"
    elif species_name == "rotomfrost":
        species_name = "rotom"
        form = "rotom-frost"
    elif species_name == "rotomfan":
        species_name = "rotom"
        form = "rotom-fan"
    elif species_name == "rotommow":
        species_name = "rotom"
        form = "rotom-mow"
    elif species_name == "pikachubelle":
        species_name = "pikachu"
        form = "pikachu-belle"
    elif species_name == "pikachulibre":
        species_name = "pikachu"
        form = "pikachu-libre"
    elif species_name == "taurospaldeablaze":
        species_name = "tauros"
        form = "tauros-paldea-blaze-breed"
    elif species_name == "wormadamtrash":
        species_name = "wormadam"
        form = "wormadam-trash"
    elif species_name == "tapubulu":
        species_name = "tapu-bulu"
        form = "tapu-bulu"
    

    species_data = fetch_from_pokeapi(POKEAPI_SPECIES_URL.format(species_name))
    
    if species_data:
        species_id = species_data['id']
    else:
        print(f"Species not found: {species_name}")
        continue
    
    # Handle form
    is_mega = False
    is_gigantamax = False
    form_id = None
    
    if form.endswith("mega") and not form.endswith("yanmega"):
        is_mega = True
        form_name = form[:-4]
    elif form.endswith("megax"):
        is_mega = True
        form_name = form[:-5]
    elif form.endswith("megay"):
        is_mega = True
        form_name = form[:-5]
    elif form.endswith("gmax"):
        is_gigantamax = True
        form_name = form[:-4]
    elif form.endswith("alola"):
        form_name = form[:-5] + "-alola"
    elif form.endswith("galar"):
        form_name = form[:-5] + "-galar"
    elif form.endswith("hisui"):
        form_name = form[:-5] + "-hisui"
    else:
        form_name = form.lower().replace(" ", "-")
    
        # Handle special cases
        if form_name.startswith("oricorio") and len(form_name) > len("oricorio"):
            if form_name == "oricoriopompom":
                form_name = "oricorio-pom-pom"
            else:
                form_name = form_name[:8] + "-" + form_name[8:]
    
        if form_name.startswith("shaymin") and len(form_name) > len("shaymin"):
            form_name = "shaymin-" + form_name[7:]

        if form_name.startswith("greninja") and len(form_name) > len("greninja"):
            form_name = "greninja-" + form_name[8:]

    if species_name == "darmanitan-galar":
        form_name = "darmanitan-galar-standard"
    
    def fetch_from_pokeapi(url):
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
        return None
    
    def get_default_variety_id(species_name):
        species_data = fetch_from_pokeapi(POKEAPI_SPECIES_URL.format(species_name))
        if species_data:
            for variety in species_data['varieties']:
                if variety['is_default']:
                    pokemon_data = fetch_from_pokeapi(variety['pokemon']['url'])
                    if pokemon_data:
                        return pokemon_data['id']
        return None
    
    if form_name:
        form_data = fetch_from_pokeapi(POKEAPI_FORM_URL.format(form_name))
        if form_data:
            form_id = form_data['id']
        else:
            #print(f"Form not found: {form_name}, trying default variety")
            # Fetch the default variety ID
            default_variety_id = get_default_variety_id(form_name)
            if default_variety_id:
                form_id = default_variety_id
            else:
                print(f"Default variety not found for: {form_name}")
    
    # Insert into new database
    try:
        new_cursor.execute('''
            INSERT INTO pokemon (
                id, trainer_id, species_id, pokemon_id, level,
                nickname, attack, defense, special_attack, special_defense, speed, hp, happiness, 
                iv_hp, iv_attack, iv_defense, iv_special_attack, iv_special_defense, iv_speed, 
                ev_hp, ev_attack, ev_defense, ev_special_attack, ev_special_defense, ev_speed, 
                nature_id, ability_id, gender, shiny, pokeball_id, held_item_id, experience_points, 
                is_gigantamax, is_mega, 
                current_hp, current_strength, status_id, battles_won, battles_lost, kills, 
                deaths, training_efficiency, ot_name, ot_id
            ) VALUES (
                ?, ?, ?, ?, ?,
                NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 
                NULL, NULL, NULL, NULL, NULL, NULL, 
                NULL, NULL, NULL, NULL, NULL, NULL, 
                NULL, NULL, NULL, NULL, NULL, NULL, NULL, 
                ?, ?, 
                NULL, NULL, NULL, NULL, NULL, NULL, 
                NULL, NULL, NULL, NULL
            )
        ''', (pokemon_id, trainer_id, species_id, form_id, level, is_gigantamax, is_mega))

        print(f'Inserted Pokémon {pokemon_id} with species {species_id} and form {form_id}')
        #print(f'Name: {species}, Level: {level}, Form: {form}')
        new_db_conn.commit()
    except sqlite3.Error as e:
        print(f"Error inserting Pokémon {pokemon_id}: {e}")
        new_db_conn.rollback()

# Close the connections
old_db_conn.close()
new_db_conn.close()
