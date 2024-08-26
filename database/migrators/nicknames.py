import sqlite3
import requests
import os

# Connect to the database
script_dir = os.path.dirname(__file__)
db_path = os.path.join(script_dir, '..', 'db.sqlite')
db_conn = sqlite3.connect(db_path)
cursor = db_conn.cursor()

# Define the function to capitalize after non-alphabetic characters
def capitalize_after_non_alphabetic(name: str) -> str:
    result = []
    capitalize_next = True  

    for char in name:
        if not char.isalpha():  # Check if the character is non-alphabetic
            result.append(char)
            capitalize_next = True  # Capitalize the next alphabetic character
        elif capitalize_next:
            result.append(char.upper())
            capitalize_next = False
        else:
            result.append(char.lower())  # Ensure everything else is lowercase

    # Join the result list back into a string
    return ''.join(result)


# Fetch all Pokémon with species_id
cursor.execute("SELECT id, species_id FROM pokemon WHERE nickname IS NULL OR nickname = ''")
pokemon_entries = cursor.fetchall()

# Process each Pokémon
for pokemon in pokemon_entries:
    pokemon_id, species_id = pokemon

    # Fetch the species name from PokeAPI
    api_url = f"https://pokeapi.co/api/v2/pokemon-species/{species_id}"
    response = requests.get(api_url)
    
    if response.status_code == 200:
        species_data = response.json()
        species_name = species_data['name']
        
        # Transform the name
        nickname = capitalize_after_non_alphabetic(species_name)

        # Update the database with the new nickname
        cursor.execute(
            "UPDATE pokemon SET nickname = ? WHERE id = ?",
            (nickname, pokemon_id)
        )
        
        print(f"Updated Pokémon {pokemon_id} with nickname: {nickname}")
    else:
        print(f"Failed to fetch data for species_id: {species_id}")

# Commit the changes and close the connection
db_conn.commit()
db_conn.close()