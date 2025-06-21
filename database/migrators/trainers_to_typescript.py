import sqlite3
import json

# Connect to the SQLite database
conn = sqlite3.connect('../db.sqlite')
cursor = conn.cursor()

# Dictionary to store all our TypeScript outputs
outputs = {
    'trainers': "export const defaultTrainers: Trainer[] = [\n",
    'hometowns': "export const defaultTrainerHometowns: TrainerHometown[] = [\n",
    'gymLeaders': "export const defaultGymLeaders: GymLeader[] = [\n",
    'eliteFour': "export const defaultEliteFour: EliteFour[] = [\n",
    'champions': "export const defaultChampions: Champion[] = [\n",
    'grandChampions': "export const defaultGrandChampions: GrandChampion[] = [\n"
}

# Query for trainers
query_trainers = """
SELECT 
    id,
    fname,
    lname,
    CASE WHEN region_id = 11 THEN 8 ELSE region_id END as region_id,
    birthdate,
    pwtr_rating,
    peak_rating,
    peak_rank,
    active_status
FROM trainer 
WHERE region_id IN (1, 2, 3, 4, 5, 6, 7, 11)
ORDER BY id
"""

cursor.execute(query_trainers)
trainers = cursor.fetchall()

for trainer in trainers:
    trainer_id, fname, lname, region_id, birthdate, pwtr_rating, peak_rating, peak_rank, active_status = trainer
    
    trainer_obj = f"""    {{
        id: {trainer_id},
        fname: {f'"{fname}"' if fname else 'null'},
        lname: {f'"{lname}"' if lname else 'null'},
        regionId: {region_id if region_id else 'null'},
        birthdate: {f'"{birthdate}"' if birthdate else 'null'},
        pwtrRating: {pwtr_rating if pwtr_rating else 'null'},
        peakRating: {peak_rating if peak_rating else 'null'},
        peakRank: {peak_rank if peak_rank else 'null'},
        activeStatus: {"true" if active_status == 1 else "false"}
    }},\n"""
    
    outputs['trainers'] += trainer_obj

# Query for trainer hometowns
query_hometowns = """
SELECT th.id, th.trainer_id, th.city_id
FROM trainer_hometown th
JOIN trainer t ON th.trainer_id = t.id
WHERE t.region_id IN (1, 2, 3, 4, 5, 6, 7, 11)
ORDER BY th.id
"""

cursor.execute(query_hometowns)
hometowns = cursor.fetchall()

for hometown in hometowns:
    hometown_id, trainer_id, city_id = hometown
    
    hometown_obj = f"""    {{
        id: {hometown_id},
        trainerId: {trainer_id},
        cityId: {city_id}
    }},\n"""
    
    outputs['hometowns'] += hometown_obj

# Query for gym leaders
query_gym_leaders = """
SELECT gl.id, gl.trainer_id, gl.badge, gl.city_id, gl.type
FROM gym_leader gl
JOIN trainer t ON gl.trainer_id = t.id
WHERE t.region_id IN (1, 2, 3, 4, 5, 6, 7, 11)
ORDER BY gl.id
"""

cursor.execute(query_gym_leaders)
gym_leaders = cursor.fetchall()

for leader in gym_leaders:
    leader_id, trainer_id, badge, city_id, type_name = leader
    
    leader_obj = f"""    {{
        id: {leader_id},
        trainerId: {trainer_id},
        badge: {f'"{badge}"' if badge else 'null'},
        cityId: {city_id},
        type: {f'"{type_name}"' if type_name else 'null'}
    }},\n"""
    
    outputs['gymLeaders'] += leader_obj

# Query for Elite Four
query_elite_four = """
SELECT ef.id, ef.trainer_id, 
    CASE WHEN ef.region_id = 11 THEN 8 ELSE ef.region_id END as region_id
FROM elite_four ef
WHERE ef.region_id IN (1, 2, 3, 4, 5, 6, 7, 11)
ORDER BY ef.id
"""

cursor.execute(query_elite_four)
elite_four = cursor.fetchall()

for elite in elite_four:
    elite_id, trainer_id, region_id = elite
    
    elite_obj = f"""    {{
        id: {elite_id},
        trainerId: {trainer_id},
        regionId: {region_id}
    }},\n"""
    
    outputs['eliteFour'] += elite_obj

# Query for Champions
query_champions = """
SELECT c.id, c.trainer_id,
    CASE WHEN c.region_id = 11 THEN 8 ELSE c.region_id END as region_id
FROM champion c
WHERE c.region_id IN (1, 2, 3, 4, 5, 6, 7, 11)
ORDER BY c.id
"""

cursor.execute(query_champions)
champions = cursor.fetchall()

for champion in champions:
    champion_id, trainer_id, region_id = champion
    
    champion_obj = f"""    {{
        id: {champion_id},
        trainerId: {trainer_id},
        regionId: {region_id}
    }},\n"""
    
    outputs['champions'] += champion_obj

# Query for Grand Champions
query_grand_champions = """
SELECT gc.id, gc.trainer_id
FROM grand_champion gc
JOIN trainer t ON gc.trainer_id = t.id
WHERE t.region_id IN (1, 2, 3, 4, 5, 6, 7, 11)
ORDER BY gc.id
"""

cursor.execute(query_grand_champions)
grand_champions = cursor.fetchall()

for grand_champion in grand_champions:
    gc_id, trainer_id = grand_champion
    
    gc_obj = f"""    {{
        id: {gc_id},
        trainerId: {trainer_id}
    }},\n"""
    
    outputs['grandChampions'] += gc_obj

# Close all arrays and write to file
for key in outputs:
    outputs[key] += "];"

# Write all data to a single file
with open('trainers.txt', 'w', encoding='utf-8') as f:
    for output in outputs.values():
        f.write(output + "\n\n")

# Close the database connection
conn.close()

print("All trainer-related data has been exported to trainers.txt in TypeScript format.")