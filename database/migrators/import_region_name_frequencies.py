import sqlite3
import os
from pathlib import Path

def ensure_database_structure(db_path):
    """
    Create the database if it doesn't exist and ensure it has the required tables.
    
    Args:
        db_path: Path to the SQLite database
    """
    # Connect to database (will create it if it doesn't exist)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if region table exists, create it if not
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS region (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        population INTEGER
    )
    """)
    
    conn.commit()
    return conn, cursor

def ensure_regions_exist(cursor, regions):
    """
    Ensures all regions exist in the database before importing frequencies.
    
    Args:
        cursor: SQLite cursor
        regions: List of region names
    """
    print("Checking if regions exist in database...")
    
    for region in regions:
        # Check if region exists
        cursor.execute("SELECT id FROM region WHERE name = ?", (region,))
        result = cursor.fetchone()
        
        if not result:
            print(f"Creating region: {region}")
            cursor.execute("INSERT INTO region (name) VALUES (?)", (region,))

def import_region_name_frequencies(db_path: str, frequency_file_path: str):
    """
    Import region name frequencies from a text file into the database.
    
    Args:
        db_path: Path to the SQLite database
        frequency_file_path: Path to the text file containing frequency data
    """
    # Set up database
    conn, cursor = ensure_database_structure(db_path)
    
    print(f"Connected to database at {db_path}")
    
    # Extract region names from the file
    regions = set()
    try:
        with open(frequency_file_path, 'r') as file:
            lines = file.readlines()
            for line in lines:
                line = line.strip()
                if line and not '-' in line and line not in ['Forename', 'Surname']:
                    regions.add(line)
    except Exception as e:
        print(f"Error reading frequency file: {e}")
        conn.close()
        return
    
    # Ensure regions exist
    ensure_regions_exist(cursor, regions)
    
    # Check if table exists and drop it if it does
    cursor.execute("DROP TABLE IF EXISTS region_name_frequency")
    print("Dropped existing region_name_frequency table if it existed")
    
    # Create the table
    cursor.execute("""
    CREATE TABLE region_name_frequency (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        region_id INTEGER NOT NULL,
        frequency INTEGER NOT NULL,
        country TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('F', 'S')),
        FOREIGN KEY (region_id) REFERENCES region(id)
    )
    """)
    print("Created new region_name_frequency table")
    
    # Read frequency data from file again
    try:
        with open(frequency_file_path, 'r') as file:
            lines = file.readlines()
    except Exception as e:
        print(f"Error reading frequency file: {e}")
        conn.close()
        return
    
    # Process the data
    current_region = None
    current_type = None
    region_id = None
    
    for line in lines:
        line = line.strip()
        
        # Skip empty lines
        if not line:
            continue
        
        # Check if this is a region line (doesn't contain '-' and is not Forename/Surname)
        if not '-' in line and line not in ['Forename', 'Surname']:
            current_region = line
            # Get region_id from database
            cursor.execute("SELECT id FROM region WHERE name = ?", (current_region,))
            result = cursor.fetchone()
            if result:
                region_id = result[0]
                print(f"Processing region: {current_region} (ID: {region_id})")
            else:
                # This shouldn't happen since we ensure regions exist
                print(f"Warning: Region '{current_region}' not found in database")
                region_id = None
            continue
        
        # Check if this is a type line
        if line in ['Forename', 'Surname']:
            current_type = 'F' if line == 'Forename' else 'S'
            continue
        
        # Must be a frequency line (e.g. "JP - 24")
        if region_id is not None and current_type is not None and '-' in line:
            parts = line.split('-')
            if len(parts) == 2:
                country = parts[0].strip()
                try:
                    frequency = int(parts[1].strip())
                    # Insert data
                    cursor.execute("""
                    INSERT INTO region_name_frequency 
                    (region_id, frequency, country, type) 
                    VALUES (?, ?, ?, ?)
                    """, (region_id, frequency, country, current_type))
                    print(f"Added {current_type} frequency for {country}: {frequency}% in {current_region}")
                except ValueError as e:
                    print(f"Error parsing frequency value in line: {line}, {e}")
            else:
                print(f"Warning: Invalid frequency line format: {line}")
    
    # Commit changes and close connection
    conn.commit()
    conn.close()
    
    print("\nRegion name frequency import completed successfully")

if __name__ == "__main__":
    # Get the script's directory path (migrators folder)
    script_dir = Path(__file__).parent
    
    # Configuration
    DB_PATH = script_dir.parent / "db.sqlite"  # Main database path
    FREQUENCY_FILE_PATH = script_dir.parent / "names/regiontoname.txt"  # Frequency data file
    
    # Ensure frequency file exists
    if not FREQUENCY_FILE_PATH.exists():
        print(f"Error: Frequency file not found at {FREQUENCY_FILE_PATH}")
        exit(1)
    
    # Create parent directory for DB if it doesn't exist
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    # Import data
    import_region_name_frequencies(str(DB_PATH), str(FREQUENCY_FILE_PATH)) 