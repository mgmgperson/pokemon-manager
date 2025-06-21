import sqlite3
import json

# Connect to the SQLite database
conn = sqlite3.connect('../db.sqlite')
cursor = conn.cursor()

# Query to select cities from specific regions
# Note: Converting region_id 11 to 8 for Galar
query = """
SELECT 
    id,
    name,
    CASE WHEN region_id = 11 THEN 8 ELSE region_id END as region_id,
    population,
    description,
    x_coordinate,
    y_coordinate
FROM city 
WHERE region_id IN (1, 2, 3, 4, 5, 6, 7, 11)
ORDER BY region_id, id
"""

cursor.execute(query)
cities = cursor.fetchall()

# Start the TypeScript array
typescript_output = "export const defaultCities: City[] = [\n"

# Process each city
for city in cities:
    city_id, name, region_id, population, description, x_coord, y_coord = city
    
    # Handle null values
    population = population if population is not None else 0
    description = description if description is not None else ""
    x_coord = x_coord if x_coord is not None else 0
    y_coord = y_coord if y_coord is not None else 0
    
    # Escape quotes in description
    escaped_description = description.replace('"', r'\"')
    
    # Create the TypeScript object
    city_obj = f"""    {{
        id: {city_id},
        name: "{name}",
        regionId: {region_id},
        population: {population},
        description: "{escaped_description}",
        x_coordinate: {x_coord},
        y_coordinate: {y_coord}
    }},\n"""
    
    typescript_output += city_obj

# Close the array
typescript_output += "];"

# Write to file
with open('cities.txt', 'w', encoding='utf-8') as f:
    f.write(typescript_output)

# Close the database connection
conn.close()

print("Cities have been exported to cities.txt in TypeScript format.")
