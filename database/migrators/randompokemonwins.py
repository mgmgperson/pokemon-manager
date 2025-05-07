import os
import sqlite3
import random
from datetime import datetime

END_DATE = datetime(2036, 1, 1)

# Region start years
REGION_START_YEAR = {
    "Kanto": 1996,
    "Johto": 1999,
    "Hoenn": 2002,
    "Sinnoh": 2004,
    "Unova": 2004,
    "Kalos": 2006,
    "Alola": 2006,
    "Alaken": 2010,
    "Haypi": 2010,
    "Tunod": 2012,
    "Galar": 2012,
    "Archenland": 2016,
}

def get_region_start_year(region_name: str) -> int:
    """
    Look up the year a region became active. If not found, default to 1996.
    """
    return REGION_START_YEAR.get(region_name, 1996)

def era_battles_per_year(trainer_rank: int, era: int) -> float:
    """
    Return the approximate battles/year for the given era index (1,2,3) 
    and trainer rank (1..300+).
    We'll linearly interpolate between:
      rank=1   -> (Era1=60,  Era2=90,  Era3=130)
      rank=300 -> (Era1=40,  Era2=70,  Era3=100)
    Then we add a random variation ±10%.
    """
    # clamp rank to [1..300]
    r = max(1, min(300, trainer_rank))

    # Era battles for rank=1 and rank=300
    if era == 1:
        #  from region start -> 2012
        battles_rank1   = 60
        battles_rank300 = 40
    elif era == 2:
        #  2012 -> 2026
        battles_rank1   = 90
        battles_rank300 = 70
    else:
        #  2026 -> 2036
        battles_rank1   = 130
        battles_rank300 = 100

    # linear interpolation
    ratio = (r - 1) / (300 - 1)  # 0..1
    battles_approx = battles_rank1 + ratio * (battles_rank300 - battles_rank1)
    # NOTE: if battles_rank300 < battles_rank1, reverse the sign. But here rank1 > rank300.
    # Actually, we want rank=1 => bigger number, rank=300 => smaller => just invert logic:
    # swap the order or do a negative ratio. Let's do it carefully:
    # rank=1 => ratio=0 => battles_rank1 => e.g. 60
    # rank=300 => ratio=1 => battles_rank300 => e.g. 40
    # That means if battles_rank300 < battles_rank1 => final is decreasing with rank.
    # So let's ensure battles_rank1 > battles_rank300 in era1,2,3 if we want that.

    # random ±10%
    variation = random.uniform(0.9, 1.1)
    return battles_approx * variation

def partial_era_years(start_date: datetime, end_date: datetime, 
                      era_start: datetime, era_end: datetime) -> float:
    """
    Return how many years within [start_date..end_date] overlap 
    with [era_start..era_end]. Could be fractional. 
    """
    # find the intersection
    real_start = max(start_date, era_start)
    real_end   = min(end_date, era_end)
    if real_end <= real_start:
        return 0.0
    diff_days = (real_end - real_start).days
    return diff_days / 365.0

def compute_trainer_annual_battles(trainer_rank: int, 
                                   region_start: int, 
                                   trainer_start: datetime) -> float:
    """
    Sum up partial years across the 3 eras:
      Era1: [region_start..2012), 40..60 or 60..40 range
      Era2: [2012..2026)
      Era3: [2026..2036)
    Return the total "effective" battles/year, 
    but we do partial coverage for each era segment.
    Actually, we sum (partial_years_in_era * battles_in_era)/ total_years to get average 
    OR we sum them absolutely to get total battles, 
    then we might multiply by usage fraction later.

    Implementation approach:
    1) The earliest start date is max( region_start, trainer_start ).
    2) For each era, compute overlap in years, multiply by era_battles. 
       Then sum. We'll get total battles across entire timeline. 
       Then we can eventually distribute that to Pokémon usage fraction.

    But an alternative approach: We want actual total battles across time,
    so if there's 2.3 years in era1 => era1_battles * 2.3, etc.
    We'll return that total. 
    """

    # The absolute earliest possible day is Jan 1 of region_start
    region_start_date = datetime(region_start, 1, 1)
    actual_start_date = max(region_start_date, trainer_start)  # the final start

    if actual_start_date >= END_DATE:
        return 0.0

    total_battles = 0.0

    # define era1 = [region_start_date..2012-01-01)
    era1_start = region_start_date
    era1_end   = datetime(2012, 1, 1)

    # era2 = [2012..2026)
    era2_start = datetime(2012, 1, 1)
    era2_end   = datetime(2026, 1, 1)

    # era3 = [2026..2036)
    era3_start = datetime(2026, 1, 1)
    era3_end   = END_DATE

    # partial years in era1
    p1 = partial_era_years(actual_start_date, END_DATE, era1_start, era1_end)
    if p1 > 0:
        # battles/year for era1
        b1 = era_battles_per_year(trainer_rank, 1)
        total_battles += b1 * p1

    # partial years in era2
    p2 = partial_era_years(actual_start_date, END_DATE, era2_start, era2_end)
    if p2 > 0:
        b2 = era_battles_per_year(trainer_rank, 2)
        total_battles += b2 * p2

    # partial years in era3
    p3 = partial_era_years(actual_start_date, END_DATE, era3_start, era3_end)
    if p3 > 0:
        b3 = era_battles_per_year(trainer_rank, 3)
        total_battles += b3 * p3

    return total_battles

def usage_fraction(index_in_team: int) -> float:
    """
    Return approximate fraction of battles that a Pokemon (by level rank within the trainer's team)
    participates in. 
    - top 3 => 75%
    - next 6 => 50%
    - rest => 20%
    plus ±15% random.
    """
    if index_in_team < 3:
        frac = 0.75
    elif index_in_team < 9:
        frac = 0.50
    else:
        frac = 0.20
    frac *= random.uniform(0.85, 1.15)
    return min(1.0, max(0.0, frac))

def win_rate_for_pokemon(trainer_rank: int, level: int, index_in_team: int) -> float:
    """
    Win rate depends on trainer rank & Pokemon level, top-of-team bonus, etc.
    Example interpolation: rank=10 => ~0.90, rank=300 => ~0.60
    Then +0.05 if level>=50, +0.05 if top 3, ±5% random.
    Clamped [0.40..0.95].
    """
    # clamp rank [10..300]
    rmin, rmax = 10, 300
    wmin, wmax = 0.90, 0.60

    if trainer_rank <= rmin:
        base = wmin
    elif trainer_rank >= rmax:
        base = wmax
    else:
        ratio = (trainer_rank - rmin) / float(rmax - rmin)
        base = wmin + ratio * (wmax - wmin)

    bonus = 0.0
    if level >= 50:
        bonus += 0.05
    if index_in_team < 3:
        bonus += 0.05

    wr = base + bonus
    wr *= random.uniform(0.95, 1.05)
    wr = min(0.95, max(0.40, wr))
    return wr

def kills_per_battle(index_in_team: int) -> float:
    """
    Ratio of kills to battles. e.g. top mon => ~1.2, next => ~1.0, then ~0.7 or 0.4, etc.
    ±20% random.
    """
    if index_in_team == 0:
        base = 1.2
    elif index_in_team < 3:
        base = 1.0
    elif index_in_team < 9:
        base = 0.7
    else:
        base = 0.4
    ratio = base * random.uniform(0.8, 1.2)
    return ratio

def survive_rate_in_win(index_in_team: int) -> float:
    """
    Probability the Pokemon is alive at the end of a winning battle.
    top mon => ~50%, next => 30%, mid => 15%, low => 5%, ±20% random.
    """
    if index_in_team == 0:
        base = 0.50
    elif index_in_team < 3:
        base = 0.30
    elif index_in_team < 9:
        base = 0.15
    else:
        base = 0.05
    sr = base * random.uniform(0.8, 1.2)
    sr = min(1.0, max(0.0, sr))
    return sr

def main():
    script_dir = os.path.dirname(__file__)
    db_path = os.path.join(script_dir, '..', 'db.sqlite')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1) Gather region_id->region_name->region_year
    # We'll join trainer->region to get region_name
    cursor.execute("""
        SELECT id, name 
        FROM region
    """)
    region_map = {}  # region_id -> region_name
    for row in cursor.fetchall():
        region_map[row["id"]] = row["name"]

    # 2) Build trainer data: 
    #   - rank (by ordering on pwtr_rating descending), 
    #   - birthdate, region_id => region_name => start_year
    # We'll create a dictionary trainer_info = { trainer_id: { rank, birthdate, region_start_year, ...} }
    cursor.execute("""
        SELECT t.id AS trainer_id, t.region_id, t.birthdate, t.pwtr_rating
        FROM trainer t
        WHERE t.active_status = 1
        ORDER BY t.pwtr_rating DESC
    """)
    trainers = cursor.fetchall()
    trainer_info = {}
    current_rank = 1
    for row in trainers:
        tid = row["trainer_id"]
        region_id = row["region_id"]
        region_name = region_map.get(region_id, "Kanto")
        r_start = get_region_start_year(region_name)

        trainer_info[tid] = {
            "rank": current_rank,
            "birthdate": row["birthdate"],
            "region_year": r_start,
            "pwtr_rating": row["pwtr_rating"]
        }
        current_rank += 1

    # 3) Build a map of Pokemon for each trainer, sorted by level DESC
    cursor.execute("""
        SELECT p.id AS pk_id,
               p.trainer_id,
               p.level,
               p.date_met_at,
               p.battles_won,
               p.battles_lost,
               p.kills,
               p.deaths
        FROM pokemon p
        JOIN trainer t ON p.trainer_id = t.id
        WHERE t.active_status=1 AND p.kills IS NULL AND p.deaths IS NULL
        ORDER BY p.trainer_id, p.level DESC
    """)
    from collections import defaultdict
    trainer_pokemon_map = defaultdict(list)
    all_pk = cursor.fetchall()
    for row in all_pk:
        tr_id = row["trainer_id"]
        trainer_pokemon_map[tr_id].append(row)

    updates_count = 0

    # 4) For each trainer, compute total battles from region start->2036 (split eras),
    #    then distribute to each Pokemon based on usage fraction & years of ownership 
    #    (the start date is max of region_start_date, trainer's 15th bday, pokemon met date)
    for tr_id, pk_list in trainer_pokemon_map.items():
        tinfo = trainer_info.get(tr_id)
        if not tinfo:
            continue

        trainer_rank = tinfo["rank"]
        birth_str    = tinfo["birthdate"]  # can be None
        region_year  = tinfo["region_year"]

        # We'll compute an "annual battles" *across the eras*, 
        # but we need the actual start date for each Pokemon 
        # to figure partial coverage. We'll do a function that lumps it 
        # but we’ll do it individually per Pokemon so the date_met_at matters.

        for idx, row in enumerate(pk_list):
            pk_id        = row["pk_id"]
            level        = row["level"]
            date_met_str = row["date_met_at"]
            # we parse trainer's 15th birthday
            start_candidates = []

            # region start => Jan 1
            region_start_date = datetime(region_year, 1, 1)
            start_candidates.append(region_start_date)

            # trainer's 15th birthday
            if birth_str:
                try:
                    bdt = datetime.strptime(birth_str, "%Y-%m-%d")
                    d15 = datetime(bdt.year + 15, bdt.month, bdt.day)
                    start_candidates.append(d15)
                except:
                    pass

            # date_met_at
            if date_met_str:
                try:
                    dmet = datetime.strptime(date_met_str, "%Y-%m-%d")
                    start_candidates.append(dmet)
                except:
                    pass

            # pick the max
            real_start = max(start_candidates) if start_candidates else None
            if (not real_start) or real_start >= END_DATE:
                # no coverage => no battles
                battles_played = 0
            else:
                # Now we compute total battles from real_start..2036 
                # by splitting into era1, era2, era3 & rank-based interpolation
                # We'll do a local function that sums partial era coverage
                battles_played = compute_trainer_annual_battles(trainer_rank, region_year, real_start)

            # usage fraction => if the trainer might have multiple Pokemon 
            usage_frac = usage_fraction(idx)
            # final battles for this Pokemon
            battles_pokemon_float = battles_played * usage_frac
            battles_pokemon = int(round(battles_pokemon_float))

            # Now the rest: wins, kills, deaths
            wr = win_rate_for_pokemon(trainer_rank, level, idx)
            wins = int(round(battles_pokemon * wr))
            losses = battles_pokemon - wins

            k_ratio = kills_per_battle(idx)
            approximate_kills = battles_pokemon * k_ratio
            kills_ = int(round(approximate_kills))
            if kills_ > battles_pokemon:
                kills_ = battles_pokemon

            sr = survive_rate_in_win(idx)
            alive_after_win = int(round(wins * sr))
            deaths_ = battles_pokemon - alive_after_win
            if deaths_ < 0:
                deaths_ = 0
            if deaths_ > battles_pokemon:
                deaths_ = battles_pokemon

            #print all stats
            print(f"Trainer {tr_id}, Pokemon {pk_id}:")
            #print(f"  Start date: {real_start}")
            #print(f"  Total battles: {battles_played}")
            #print(f"  Usage fraction: {usage_frac}")
            print(f"  Battles for this Pokemon: {battles_pokemon}")
            print(f"  Wins: {wins}, Losses: {losses}")
            print(f"  Kills: {kills_}, Deaths: {deaths_}")


            cursor.execute("""
                UPDATE pokemon
                SET battles_won = ?,
                    battles_lost = ?,
                    kills = ?,
                    deaths = ?
                WHERE id = ? AND kills IS NULL AND deaths IS NULL
            """, (wins, losses, kills_, deaths_, pk_id))
            updates_count += 1

    conn.commit()
    conn.close()
    print(f"Done! Updated battles/wins/kills/deaths for {updates_count} Pokémon.")

if __name__ == "__main__":
    main()
