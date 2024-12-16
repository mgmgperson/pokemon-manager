import sys
import json
import random

def generate_mental_ratings(overall_rating):
    return {
        "planning_rating": random.randint(max(0, overall_rating - 10), min(100, overall_rating + 10)),
        "risk_rating": random.randint(max(0, overall_rating - 15), min(100, overall_rating + 5)),
        "prediction_rating": random.randint(max(0, overall_rating - 20), min(100, overall_rating + 20)),
        "clutch_rating": random.randint(max(0, overall_rating - 5), min(100, overall_rating + 15)),
        "consistency_rating": random.randint(max(0, overall_rating - 10), min(100, overall_rating + 10)),
        "motivation_rating": random.randint(max(0, overall_rating - 5), min(100, overall_rating + 5)),
        "pokemon_knowledge_rating": random.randint(max(0, overall_rating - 10), min(100, overall_rating + 10)),
        "trainer_knowledge_rating": random.randint(max(0, overall_rating - 10), min(100, overall_rating + 10)),
        "training_rating": random.randint(max(0, overall_rating - 10), min(100, overall_rating + 10)),
        "conditioning_rating": random.randint(max(0, overall_rating - 10), min(100, overall_rating + 10)),
        "determination_rating": random.randint(max(0, overall_rating - 5), min(100, overall_rating + 10)),
        "facilities_rating": random.randint(max(0, overall_rating - 5), min(100, overall_rating + 10)),
        "attack_rating": random.randint(max(0, overall_rating - 5), min(100, overall_rating + 5)),
        "defense_rating": random.randint(max(0, overall_rating - 5), min(100, overall_rating + 5)),
        "speed_rating": random.randint(max(0, overall_rating - 5), min(100, overall_rating + 5)),
        "gimmick_rating": random.randint(max(0, overall_rating - 5), min(100, overall_rating + 5)),
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing overall_rating argument"}))
        return

    overall_rating = int(sys.argv[1])
    ratings = generate_mental_ratings(overall_rating)
    print(json.dumps(ratings))

if __name__ == "__main__":
    main()
