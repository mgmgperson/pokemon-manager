import os
import sqlite3
import random
import requests
import json
from datetime import datetime
from math import floor

# We’ll store local JSON files in a "cache" folder to avoid repeated downloads
CACHE_DIR = "cache"

SMOGON_URLS = [
    "https://pkmn.github.io/smogon/data/stats/gen9ou.json",
    "https://pkmn.github.io/smogon/data/stats/gen9ubers.json",
    "https://pkmn.github.io/smogon/data/stats/gen9nationaldex.json",
    "https://pkmn.github.io/smogon/data/stats/gen9nationaldexubers.json",
    "https://pkmn.github.io/smogon/data/stats/gen9uu.json",
    "https://pkmn.github.io/smogon/data/stats/gen9nationaldexuu.json",
    "https://pkmn.github.io/smogon/data/stats/gen9ru.json",
    "https://pkmn.github.io/smogon/data/stats/gen9nationaldexru.json",
    "https://pkmn.github.io/smogon/data/stats/gen9nu.json",
    "https://pkmn.github.io/smogon/data/stats/gen9pu.json",
    "https://pkmn.github.io/smogon/data/stats/gen9zu.json",
    "https://pkmn.github.io/smogon/data/stats/gen9lc.json",
    "https://pkmn.github.io/smogon/data/stats/gen8ou.json",
    "https://pkmn.github.io/smogon/data/stats/gen8ubers.json",
    "https://pkmn.github.io/smogon/data/stats/gen8nationaldex.json",
    "https://pkmn.github.io/smogon/data/stats/gen8zu.json",
    "https://pkmn.github.io/smogon/data/stats/gen7ou.json",
    "https://pkmn.github.io/smogon/data/stats/gen7ubers.json",
    "https://pkmn.github.io/smogon/data/stats/gen7zu.json",


]

POKEAPI_URL = "https://pokeapi.co/api/v2"

def ensure_cache_dir():
    if not os.path.exists(CACHE_DIR):
        os.makedirs(CACHE_DIR)

def load_json_from_url_or_cache(url: str) -> dict:
    """
    If there's a cached JSON file for this URL, load it.
    Otherwise, download and cache it.
    """
    ensure_cache_dir()
    filename = os.path.join(CACHE_DIR, url.split("/")[-1])  # e.g. 'gen9ou.json'
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            return json.load(f)
    # Otherwise download
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        # cache it
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return data
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return {}

def build_smogon_map() -> dict:
    """
    Aggregate all Smogon JSON data into a single dict:
    {
      "Beedrill-Mega": { "abilities": {...}, "spreads": {...}, ... },
      "Charizard-Mega-X": {...},
      ...
    }
    If a Pokémon name already exists, we skip adding from subsequent files.
    """
    smogon_map = {}
    for url in SMOGON_URLS:
        data = load_json_from_url_or_cache(url)
        pdict = data.get("pokemon", {})
        # For each Pokemon in this JSON, if not already in smogon_map, add it
        for mon_name, mon_data in pdict.items():
            if mon_name not in smogon_map:
                smogon_map[mon_name] = mon_data
    return smogon_map

def load_pokemon_data_from_pokeapi(pokemon_id: int) -> dict:
    """
    Hits pokeapi.co/api/v2/pokemon/{pokemon_id}, caches in 'cache/pokemon-{id}.json'.
    Returns JSON or empty dict on failure.
    """
    ensure_cache_dir()
    filename = os.path.join(CACHE_DIR, f"pokemon-{pokemon_id}.json")
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            return json.load(f)

    url = f"{POKEAPI_URL}/pokemon/{pokemon_id}"
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return data
    except Exception as e:
        print(f"Error fetching Pokemon {pokemon_id}: {e}")
        return {}

def load_ability_data(ability_name_slug: str) -> dict:
    """
    ability_name_slug = 'swift-swim' for 'Swift Swim', e.g. GET /ability/swift-swim
    Cache in 'cache/ability-swift-swim.json'
    """
    ensure_cache_dir()
    filename = os.path.join(CACHE_DIR, f"ability-{ability_name_slug}.json")
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            return json.load(f)

    url = f"{POKEAPI_URL}/ability/{ability_name_slug}"
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return data
    except Exception as e:
        print(f"Error fetching ability {ability_name_slug}: {e}")
        return {}

def load_nature_data(nature_name_slug: str) -> dict:
    """
    e.g. 'modest' => GET /nature/modest
    Cache in 'cache/nature-modest.json'
    """
    ensure_cache_dir()
    filename = os.path.join(CACHE_DIR, f"nature-{nature_name_slug}.json")
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            return json.load(f)

    url = f"{POKEAPI_URL}/nature/{nature_name_slug}"
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return data
    except Exception as e:
        print(f"Error fetching nature {nature_name_slug}: {e}")
        return {}

def transform_pokeapi_name_to_smogon(name: str) -> str:
    """
    - If name in ["mr-mime", "mr-rime"], handle special case => "Mr. Mime", "Mr. Rime"
    - Otherwise, e.g. 'rotom-wash' => 'Rotom-Wash'
    """
    if name == "mr-mime":
        return "Mr. Mime"
    if name == "mr-rime":
        return "Mr. Rime"
    if name == "darmanitan-standard":
        return "Darmanitan"
    if name == "lycanroc-midday":
        return "Lycanroc"
    if name == "aegislash-shield":
        return "Aegislash"
    if name == "mimikyu-disguised":
        return "Mimikyu"
    if name == "sirfetchd":
        return "Sirfetch’d"
    if name == "darmanitan-galar-standard":
        return "Darmanitan-Galar"
    if name == "gourgeist-average":
        return "Gourgeist"
    if name == "keldeo-ordinary":
        return "Keldeo"
    if name == "urshifu-single-strike":
        return "Urshifu"
    if name == "toxtricity-amped":
        return "Toxtricity"
    if name == "thundurus-incarnate":
        return "Thundurus"
    if name == "morpeko-full-belly":
        return "Morpeko"
    if name == "indeedee-male":
        return "Indeedee"
    if name == "meowstic-male":
        return "Meowstic"
    if name == "gourgeist-average":
        return "Gourgeist"
    if name == "greninja-ash":
        return "Greninja"
    if name == "wormadam-plant":
        return "Wormadam"
    if name == "kommo-o":
        return "Kommo-o"
    if name == "minior-red-meteor":
        return "Minior"
    if name == "eiscue-ice":
        return "Eiscue"
    if name == "ursaluna-bloodmoon":
        return "Ursaluna"
    if name == "dudunsparce-two-segment":
        return "Dudunsparce"
    if name == "palafin-zero":
        return "Palafin"
    if name == "wishiwashi-solo":
        return "Wishiwashi"
    if name == "tapu-bulu":
        return "Tapu Bulu"
    if name == "meloetta-aria":
        return "Meloetta"
    if name == "tatsugiri-curly":
        return "Tatsugiri"
    if name == "basculegion-male":
        return "Basculegion"
    if name == "oricorio-baile":
        return "Oricorio-Baile"
    if name == "tauros-paldea-blaze-breed":
        return "Tauros-Paldea-Blaze"
    if name == "squawkabilly-green-plumage":
        return "Squawkabilly"
    if name == "pikachu-libre":
        return "Pikachu"
    if name == "oinkologne-male":
        return "Oinkologne"

    # For other forms: capitalize the first letter and each part after '-'
    parts = name.split('-')
    capital_parts = []
    for p in parts:
        if p:
            capital_parts.append(p[0].upper() + p[1:])
        else:
            capital_parts.append(p)
    out = "-".join(capital_parts)
    return out

def filter_spreads(spreads: dict) -> dict:
    """
    Remove entries with usage < 0.01, re-normalize usage, and return new dict.
    """
    filtered = {}
    for key, val in spreads.items():
        if val >= 0.01:
            filtered[key] = val
    total = sum(filtered.values())
    if total <= 0:
        return {}
    for k in filtered:
        filtered[k] = filtered[k] / total
    return filtered

def pick_weighted_random(choices: dict) -> str:
    """
    Given a dict: { key: weight, ...}, pick a random key by its weight.
    """
    r = random.random()
    cumulative = 0.0
    for k, w in choices.items():
        cumulative += w
        if r <= cumulative:
            return k
    return list(choices.keys())[-1]

def random_exponential_in_range(low_val: int, high_val: int, lambd=1.0) -> int:
    """
    Returns an integer in [low_val..high_val], with exponential weighting
    favoring the higher end using random.expovariate(...).
    The parameter 'lambd' can be tweaked for different skew.
    """
    span = high_val - low_val
    # Generate an exponentially distributed value
    exp_value = random.expovariate(lambd)
    # Scale the value to the desired range by mapping exp_value ~ [0..∞) into [0..1)
    # We'll do 1 - exp_value/(exp_value+1) as an approach to bounding 0..1
    fraction = 1 - exp_value / (exp_value + 1)
    scaled_value = low_val + int(round(fraction * span))
    # Clamp the value to [low_val, high_val]
    return max(low_val, min(high_val, scaled_value))

def compute_final_stat(stat_name: str, base: int, iv: int, ev: int, level: int, 
                       nature_mult: float) -> int:
    """
    if HP:
      HP = floor(0.01 * (2*base + iv + floor(0.25*ev)) * level) + level + 10
    else:
      other = floor(0.01 * (2*base + iv + floor(0.25*ev)) * level) + 5
      then * nature_mult
    """
    if stat_name.lower() == "hp":
        tmp = floor(0.01 * (2*base + iv + floor(0.25*ev)) * level) + level + 10
        return tmp
    else:
        tmp = floor(0.01 * (2*base + iv + floor(0.25*ev)) * level) + 5
        tmp = int(round(tmp * nature_mult))
        return tmp

def random_exponential_happiness(date_met_str: str) -> int:
    """
    Weighted towards 255, but depends on how old the date_met is.
    If date_met is older => range is maybe [220..255].
    If more recent => range is [100..255], etc.
    We'll do a simple approach:
      - if year < 2016 => [220..255]
      - if year < 2024 => [160..255]
      - else => [100..255]
    Then pick an exponential distribution in that range.
    """
    try:
        dmet = datetime.strptime(date_met_str, "%Y-%m-%d")
    except:
        dmet = None

    if not dmet:
        return random_exponential_in_range(100, 255, lambd=1.0)

    if dmet.year < 2016:
        return random_exponential_in_range(220, 255, lambd=1.0)
    elif dmet.year < 2024:
        return random_exponential_in_range(160, 255, lambd=1.0)
    else:
        return random_exponential_in_range(100, 255, lambd=1.0)

def main():
    # 1) Build a single Smogon map of all Pokemon
    print("Building Smogon data map...")
    smogon_map = build_smogon_map()

    # 2) Connect to DB
    db_path = os.path.join("..", "db.sqlite")  # adjust your path
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 3) Query the Pokemon that need set generation
    cursor.execute("""
        SELECT p.id, p.pokemon_id, p.nickname, p.level, p.date_met_at
        FROM pokemon p
        WHERE p.ability_id IS NULL AND p.nature_id IS NULL
        ORDER BY p.id
    """)
    all_pokemon = cursor.fetchall()

    updates_count = 0

    # 4) For each Pokemon, fetch PokeAPI data, find usage data in smogon_map, fill stats
    for row in all_pokemon:
        pk_id       = row["id"]
        pokeapi_id  = row["pokemon_id"]
        level       = row["level"]
        date_met_at = row["date_met_at"] or ""

        pk_data = load_pokemon_data_from_pokeapi(pokeapi_id)
        if not pk_data or "name" not in pk_data or "stats" not in pk_data:
            print(f"Pokemon {pk_id} => no pokeapi data for ID={pokeapi_id}")
            continue

        # e.g. "rotom-wash", "mr-mime"
        api_name   = pk_data["name"]
        smogon_name = transform_pokeapi_name_to_smogon(api_name)

        # parse base stats
        base_stats = [0]*6
        stat_name_order = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"]
        for s in pk_data["stats"]:
            sname = s["stat"]["name"]
            sbase = s["base_stat"]
            if   sname == "hp":               base_stats[0] = sbase
            elif sname == "attack":           base_stats[1] = sbase
            elif sname == "defense":          base_stats[2] = sbase
            elif sname == "special-attack":   base_stats[3] = sbase
            elif sname == "special-defense":  base_stats[4] = sbase
            elif sname == "speed":            base_stats[5] = sbase

        # 5) Grab usage data from smogon_map
        smogon_info = smogon_map.get(smogon_name, {})  # no more iteration needed
        abilities_dict = smogon_info.get("abilities", {})
        spreads_dict   = smogon_info.get("spreads", {})

        # pick ability
        if abilities_dict:
            total_abilities = sum(abilities_dict.values())
            if total_abilities > 0:
                for akey in abilities_dict:
                    abilities_dict[akey] = abilities_dict[akey] / total_abilities
                chosen_ability_str = pick_weighted_random(abilities_dict)
            else:
                chosen_ability_str = list(abilities_dict.keys())[0]
        else:
            chosen_ability_str = "NoAbility"

        # load ability id from pokeapi
        ability_slug = chosen_ability_str.lower().replace(" ", "-")
        ab_data = load_ability_data(ability_slug)
        ability_id = ab_data["id"] if (ab_data and "id" in ab_data) else 0

        # pick spread
        def_spreads = filter_spreads(spreads_dict)
        if def_spreads:
            chosen_spread_str = pick_weighted_random(def_spreads)
            parts = chosen_spread_str.split(":")  # e.g. "Modest", "0/0/0/252/4/252"
            nature_str = parts[0].strip()
            ev_str     = parts[1].strip()
        else:
            nature_str = "Docile"
            ev_str     = "0/0/0/0/0/0"

        # nature
        nature_slug = nature_str.lower().replace(" ", "-")
        nat_data = load_nature_data(nature_slug)
        if not nat_data or "id" not in nat_data:
            nature_id = 0
            inc_stat = dec_stat = None
        else:
            nature_id = nat_data["id"]
            inc_stat  = nat_data["increased_stat"]["name"] if nat_data["increased_stat"] else None
            dec_stat  = nat_data["decreased_stat"]["name"] if nat_data["decreased_stat"] else None

        # parse evs
        ev_parts = ev_str.split("/")
        evs = list(map(int, ev_parts))  # [hp, atk, def, spa, spd, spe]

        # 6) IVs => random exponential from 20..31
        ivs = [random_exponential_in_range(20, 31, lambd=1.0) for _ in range(6)]

        # 7) nature multipliers
        nature_multi = [1.0]*6  # HP never changes by nature
        def stat_name_to_index(sname: str) -> int:
            if   sname == "hp":               return 0
            elif sname == "attack":           return 1
            elif sname == "defense":          return 2
            elif sname == "special-attack":   return 3
            elif sname == "special-defense":  return 4
            elif sname == "speed":            return 5
            return -1

        if inc_stat:
            i = stat_name_to_index(inc_stat)
            if i >= 0:
                nature_multi[i] = 1.1
        if dec_stat:
            i = stat_name_to_index(dec_stat)
            if i >= 0:
                nature_multi[i] = 0.9

        # 8) final stats
        final_stats = [0]*6
        for i, statn in enumerate(stat_name_order):
            base = base_stats[i]
            iv   = ivs[i]
            ev   = evs[i]
            mult = nature_multi[i]
            final_stats[i] = compute_final_stat(statn, base, iv, ev, level, mult)

        # 9) happiness => exponential approach
        happiness = random_exponential_happiness(date_met_at)

        # Print some debug info
        print(f"Pokemon {pk_id} ({api_name} => {smogon_name})")
        print(f"  Ability: {chosen_ability_str} (ID={ability_id})")
        print(f"  Nature: {nature_str} (ID={nature_id})")
        print(f"  EVs: {ev_str} => {evs}")
        print(f"  IVs: {ivs}")
        print(f"  Nature multipliers: {nature_multi}")
        print(f"  Final stats: {final_stats}")

        # 10) Update DB
        cursor.execute("""
            UPDATE pokemon
            SET
              hp = ?,
              attack = ?,
              defense = ?,
              special_attack = ?,
              special_defense = ?,
              speed = ?,
              happiness = ?,

              iv_hp = ?,
              iv_attack = ?,
              iv_defense = ?,
              iv_special_attack = ?,
              iv_special_defense = ?,
              iv_speed = ?,

              ev_hp = ?,
              ev_attack = ?,
              ev_defense = ?,
              ev_special_attack = ?,
              ev_special_defense = ?,
              ev_speed = ?,

              nature_id = ?,
              ability_id = ?
            WHERE id = ?
        """, (
            final_stats[0],  # hp
            final_stats[1],
            final_stats[2],
            final_stats[3],
            final_stats[4],
            final_stats[5],
            happiness,

            ivs[0], ivs[1], ivs[2], ivs[3], ivs[4], ivs[5],
            evs[0], evs[1], evs[2], evs[3], evs[4], evs[5],
            nature_id,
            ability_id,
            pk_id
        ))
        updates_count += 1

    conn.commit()
    conn.close()
    print(f"Done! Updated {updates_count} Pokemon with random sets.")

if __name__ == "__main__":
    main()
