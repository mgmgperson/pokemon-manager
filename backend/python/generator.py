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

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: generator.py <overall_rating> <mental|format>"}))
        return

    overall_rating = int(sys.argv[1])
    rating_type = sys.argv[2]

    if rating_type == "mental":
        result = generate_mental_ratings(overall_rating)
    elif rating_type == "format":
        result = generate_format_ratings(overall_rating)
    else:
        print(json.dumps({"error": "Unknown rating type"}))
        return

    print(json.dumps(result))

if __name__ == "__main__":
    main()
    