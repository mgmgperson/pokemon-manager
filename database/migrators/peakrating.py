import os
import sqlite3
import math
import random
from datetime import datetime

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
]

def interpolate_rating_from_rank(rank_val: int) -> float:
    """
    Piecewise-linear interpolation among RANK_BREAKPOINTS.
    If rank_val < first or > last, we clamp to the first/last rating.
    """
    if rank_val <= RANK_BREAKPOINTS[0][0]:
        return float(RANK_BREAKPOINTS[0][1])

    if rank_val >= RANK_BREAKPOINTS[-1][0]:
        return float(RANK_BREAKPOINTS[-1][1])

    for i in range(len(RANK_BREAKPOINTS) - 1):
        r1, rating1 = RANK_BREAKPOINTS[i]
        r2, rating2 = RANK_BREAKPOINTS[i + 1]

        if r1 <= rank_val <= r2:
            ratio = (rank_val - r1) / float(r2 - r1)
            interpolated = rating1 + ratio * (rating2 - rating1)
            return interpolated

    return float(RANK_BREAKPOINTS[-1][1])  # fallback

def compute_age_from_birthdate(birthdate_str: str) -> int:
    """
    Given birthdate in 'YYYY-MM-DD' format, return integer age as of 2036-01-01.
    If parsing fails, return -1.
    """
    try:
        birthdate = datetime.strptime(birthdate_str, "%Y-%m-%d")
        ref_date = datetime(2036, 1, 1) 
        age = ref_date.year - birthdate.year

        if (ref_date.month, ref_date.day) < (birthdate.month, birthdate.day):
            age -= 1

        return age
    except:
        return -1

def estimate_peak_rating(peak_rank: int, current_rank: int, age: int, current_rating: float) -> float:
    """
    1) Base rating from piecewise interpolation of peak_rank.
    2) If older (age > some threshold), reduce base rating.
    3) If peak_rank is drastically better than current_rank, reduce further.
    4) If peak_rank ~ current_rank => keep final rating near current_rating.
    5) Add random noise, clamp results, etc.
    6) If final < current_rating => final = current_rating.
    Returns a two-decimal float.
    """
    base = interpolate_rating_from_rank(peak_rank)

    age_factor = 0
    if age >= 30:
        yrs_over = age - 30
        age_factor = random.randint(1, 3) * yrs_over

    rank_factor = 0
    if peak_rank * 2 < current_rank:
        rank_factor = random.randint(30, 80)
    elif peak_rank < current_rank:
        rank_factor = random.randint(10, 30)

    near_distance = 5
    is_near = abs(peak_rank - current_rank) <= near_distance

    noise_decimal = random.uniform(-25, 25)

    if is_near:
        final_rating = current_rating + random.uniform(-50, 50)
    else:
        final_rating = base - age_factor - rank_factor + noise_decimal

    if final_rating < 3000:
        final_rating = 3000 + random.uniform(0, 50)

    if final_rating > 4500:
        final_rating = 4500

    if final_rating < current_rating:
        final_rating = current_rating

    return round(final_rating, 2)

def main():
    script_dir = os.path.dirname(__file__)
    conn = sqlite3.connect(os.path.join(script_dir, '..', 'db.sqlite'))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, fname, lname, birthdate, peak_rank, peak_rating, pwtr_rating
        FROM trainer
        WHERE active_status = 1
        ORDER BY pwtr_rating DESC
    """)
    trainers_data = cursor.fetchall()

    trainer_current_rank = {}
    for i, row in enumerate(trainers_data, start=1):
        trainer_id = row["id"]
        trainer_current_rank[trainer_id] = i

    updates_count = 0

    for row in trainers_data:
        trainer_id = row["id"]
        birthdate = row["birthdate"]
        peak_rank = row["peak_rank"]       
        peak_rating = row["peak_rating"]   
        current_rating = row["pwtr_rating"]
        current_rank = trainer_current_rank[trainer_id]

        if peak_rating is not None:
            continue
        if not birthdate or peak_rank is None:
            continue

        age = compute_age_from_birthdate(birthdate)
        if age < 0:
            continue  # invalid birthdate => skip

        new_peak = estimate_peak_rating(peak_rank, current_rank, age, current_rating)

        print(f"Trainer {trainer_id}: {row['fname']} {row['lname']} ({age} years) => peak_rating: {new_peak}")
        # 5) Update
        cursor.execute("""
            UPDATE trainer
            SET peak_rating = ?
            WHERE id = ?
        """, (new_peak, trainer_id))
        updates_count += 1

    conn.commit()
    conn.close()

    print(f"Done! Updated peak_rating for {updates_count} trainers.")

if __name__ == "__main__":
    main()
