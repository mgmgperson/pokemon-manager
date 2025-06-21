import sqlite3
import json

# Connect to the SQLite database
conn = sqlite3.connect('../db.sqlite')
cursor = conn.cursor()

# Query to select name frequencies from specific regions
# Note: Converting region_id 11 to 8 for Galar
query = """
SELECT 
    id,
    CASE WHEN region_id = 11 THEN 8 ELSE region_id END as region_id,
    frequency,
    country,
    type
FROM region_name_frequency 
WHERE region_id IN (1, 2, 3, 4, 5, 6, 7, 11)
ORDER BY region_id, type, frequency DESC
"""

cursor.execute(query)
frequencies = cursor.fetchall()

# Start the TypeScript array
typescript_output = "export const defaultNameFrequencies: RegionNameFrequency[] = [\n"

# Process each frequency entry
for freq in frequencies:
    freq_id, region_id, frequency, country, name_type = freq
    
    # Handle null values
    country = country if country is not None else ""
    frequency = frequency if frequency is not None else 0
    
    # Create the TypeScript object
    freq_obj = f"""    {{
        id: {freq_id},
        regionId: {region_id},
        frequency: {frequency},
        country: "{country}",
        type: "{name_type}"
    }},\n"""
    
    typescript_output += freq_obj

# Close the array
typescript_output += "];"

# Write to file
with open('frequencies.txt', 'w', encoding='utf-8') as f:
    f.write(typescript_output)

# Close the database connection
conn.close()

print("Name frequencies have been exported to frequencies.txt in TypeScript format.")