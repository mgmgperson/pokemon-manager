import sqlite3
import json

# Connect to the SQLite database
conn = sqlite3.connect('../db.sqlite')
cursor = conn.cursor()

# Query to select stadiums from cities in specific regions
# Note: Converting region_id 11 to 8 for Galar
query = """
SELECT 
    s.id,
    s.name,
    s.type,
    s.capacity,
    s.city_id
FROM stadium s
JOIN city c ON s.city_id = c.id
WHERE c.region_id IN (1, 2, 3, 4, 5, 6, 7, 11)
ORDER BY c.region_id, s.id
"""

cursor.execute(query)
stadiums = cursor.fetchall()

# Start the TypeScript array
typescript_output = "export const defaultStadiums: Stadium[] = [\n"

# Process each stadium
for stadium in stadiums:
    stadium_id, name, stadium_type, capacity, city_id = stadium
    
    # Handle null values
    name = name if name is not None else ""
    stadium_type = stadium_type if stadium_type is not None else ""
    capacity = capacity if capacity is not None else 0
    
    # Create the TypeScript object
    stadium_obj = f"""    {{
        id: {stadium_id},
        name: "{name}",
        type: "{stadium_type}",
        capacity: {capacity},
        cityId: {city_id}
    }},\n"""
    
    typescript_output += stadium_obj

# Close the array
typescript_output += "];"

# Write to file
with open('stadiums.txt', 'w', encoding='utf-8') as f:
    f.write(typescript_output)

# Close the database connection
conn.close()

print("Stadiums have been exported to stadiums.txt in TypeScript format.")