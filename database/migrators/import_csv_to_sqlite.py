import sqlite3
import pandas as pd
import os
from pathlib import Path

def create_database(csv_dir: str, db_path: str):
    """
    Create a SQLite database from CSV files in the specified directory.
    
    Args:
        csv_dir: Directory containing CSV files
        db_path: Path to the output SQLite database
    """
    # Create/connect to SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all CSV files in the names directory
    csv_files = list(Path(csv_dir).glob('*.csv'))
    
    if not csv_files:
        print(f"No CSV files found in {csv_dir}")
        return
    
    print(f"Found {len(csv_files)} CSV files to process")
    
    for csv_file in csv_files:
        # Get table name from CSV filename (without extension)
        table_name = csv_file.stem
        
        # Read CSV file
        print(f"Reading {csv_file.name}...")
        df = pd.read_csv(csv_file)
        
        # Infer column types
        dtype_dict = {}
        for column in df.columns:
            # Try to convert to numeric if possible
            try:
                pd.to_numeric(df[column])
                dtype_dict[column] = 'INTEGER'
            except:
                dtype_dict[column] = 'TEXT'
        
        # Create table with proper schema
        columns = [f"{col} {dtype_dict[col]}" for col in df.columns]
        create_table_sql = f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            {', '.join(columns)}
        )
        """
        cursor.execute(create_table_sql)
        
        # Import data
        print(f"Importing data into {table_name}...")
        df.to_sql(table_name, conn, if_exists='replace', index=False)
        
        print(f"Successfully imported {csv_file.name} into {table_name}")
    
    # Commit changes and close connection
    conn.commit()
    conn.close()
    
    print(f"\nDatabase created successfully at {db_path}")

if __name__ == "__main__":
    # Configuration
    CSV_DIR = "../names"  # Directory containing CSV files
    DB_PATH = "../names.sqlite"  # Output database path
    
    # Ensure the database directory exists
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    # Create database
    create_database(CSV_DIR, DB_PATH) 