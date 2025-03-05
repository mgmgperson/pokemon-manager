#!/usr/bin/env python3

import os
import sqlite3
import sys

def add_trainers_from_txt(file_path: str, db_path: str):
    """
    Reads a .txt file line-by-line, looks for lines ending in ':' or '-',
    then parses the NEXT line for a comma-separated list of names.
    
    For each name 'Fname Lname', we check if the trainer already exists
    in the 'trainer' table. If not found, we add them.
    We skip any name whose first word starts with '('.

    :param file_path: Path to the .txt file
    :param db_path: Path to the SQLite database
    """
    # 1) Connect to the SQLite DB
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 2) Read all lines
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # 3) For convenience, strip lines of whitespace
    lines = [line.rstrip('\n\r') for line in lines]

    i = 0
    while i < len(lines):
        line = lines[i].strip()
    
        # Find the first occurrence of ':' or '-'
        colon_index = line.find(':')
        dash_index = line.find('-')
    
        # Determine which delimiter appears first (if any)
        candidates = [idx for idx in [colon_index, dash_index] if idx != -1]
        if candidates:
            delim_index = min(candidates)
            # Extract everything after the delimiter
            relevant_part = line[delim_index + 1:].strip()
            # Split by commas
            names = [n.strip() for n in relevant_part.split(',')]
            # Handle names however you need here
                    
            for name in names:
                # skip if empty
                if not name:
                    continue
                    
                # skip if the first word starts with '('
                # e.g. "(Special something..."
                first_word = name.split()[0]
                if first_word.startswith('('):
                    continue

                if first_word == "League" or first_word == "Cancelled":
                    continue

                last_word = name.split()[-1]
                if last_word.endswith(')'):
                    continue
                
                # parse Fname, Lname
                # Assume the first token is fname, the rest is lname
                parts = name.split(None, 1)
                if len(parts) < 2:
                    # e.g. "Silver" => can't parse
                    continue
                    
                fname = parts[0]
                lname = parts[1]
                    
                # 4) Check DB if trainer already exists
                cursor.execute("""
                    SELECT id 
                    FROM trainer
                    WHERE LOWER(fname) = LOWER(?) 
                      AND LOWER(lname) = LOWER(?)
                """, (fname, lname))
                row = cursor.fetchone()

                    # if not found, insert
                if not row:
                    print(f"Adding new trainer: {fname} {lname}")
                    # Insert with region_id=0 or some default if you prefer
                    cursor.execute("""
                        INSERT INTO trainer (fname, lname, region_id)
                        VALUES (?, ?, NULL)
                    """, (fname, lname))
                        
        i += 1

    # 5) commit
    conn.commit()
    conn.close()
    print("Done processing file.")

def main():
    # Example usage:
    #   python addtrainersfromtxt.py path/to/tournaments.txt path/to/db.sqlite
    if len(sys.argv) < 3:
        print("Usage: addtrainersfromtxt.py <input.txt> <db.sqlite>")
        sys.exit(1)

    file_path = sys.argv[1]
    db_path = sys.argv[2]

    if not os.path.isfile(file_path):
        print(f"Error: file not found: {file_path}")
        sys.exit(1)

    add_trainers_from_txt(file_path, db_path)

if __name__ == "__main__":
    main()
