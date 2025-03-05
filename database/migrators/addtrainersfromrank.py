#!/usr/bin/env python3

import os
import sys
import sqlite3
import random

# 1) Rank breakpoints and interpolation
RANK_BREAKPOINTS = [
    (1,   4500),
    (10,  4330),
    (20,  4255),
    (30,  4200),
    (50,  4129),
    (75,  4055),
    (100, 4003),
    (150, 3915),
    (200, 3834),
    (250, 3775),
    (300, 3750),
    (350, 3725),
    (400, 3700),
    (450, 3680),
    (500, 3660),
    (600, 3630),
    (700, 3600),
    (800, 3570),
    (900, 3540),
    (1000, 3510),
    (1200, 3480),
    (1500, 3450),
    (1800, 3420),
    (2000, 3400),
]

def interpolate_rating_from_rank(rank_val: int) -> float:
    """
    Piecewise-linear interpolation among RANK_BREAKPOINTS.
    If rank_val <= first breakpoint, clamp to first rating;
    If rank_val >= last breakpoint, clamp to last rating.
    Otherwise, linear interpolation between breakpoints.
    """
    if rank_val <= RANK_BREAKPOINTS[0][0]:
        return float(RANK_BREAKPOINTS[0][1])

    if rank_val >= RANK_BREAKPOINTS[-1][0]:
        return float(RANK_BREAKPOINTS[-1][1])

    for i in range(len(RANK_BREAKPOINTS) - 1):
        r1, rating1 = RANK_BREAKPOINTS[i]
        r2, rating2 = RANK_BREAKPOINTS[i+1]

        if r1 <= rank_val <= r2:
            ratio = (rank_val - r1) / float(r2 - r1)
            interpolated = rating1 + ratio * (rating2 - rating1)
            return interpolated

    # fallback
    return float(RANK_BREAKPOINTS[-1][1])

def generate_rating_from_rank(rank_val: int) -> float:
    """
    Using interpolate_rating_from_rank() plus some small random offset if desired.
    """
    base = interpolate_rating_from_rank(rank_val)
    # optionally add ± up to ~50
    offset = random.uniform(-30, 30)
    final_rating = base + offset
    # clamp if you want a min or max, e.g. 3000..4500
    if final_rating < 3000:
        final_rating = 3000
    if final_rating > 4500:
        final_rating = 4500
    return final_rating

def add_trainers_from_ranktxt(file_path: str, db_path: str):
    """
    Reads a .txt file line by line.
    A typical line might look like:
        Erika Ren (87), Rank 52
    We'll parse:
      - Name up to the first '(' => 'Erika Ren'
         * Fname = 'Erika', Lname = 'Ren'
      - The rating in parentheses might be '87' but we might or might not store it
      - The rank after "Rank" => e.g. 52
      If the line doesn't contain 'Rank', skip it.
    
    For each trainer name, we do:
      1) Check if trainer is in DB (by matching fname/lname ignoring case).
         a) If not found -> Insert with region_id=0 or something + name
         b) If found and that trainer's pwtr_rating is NULL, or is a newly inserted trainer:
              -> generate a rating from rank with generate_rating_from_rank() 
                 and store it in trainer.pwtr_rating
    Also skip lines like "Stadium: Cerulean Camp Stade (59k)" or anything w/o "Rank".
    """
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    lines = [line.strip() for line in lines]

    for line in lines:
        if "Rank" not in line:
            # skip lines that don't mention "Rank"
            continue

        # Example line: "Erika Ren (87), Rank 52"
        # 1) parse the name up to the first '(' => "Erika Ren "
        #    or if there's no '(', parse up to the comma? We'll assume parentheses always present for rating
        # We'll do something more robust:

        # We'll split on 'Rank' first:
        # e.g. left = "Erika Ren (87), ", right = " 52"
        parts = line.split("Rank")
        if len(parts) < 2:
            # invalid
            continue

        left_part = parts[0].strip()  # "Erika Ren (87),"
        right_part = parts[1].strip() # "52" maybe with trailing text

        # parse rank
        # we can split the right_part on spaces, take first token as rank
        rank_str = right_part.split()[0]
        try:
            rank_val = int(rank_str)
        except:
            # can't parse rank => skip
            continue

        # parse name from left_part
        # left_part might be something like: "Erika Ren (87),"
        # let's remove anything after the first '('
        # so we do an index
        bracket_idx = left_part.find('(')
        if bracket_idx == -1:
            # maybe there's no rating in parentheses
            bracket_idx = len(left_part)  # e.g. "Erika Ren," no parentheses

        raw_name = left_part[:bracket_idx].strip().rstrip(',')  
        # e.g. "Erika Ren"

        # Now we do: Fname = first word, Lname = everything else
        tokens = raw_name.split(None, 1)
        if len(tokens) < 2:
            # not enough tokens => skip
            continue
        fname = tokens[0]
        lname = tokens[1]

        # now check DB
        cursor.execute("""
            SELECT id, pwtr_rating
            FROM trainer
            WHERE LOWER(fname) = LOWER(?)
              AND LOWER(lname) = LOWER(?)
        """, (fname, lname))
        row = cursor.fetchone()

        if row:
            trainer_id = row['id']
            existing_rating = row['pwtr_rating']
            if existing_rating is None:
                # need to assign a rating
                new_rating = generate_rating_from_rank(rank_val)
                # update new rating to two decimal places
                new_rating = round(new_rating, 2)
                print(f"Updating {fname} {lname} with rating {new_rating:.2f} (rank={rank_val})")
                cursor.execute("""
                    UPDATE trainer
                    SET pwtr_rating = ?
                    WHERE id = ?
                """, (new_rating, trainer_id))
        else:
            # no match => insert new trainer
            # region_id=0 or whatever
            cursor.execute("""
                INSERT INTO trainer (fname, lname, region_id)
                VALUES (?, ?, 0)
            """, (fname, lname))
            trainer_id = cursor.lastrowid
            # now add rating
            new_rating = generate_rating_from_rank(rank_val)
            new_rating = round(new_rating, 2)
            print(f"Adding new trainer: {fname} {lname} with rating {new_rating:.2f} (rank={rank_val})")
            cursor.execute("""
                UPDATE trainer
                SET pwtr_rating = ?
                WHERE id = ?
            """, (new_rating, trainer_id))

    conn.commit()
    conn.close()
    print("Done reading lines and updating trainers.")

def main():
    """
    Usage:
      python addtrainersfromrank.py input.txt db.sqlite

    Example lines in input.txt:
      Players:
      Erika Ren (87), Rank 52
      Lorelei Kanna (82), Rank 107
      Misty Kasumi (78), Rank 170
      ...
    """
    if len(sys.argv) < 3:
        print("Usage: addtrainersfromrank.py <input.txt> <db.sqlite>")
        sys.exit(1)

    file_path = sys.argv[1]
    db_path = sys.argv[2]

    if not os.path.isfile(file_path):
        print(f"Error: file not found: {file_path}")
        sys.exit(1)

    add_trainers_from_ranktxt(file_path, db_path)

if __name__ == "__main__":
    main()
