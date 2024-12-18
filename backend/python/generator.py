import sys
import json
import random

def generate_mental_ratings(overall_rating):
    return {
        # TODO: make better algorithm for generating ratings
        "planning_rating": random.randint(max(0, overall_rating - 10), min(100, overall_rating + 10)),
        "risk_rating": random.randint(max(0, overall_rating - 15), min(100, overall_rating + 5)),
        "prediction_rating": random.randint(max(0, overall_rating - 20), min(100, overall_rating + 20)),
        "clutch_rating": random.randint(max(0, overall_rating - 10), min(100, overall_rating + 15)),
        "consistency_rating": random.randint(max(0, overall_rating - 10), min(100, overall_rating + 10)),
        "motivation_rating": random.randint(max(0, overall_rating - 15), min(100, overall_rating + 15)),
        "pokemon_knowledge_rating": random.randint(max(0, overall_rating - 10), min(100, overall_rating + 10)),
        "trainer_knowledge_rating": random.randint(max(0, overall_rating - 10), min(100, overall_rating + 10)),
        "training_rating": random.randint(max(0, overall_rating - 10), min(100, overall_rating + 10)),
        "conditioning_rating": random.randint(max(0, overall_rating - 10), min(100, overall_rating + 10)),
        "determination_rating": random.randint(max(0, overall_rating - 15), min(100, overall_rating + 15)),
        "facilities_rating": random.randint(max(0, overall_rating - 15), min(100, overall_rating + 20)),
        "attack_rating": random.randint(max(0, overall_rating - 15), min(100, overall_rating + 15)),
        "defense_rating": random.randint(max(0, overall_rating - 15), min(100, overall_rating + 15)),
        "speed_rating": random.randint(max(0, overall_rating - 15), min(100, overall_rating + 15)),
        "gimmick_rating": random.randint(max(0, overall_rating - 15), min(100, overall_rating + 15)),
    }

def generate_format_ratings(overall_rating):
    return {
        "singles_rating": random.randint(max(0, overall_rating - 10), min(100, overall_rating + 10)),
        "doubles_rating": random.randint(max(0, overall_rating - 10), min(100, overall_rating + 10)),
        "tag_battle_rating": random.randint(max(0, overall_rating - 10), min(100, overall_rating + 10)),
        "battle_factory_rating": random.randint(max(0, overall_rating - 15), min(100, overall_rating + 15)),
        "rotation_rating": random.randint(max(0, overall_rating - 5), min(100, overall_rating + 5)),
        "sixes_rating": random.randint(max(0, overall_rating - 20), min(100, overall_rating + 20)),
        "threes_rating": random.randint(max(0, overall_rating - 15), min(100, overall_rating + 10)),
        "twos_rating": random.randint(max(0, overall_rating - 5), min(100, overall_rating + 15)),
    }

WEIGHTS = {
    "singles_rating": 5,
    "sixes_rating": 5,
    "doubles_rating": 3.5,
    "tag_battle_rating": 2.5,
    "battle_factory_rating": 2.5,
    "rotation_rating": 2,
    "threes_rating": 1,
    "twos_rating": 1
}
SUM_WEIGHTS = sum(WEIGHTS.values())

def generate_format_ratings_fixed(overall_rating):
    """
    Generates format ratings such that the weighted sum equals the desired overall rating,
    with minimal variation in individual ratings.
    """
    desired_sum = overall_rating * SUM_WEIGHTS

    # Initialize ratings close to the overall rating
    results = {}
    for field in WEIGHTS:
        # Apply small random variation within ±10% of the overall rating
        variation = random.uniform(-0.1 * overall_rating, 0.1 * overall_rating)
        rating = overall_rating + variation
        # Clamp rating between 0 and 99
        rating = max(0, min(99, rating))
        results[field] = rating

    # Calculate current weighted sum
    current_sum = sum(WEIGHTS[f] * results[f] for f in WEIGHTS)

    # Scale factors to match the desired sum
    scale_factor = desired_sum / current_sum if current_sum != 0 else 1

    # Apply scaling and clamp ratings
    for field in results:
        scaled = results[field] * scale_factor
        results[field] = int(round(max(0, min(99, scaled))))

    return results

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: generator.py <overall_rating> <mental|format>"}))
        return

    overall_rating = int(sys.argv[1])
    rating_type = sys.argv[2]

    if rating_type == "mental":
        result = generate_mental_ratings(overall_rating)
    elif rating_type == "format":
        result = generate_format_ratings_fixed(overall_rating)
    else:
        print(json.dumps({"error": "Unknown rating type"}))
        return

    print(json.dumps(result))

if __name__ == "__main__":
    main()
