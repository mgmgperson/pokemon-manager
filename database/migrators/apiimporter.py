import requests

# Define API endpoint
API_URL = "https://pokeapi.co/api/v2/pokemon-form/?offset=0&limit=1527"

# Fetch data from PokeAPI
response = requests.get(API_URL)
data = response.json()

# Extract ability names and IDs
abilities = []
for ability in data["results"]:
    ability_name = ability["name"].upper().replace("-", "_")
    ability_id = ability["url"].split("/")[-2]  # Extract ID from URL
    abilities.append((ability_name, int(ability_id)))

# Sort abilities by ID
abilities.sort(key=lambda x: x[1])

# Generate TypeScript enum text
enum_text = "export enum PokemonForms {\n"
for i, (name, ability_id) in enumerate(abilities):
    if i == 0 or ability_id == abilities[i - 1][1] + 1:
        enum_text += f"  {name},\n"
    else:
        enum_text += f"  {name} = {ability_id},\n"
enum_text += "}"

# Save to a text file
with open("pokemonform_enum.txt", "w") as file:
    file.write(enum_text)

print("Pokemon enum successfully saved to 'pokemon_enum.txt'.")
