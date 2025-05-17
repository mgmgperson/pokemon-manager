import sqlite3
import os
from pathlib import Path

def filter_names_by_country(db_path: str):
    """
    Filter names database to keep only entries from specified countries.
    Also removes NULL values, non-Latin alphabet entries, and low count entries.
    
    Args:
        db_path: Path to the SQLite database
    """
    # Valid country codes to keep
    valid_countries = {'US', 'ES', 'FR', 'JP', 'GB', 'IT', 'DE', 'KR', 'CA'}
    MIN_COUNT = 5  # Minimum count threshold
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get initial file size
    initial_size = os.path.getsize(db_path)
    print(f"\nInitial database size: {initial_size / 1024 / 1024:.2f} MB")
    
    # Process both tables
    tables = ['forenames', 'surnames']
    for table in tables:
        print(f"\nProcessing {table} table...")
        
        # Get total count before filtering
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        total_before = cursor.fetchone()[0]
        
        # Delete entries not in valid countries, with invalid names, or low counts
        cursor.execute(f"""
            DELETE FROM {table}
            WHERE country NOT IN ({','.join(['?'] * len(valid_countries))})
            OR {table[:-1]} IS NULL
            OR {table[:-1]} = ''
            OR {table[:-1]} NOT GLOB '[A-Za-z]*'
            OR count <= ?
        """, tuple(valid_countries) + (MIN_COUNT,))
        
        # Get count after filtering
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        total_after = cursor.fetchone()[0]
        
        # Print statistics
        removed = total_before - total_after
        print(f"Removed {removed} entries")
        print(f"Kept {total_after} entries")
    
    # Commit changes
    conn.commit()
    
    # Vacuum the database to reclaim space
    print("\nVacuuming database to reclaim space...")
    cursor.execute("VACUUM")
    
    # Close connection
    conn.close()
    
    # Get final file size
    final_size = os.path.getsize(db_path)
    size_reduction = initial_size - final_size
    print(f"\nFinal database size: {final_size / 1024 / 1024:.2f} MB")
    print(f"Size reduction: {size_reduction / 1024 / 1024:.2f} MB")
    print("\nDatabase filtering completed successfully")

if __name__ == "__main__":
    # Configuration
    DB_PATH = "../names.sqlite"
    
    # Ensure database exists
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        exit(1)
    
    # Filter database
    filter_names_by_country(DB_PATH) 