import os
import sqlite3
import random
import requests
from datetime import datetime, timedelta

# Poke Ball IDs (from your examples)
POKE_BALL_ID   = 4  # 50% chance
ULTRA_BALL_ID  = 2  # 35% chance
GREAT_BALL_ID  = 3  # 15% chance

# Max date: Jan 1, 2036
END_DATE = datetime(2036, 1, 1)

def fetch_gender_rate(species_id: int) -> int:
    """
    Calls the PokéAPI to fetch the 'gender_rate' for a given species_id.
    gender_rate = -1 => Genderless
    Otherwise, 0..8 => female ratio in eighths (ex: 4 => 50% female).
    
    If the API call fails, we'll default to 4 => 50% female for safety.
    """
    url = f"https://pokeapi.co/api/v2/pokemon-species/{species_id}"
    try:
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            # gender_rate: -1 => genderless, else 0..8
            return data.get("gender_rate", 4)
        else:
            print(f"Warning: PokeAPI call failed for species_id={species_id}, code={resp.status_code}")
            return 4
    except Exception as e:
        print(f"Warning: request error for species_id={species_id}, error={e}")
        return 4

def randomize_gender(gender_rate: int) -> str:
    """
    If gender_rate = -1 => "genderless"
    Else we do a random(0..7) compare to gender_rate to pick 'female' or 'male'.
    
    Example: gender_rate=4 => 50% female; if random < 4 => female, else male.
    """
    if gender_rate == -1:
        return "genderless"
    roll = random.randint(0, 7)  # 0..7
    if roll < gender_rate:
        return "female"
    return "male"

def pick_pokeball_id() -> int:
    """
    50% => poke-ball (4)
    35% => ultra-ball (2)
    15% => great-ball (3)
    """
    r = random.random()  # 0..1
    if r < 0.50:
        return POKE_BALL_ID
    elif r < 0.85:
        return ULTRA_BALL_ID
    else:
        return GREAT_BALL_ID

def random_training_efficiency(level: int) -> int:
    """
    For now, we place nearly all Pokémon in the 60..99 range, 
    maybe slightly weighting higher-level Pokémon up toward 80..99.
    """
    # If high level => favor higher range
    if level >= 50:
        return random.randint(80, 99)
    else:
        return random.randint(60, 99)

def random_level_met(level: int, is_highest_for_trainer: bool) -> int:
    """
    If this is the trainer's highest-level Pokémon, 
    we assume it was the "first" (caught at a very low level).
    Otherwise, we can pick a broader range.
    """
    if level <= 1:
        return 1
    if is_highest_for_trainer:
        # Weigh heavily in 1..10
        # but clamp to level-1
        upper = min(level - 1, 10)
        return random.randint(1, upper) if upper >= 1 else 1
    else:
        # Caught it later => random from 1..(level or 20, e.g.)
        upper = max(level - 1, 20)
        if upper > 1:
            return random.randint(1, upper)
        else:
            return 1

def random_date_met(birthdate: str, is_highest_for_trainer: bool) -> str:
    """
    - Parse the trainer's birthdate, assume journey starts at (birth year + 10).
    - End date is the earlier of global END_DATE or 12 years after journey start.
    - If it's the highest-level Pokémon => randomly skew to the first half of that range.
    - Otherwise => pick within the entire range, but favor earlier dates using a triangular distribution that peaks at start.
    """
    try:
        bdt = datetime.strptime(birthdate, "%Y-%m-%d")
    except:
        # fallback: pick random date in [2000..2036], triangular skew toward 2000
        start = datetime(2000, 1, 1)
        final_end = END_DATE
        delta = (final_end - start).days
        # Triangular distribution strongly favors the start
        random_days = int(random.triangular(0, delta, 0))
        met_date = start + timedelta(days=random_days)
        return met_date.strftime("%Y-%m-%d")

    # Journey starts at age 10
    if(bdt.month == 2 and bdt.day == 29):
        start_journey = datetime(bdt.year + 10, 3, 1)
    else:
        start_journey = datetime(bdt.year + 10, bdt.month, bdt.day)

    # Clamp journey start to no earlier than 1900
    if start_journey < datetime(1900, 1, 1):
        start_journey = datetime(1900, 1, 1)

    # Calculate up to 12 years after start_journey, or END_DATE, whichever is earlier
    twelve_years_later = start_journey.replace(year=start_journey.year + 12)
    final_end = min(twelve_years_later, END_DATE)

    # If the journey start is after final_end, return final_end
    if start_journey > final_end:
        return final_end.strftime("%Y-%m-%d")

    delta = (final_end - start_journey).days
    if delta < 1:
        return final_end.strftime("%Y-%m-%d")

    # If highest-level => pick from the first half of [start_journey..final_end], triangular skew
    # Otherwise => pick from the entire range, triangular skew
    if is_highest_for_trainer:
        half_days = delta // 6
        random_days = int(random.triangular(0, half_days, 0))
    else:
        random_days = int(random.triangular(0, delta, 0))

    met_date = start_journey + timedelta(days=random_days)
    return met_date.strftime("%Y-%m-%d")

def main():
    script_dir = os.path.dirname(__file__)
    db_path = os.path.join(script_dir, '..', 'db.sqlite')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1) Build a dictionary: trainer_id -> (fname, birthdate)
    cursor.execute("SELECT id, fname, birthdate FROM trainer")
    trainer_info = {}
    for row in cursor.fetchall():
        trainer_info[row["id"]] = {
            "fname": row["fname"],
            "birthdate": row["birthdate"]
        }

    # 2) For each trainer, figure out the 6th highest-level Pokemon
    #    So we can treat that as "first Pokemon" if we like.
    #    We'll store: highest_level[trainer_id] = some_level
    highest_level = {}
    cursor.execute("""
        SELECT trainer_id, level
        FROM (
            SELECT trainer_id, level,
                   ROW_NUMBER() OVER (PARTITION BY trainer_id ORDER BY level DESC) AS rank
            FROM pokemon
        ) ranked
        WHERE rank = 6
    """)
    for row in cursor.fetchall():
        highest_level[row["trainer_id"]] = row["level"] if row["level"] else 1

    # 3) Now fetch all Pokemon that we want to update
    #    (We'll skip if the relevant fields are already set, if you want.)
    #    For example, skip if gender is not NULL, etc. But let's just do all.
    cursor.execute("""
        SELECT p.id, p.trainer_id, p.species_id, p.pokemon_id, p.level,
               p.nickname, p.ot_name, p.ot_id, p.gender,
               t.fname, t.birthdate
        FROM pokemon p
        JOIN trainer t ON p.trainer_id = t.id
    """)
    all_pokemon = cursor.fetchall()

    updates_count = 0

    for pk_row in all_pokemon:
        pk_id       = pk_row["id"]
        trainer_id  = pk_row["trainer_id"]
        species_id  = pk_row["species_id"]
        level       = pk_row["level"]
        nickname    = pk_row["nickname"]
        trainer_f   = pk_row["fname"]
        birthdate   = pk_row["birthdate"]

        # 4) ot_id = trainer_id; ot_name = trainer_f
        ot_id   = trainer_id
        ot_name = trainer_f

        # 5) gender => fetch from PokeAPI (or a local fallback)
        gender_rate = fetch_gender_rate(species_id)
        final_gender = randomize_gender(gender_rate)

        # 6) shiny = false
        shiny = False

        # 7) pokeball_id => 50% poke-ball(4), 35% ultra(2), 15% great(3)
        pokeball_id = pick_pokeball_id()

        # 8) held_item_id = 0
        held_item_id = 0

        # 9) current_hp = 100, current_strength = 100, status_id = 0
        current_hp       = 100
        current_strength = 100
        status_id        = 0

        # 10) training_efficiency => 60..99, maybe higher if level>50
        t_eff = random_training_efficiency(level)

        # 11) level_met_at => if it's the trainer's highest-level Pokemon => random 1..10
        max_l = highest_level.get(trainer_id, 1)
        is_highest = (level >= max_l)
        level_met = random_level_met(level, is_highest)

        # 12) date_met_at => random in [birth+10 .. 2036], earlier if is_highest
        date_met = random_date_met(birthdate, is_highest)

        # future stats (EVs, IVs, battles_won, etc.) => skipped for now
        # e.g. ev_hp, iv_hp, kills, etc.

        # print all the previous data
        # Print all the previous data
        print(f"Updating Pokémon ID: {pk_id}")
        print(f"Trainer ID: {trainer_id}")
        print(f"Species ID: {species_id}")
        print(f"Level: {level}")
        print(f"Nickname: {nickname}")
        print(f"Trainer Name: {trainer_f}")
        print(f"Birthdate: {birthdate}")
        print(f"OT Name: {ot_name}")
        print(f"OT ID: {ot_id}")
        print(f"Gender: {final_gender}")
        print(f"Shiny: {shiny}")
        print(f"Poké Ball ID: {pokeball_id}")
        print(f"Held Item ID: {held_item_id}")
        print(f"Current HP: {current_hp}")
        print(f"Current Strength: {current_strength}")
        print(f"Status ID: {status_id}")
        print(f"Training Efficiency: {t_eff}")
        print(f"Max l: {max_l}")
        print(f"Level Met At: {level_met}")
        print(f"Date Met At: {date_met}")
        print("-" * 40)


        # 13) Construct the SQL update
        # We'll update the relevant columns
        cursor.execute("""
            UPDATE pokemon
            SET ot_name = ?,
                ot_id = ?,
                gender = ?,
                shiny = ?,
                pokeball_id = ?,
                held_item_id = ?,
                current_hp = ?,
                current_strength = ?,
                status_id = ?,
                training_efficiency = ?,
                level_met_at = ?,
                date_met_at = ?
            WHERE id = ?
        """, (
            ot_name,
            ot_id,
            final_gender,
            int(shiny),  # 0 or 1 in DB if it's boolean
            pokeball_id,
            held_item_id,
            current_hp,
            current_strength,
            status_id,
            t_eff,
            level_met,
            date_met,
            pk_id
        ))
        updates_count += 1

    conn.commit()
    conn.close()
    print(f"Done! Updated {updates_count} Pokémon.")

if __name__ == "__main__":
    main()
