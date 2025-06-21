import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('../db.sqlite')
cursor = conn.cursor()

# Query to select Pokemon from trainers in specific regions
query = """
SELECT 
    p.trainer_id,
    p.species_id,
    p.pokemon_id,
    p.level,
    p.is_gigantamax,
    p.is_mega
FROM pokemon p
JOIN trainer t ON p.trainer_id = t.id
WHERE t.region_id IN (1, 2, 3, 4, 5, 6, 7, 11)
ORDER BY t.region_id, p.trainer_id
"""

cursor.execute(query)
pokemon = cursor.fetchall()

# Start the TypeScript array
typescript_output = "export const defaultPokemon: Pokemon[] = [\n"

# Process each Pokemon with only essential fields
for p in pokemon:
    trainer_id, species_id, pokemon_id, level, is_gigantamax, is_mega = p
    
    pokemon_obj = f"""    {{
        trainerId: {trainer_id},
        speciesId: {species_id},
        pokemonId: {pokemon_id if pokemon_id else 'null'},
        level: {level if level else 1},
        isGigantamax: {str(bool(is_gigantamax)).lower()},
        isMega: {str(bool(is_mega)).lower()}
    }},\n"""
    
    typescript_output += pokemon_obj

# Close the array
typescript_output += "];"

# Write to file
with open('pokemon.txt', 'w', encoding='utf-8') as f:
    f.write(typescript_output)

# Close the database connection
conn.close()

print("Pokemon data has been exported to pokemon.txt in TypeScript format.")