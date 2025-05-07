#!/usr/bin/env python3
import sqlite3
import requests
import json
import random
import datetime
import sys
import re

# --- Configuration ---
SQLITE_DB = "../db copy 2.sqlite"  # Path to your SQLite DB
INPUT_FILE = "import.txt"           # Path to the input text file
CURRENT_YEAR = 2036

# --- Helper Functions ---

def randomize_rating(rating: float) -> float:
    """Return a random float within ±50 of the given rating, with two decimals."""
    return round(random.uniform(rating - 50, rating + 50), 2)

def determine_max_level(peak: float) -> int:
    """Determine max level based on trainer's peak_rank."""
    if 1 <= peak < 100:
        return 100
    elif 100 <= peak < 250:
        return 95
    elif 250 <= peak < 500:
        return 90
    elif 500 <= peak < 1000:
        return 85
    elif 1000 <= peak < 1500:
        return 80
    else:
        return 75

def adjust_level(input_level: float, trainer_peak: float) -> int:
    """Adjust input level based on trainer's peak.
       If the input level is above the max allowed, reduce it by the difference.
    """
    max_level = determine_max_level(trainer_peak)
    diff = input_level - max_level
    return max_level if diff > 0 else int(input_level)

def random_birthdate(year: int) -> str:
    """Generate a random birthdate in ISO 8601 format for a given year."""
    month = random.randint(1, 12)
    day = random.randint(1, 28)  # To avoid month-end complications.
    return f"{year:04d}-{month:02d}-{day:02d}"

def parse_name(full_name: str):
    """Split a full name into first name and last name."""
    parts = full_name.strip().split()
    if not parts:
        return ("", "")
    fname = parts[0]
    lname = " ".join(parts[1:]) if len(parts) > 1 else ""
    return fname, lname

def get_region_id(conn: sqlite3.Connection, region_name: str) -> int:
    """Look up the region_id given a region name."""
    cur = conn.cursor()
    cur.execute("SELECT id FROM region WHERE name = ?", (region_name.strip(),))
    row = cur.fetchone()
    if row:
        return row[0]
    else:
        print(f"Region '{region_name}' not found in DB. Please create it manually.")
        return None

def get_city_id(conn: sqlite3.Connection, city_name: str, region_id: int) -> int:
    """Look up a city by name and region_id; if not found, create it."""
    cur = conn.cursor()
    cur.execute("SELECT id FROM city WHERE name = ? AND region_id = ?", (city_name.strip(), region_id))
    row = cur.fetchone()
    if row:
        return row[0]
    else:
        cur.execute("INSERT INTO city (name, region_id) VALUES (?, ?)", (city_name.strip(), region_id))
        conn.commit()
        new_id = cur.lastrowid
        print(f"Created city '{city_name}' for region id {region_id} (id={new_id}).")
        return new_id

def trainer_exists(conn: sqlite3.Connection, fname: str, lname: str) -> int:
    """Check if a trainer exists by first and last name. Returns trainer id if found."""
    cur = conn.cursor()
    cur.execute("SELECT id FROM trainer WHERE fname = ? AND lname = ?", (fname, lname))
    row = cur.fetchone()
    return row[0] if row else None

def insert_trainer(conn: sqlite3.Connection, fname: str, lname: str, region_id: int, birthdate: str, pwtr_rating, peak_rank, active_status: bool):
    """Insert a new trainer into the trainer table and return the new trainer id."""
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO trainer (fname, lname, region_id, birthdate, pwtr_rating, peak_rank, active_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (fname, lname, region_id, birthdate, pwtr_rating, peak_rank, active_status))
    conn.commit()
    new_id = cur.lastrowid
    print(f"Created trainer {fname} {lname} with id {new_id}.")
    print(f"Trainer details: region_id={region_id}, birthdate={birthdate}, rating={pwtr_rating}, peak={peak_rank}, active={active_status}")
    return new_id

def update_trainer_hometown(conn: sqlite3.Connection, trainer_id: int, city_ids: list):
    """Insert trainer_hometown records if not already present."""
    cur = conn.cursor()
    cur.execute("SELECT city_id FROM trainer_hometown WHERE trainer_id = ?", (trainer_id,))
    existing = set(r[0] for r in cur.fetchall())
    for cid in city_ids:
        if cid in existing:
            print(f"Trainer {trainer_id} already has hometown with city_id {cid}.")
        else:
            cur.execute("INSERT INTO trainer_hometown (trainer_id, city_id) VALUES (?, ?)", (trainer_id, cid))
            print(f"Added hometown for trainer {trainer_id} with city_id {cid}.")
    conn.commit()

def update_trainer_ratings(conn: sqlite3.Connection, trainer_id: int, pwtr_rating, peak_rank):
    """Update trainer rating fields if they are missing."""
    cur = conn.cursor()
    cur.execute("SELECT pwtr_rating, peak_rank FROM trainer WHERE id = ?", (trainer_id,))
    row = cur.fetchone()
    current_pwtr, current_peak = row
    if current_pwtr is not None and str(pwtr_rating).lower() == "rating":
        print(f"Trainer id {trainer_id} already has a pwtr_rating; input rating ignored.")
    else:
        cur.execute("UPDATE trainer SET pwtr_rating = ? WHERE id = ?", (None if str(pwtr_rating).lower() == "inactive" else pwtr_rating, trainer_id))
        print(f"Updated pwtr_rating for trainer {trainer_id} to {pwtr_rating}.")
    if current_peak is not None and str(peak_rank).lower() == "peak":
        print(f"Trainer id {trainer_id} already has a peak_rank; input peak ignored.")
    else:
        cur.execute("UPDATE trainer SET peak_rank = ? WHERE id = ?", (None if str(peak_rank).lower() in ("inactive", "peak") else peak_rank, trainer_id))
        print(f"Updated peak_rank for trainer {trainer_id} to {peak_rank}.")
    conn.commit()

def insert_pokemon(conn: sqlite3.Connection, trainer_id: int, species_id: int, pokemon_id: int, level: int, is_gigantamax: bool, is_mega: bool):
    """Insert a new Pokemon record (only key fields for migration)."""
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO pokemon (trainer_id, species_id, pokemon_id, level, is_gigantamax, is_mega)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (trainer_id, species_id, pokemon_id, level, is_gigantamax, is_mega))
    conn.commit()
    print(f"Inserted Pokemon (pokemon_id={pokemon_id}, species_id={species_id}, level={level}, giga={is_gigantamax}, mega={is_mega}) for trainer {trainer_id}.")

def get_pokemon_data_from_api(pokemon_name: str) -> dict:
    """Fetch Pokemon data from the PokeAPI using the given name."""
    url = f"https://pokeapi.co/api/v2/pokemon/{pokemon_name.lower()}"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching data for Pokemon '{pokemon_name}': {response.status_code}")
        return {}

def extract_pokemon_ids(pokemon_name: str) -> (int, int):
    """Given a Pokemon name, fetch its data and extract (pokemon_id, species_id)."""
    data = get_pokemon_data_from_api(pokemon_name)
    if not data:
        return (None, None)
    pokemon_id = data.get("id")
    species_url = data.get("species", {}).get("url", "")
    m = re.search(r'/pokemon-species/(\d+)/', species_url)
    species_id = int(m.group(1)) if m else None
    return (pokemon_id, species_id)

# --- Main Migrator Function ---

def migrate_trainers(input_file: str):
    conn = sqlite3.connect(SQLITE_DB)
    cur = conn.cursor()
    
    current_region_id = None

    with open(input_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            # Region header (contains a colon)
            if ":" in line:
                region_name = line.replace(":", "").strip()
                region_id = get_region_id(conn, region_name)
                if region_id is not None:
                    current_region_id = region_id
                    print(f"Switched region to '{region_name}' (id={region_id}).")
                else:
                    print(f"Region '{region_name}' not found. Skipping region block.")
                continue

            # Trainer line: name | hometown | rating | peak | age | pokemon
            parts = [p.strip() for p in line.split("|")]
            if len(parts) < 6:
                print(f"Skipping invalid trainer line: {line}")
                continue

            full_name, hometown_str, rating_str, peak_str, age_str, pokemon_str = parts
            fname, lname = parse_name(full_name)

            # Check for existing trainer
            existing_trainer_id = trainer_exists(conn, fname, lname)
            if existing_trainer_id:
                trainer_id = existing_trainer_id
                print(f"Found trainer {fname} {lname} with id {trainer_id}.")
                cur.execute("SELECT pwtr_rating, peak_rank, birthdate FROM trainer WHERE id = ?", (trainer_id,))
                row = cur.fetchone()
                current_pwtr, current_peak, current_birthdate = row

                # Update pwtr_rating if a numeric rating is provided (ignoring "inactive" and "rating")
                if rating_str.lower() not in ("inactive", "rating"):
                    try:
                        new_rating = randomize_rating(float(rating_str))
                        cur.execute("UPDATE trainer SET pwtr_rating = ? WHERE id = ?", (new_rating, trainer_id))
                        print(f"Updated pwtr_rating for trainer {fname} {lname} to {new_rating}.")
                    except ValueError:
                        print(f"Invalid rating '{rating_str}' for trainer {fname} {lname}.")
                
                # Update peak_rank if a numeric peak is provided (ignoring "inactive" and "peak")
                if peak_str.lower() not in ("inactive", "peak") and peak_str.isdigit():
                    new_peak = int(peak_str)
                    cur.execute("UPDATE trainer SET peak_rank = ? WHERE id = ?", (new_peak, trainer_id))
                    print(f"Updated peak_rank for trainer {fname} {lname} to {new_peak}.")
                
                # Update birthdate if age is provided and the trainer's birthdate is currently NULL
                try:
                    age = int(age_str)
                    birth_year = CURRENT_YEAR - age
                    new_birthdate = random_birthdate(birth_year)
                    if not current_birthdate:
                        cur.execute("UPDATE trainer SET birthdate = ? WHERE id = ?", (new_birthdate, trainer_id))
                        print(f"Updated birthdate for trainer {fname} {lname} to {new_birthdate}.")
                except ValueError:
                    print(f"Invalid age '{age_str}' for trainer {fname} {lname}.")
                
                conn.commit()
            else:
                # New trainer: compute birthdate from age.
                try:
                    age = int(age_str)
                    birth_year = CURRENT_YEAR - age
                    birthdate = random_birthdate(birth_year)
                except ValueError:
                    birthdate = None

                if rating_str.lower() == "inactive":
                    pwtr_rating = None
                    active_status = False
                elif rating_str.lower() == "rating":
                    pwtr_rating = None
                    active_status = True
                else:
                    try:
                        base_rating = float(rating_str)
                        pwtr_rating = randomize_rating(base_rating)
                        active_status = True
                    except ValueError:
                        pwtr_rating = None
                        active_status = True

                # For peak, if a number is provided, use it; otherwise, if not provided, assume the trainer already has a peak.
                if peak_str.lower() not in ("inactive", "peak") and peak_str.isdigit():
                    trainer_peak = int(peak_str)
                else:
                    trainer_peak = None  # We'll later use existing trainer data if available.

                trainer_id = insert_trainer(conn, fname, lname, current_region_id, birthdate, pwtr_rating, trainer_peak, active_status)

            # Process hometown(s)
            if hometown_str.lower() != "hometown":
                hometowns = [h.strip() for h in hometown_str.split("+")]
                city_ids = []
                for h in hometowns:
                    if "," in h:
                        city_name, regionName = [x.strip() for x in h.split(",", 1)]
                        region_id = get_region_id(conn, regionName)
                        if region_id:
                            city_id = get_city_id(conn, city_name, region_id)
                            city_ids.append(city_id)
                    else:
                        print(f"Could not parse hometown '{h}' for trainer {fname} {lname}.")
                if city_ids:
                    update_trainer_hometown(conn, trainer_id, city_ids)
                else:
                    print(f"Trainer {fname} {lname} has no valid hometowns from input '{hometown_str}'.")

            # Process trainer rating/peak updates for existing trainers
            if trainer_exists(conn, fname, lname):
                cur.execute("SELECT pwtr_rating, peak_rank FROM trainer WHERE id = ?", (trainer_id,))
                row = cur.fetchone()
                if row and (row[0] is not None) and rating_str.lower() == "rating":
                    print(f"Trainer {fname} {lname} already has a pwtr_rating; input rating ignored.")
                if row and (row[1] is not None) and peak_str.lower() == "peak":
                    print(f"Trainer {fname} {lname} already has a peak_rank; input peak ignored.")

            # Process Pokemon list.
            if pokemon_str.lower() == "pokemon":
                print(f"Skipping Pokemon for trainer {fname} {lname} (pokemon field is 'pokemon').")
                continue

            # Determine trainer_peak for level adjustment: if not provided on this line, use existing peak_rank from trainer row.
            cur.execute("SELECT peak_rank FROM trainer WHERE id = ?", (trainer_id,))
            row = cur.fetchone()
            if peak_str.lower() not in ("inactive", "peak") and peak_str.isdigit():
                trainer_peak = int(peak_str)
            elif row and row[0] is not None:
                trainer_peak = row[0]
            else:
                trainer_peak = 100  # default

            # Determine the max level for the trainer
            max_level = determine_max_level(trainer_peak)
            
            # Process each Pokemon entry (separated by "+")
            pokemon_entries = [p.strip() for p in pokemon_str.split("+")]
            adjustment = 0
            first_pokemon = True
            
            for entry in pokemon_entries:
                parts = [p.strip() for p in entry.split(",")]
                if len(parts) < 2:
                    print(f"Invalid pokemon entry '{entry}' for trainer {fname} {lname}")
                    continue
            
                poke_name_raw, level_str = parts[0], parts[1]
                # Determine if the pokemon is a variant
                is_gigantamax = False
                is_mega = False
                poke_name = poke_name_raw.lower()
                # Check for suffixes
                if re.search(r"-gmax$", poke_name):
                    is_gigantamax = True
                    poke_name = re.sub(r"-gmax$", "", poke_name)
                elif re.search(r"-mega(-x|-y)?$", poke_name):
                    is_mega = True
                    poke_name = re.sub(r"-mega(-x|-y)?$", "", poke_name)
            
                try:
                    input_level = int(level_str)
                except ValueError:
                    print(f"Invalid level '{level_str}' for pokemon '{poke_name_raw}'")
                    continue
            
                if first_pokemon:
                    # Adjust the level of the first Pokémon if necessary
                    if input_level > max_level:
                        adjustment = input_level - max_level
                        adjusted_level = max_level
                    else:
                        adjusted_level = input_level
                    first_pokemon = False
                else:
                    # Apply the same adjustment to all subsequent Pokémon
                    adjusted_level = max(1, input_level - adjustment)  # Ensure level does not go below 1
                
                adjusted_level = int(adjusted_level)
            
                # If pokemon is missing (e.g., just the word "pokemon"), skip.
                if poke_name == "pokemon":
                    print(f"Skipping Pokemon entry 'pokemon' for trainer {fname} {lname}")
                    continue
            
                poke_id, species_id = extract_pokemon_ids(poke_name)
                if poke_id is None or species_id is None:
                    print(f"Could not extract IDs for pokemon '{poke_name_raw}' (lookup as '{poke_name}')")
                    continue
            
                insert_pokemon(conn, trainer_id, species_id, poke_id, adjusted_level, is_gigantamax, is_mega)
    conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python migrate_trainers.py <input_file>")
        sys.exit(1)
    migrate_trainers(sys.argv[1])
