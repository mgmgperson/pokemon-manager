export interface GeneratedMentalRatings {
  planning_rating: number;
  risk_rating: number;
  prediction_rating: number;
  clutch_rating: number;
  consistency_rating: number;
  motivation_rating: number;
  pokemon_knowledge_rating: number;
  trainer_knowledge_rating: number;
  training_rating: number;
  conditioning_rating: number;
  determination_rating: number;
  facilities_rating: number;
  attack_rating: number;
  defense_rating: number;
  speed_rating: number;
  gimmick_rating: number;
}

function randomInt(minimum: number, maximum: number): number {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function aroundOverall(overall: number, minimumOffset: number, maximumOffset: number): number {
  return randomInt(Math.max(0, overall + minimumOffset), Math.min(99, overall + maximumOffset));
}

export function generateMentalRatings(overall: number): GeneratedMentalRatings {
  return {
    planning_rating: aroundOverall(overall, -10, 10),
    risk_rating: aroundOverall(overall, -15, 5),
    prediction_rating: aroundOverall(overall, -20, 20),
    clutch_rating: aroundOverall(overall, -10, 15),
    consistency_rating: aroundOverall(overall, -10, 10),
    motivation_rating: aroundOverall(overall, -15, 15),
    pokemon_knowledge_rating: aroundOverall(overall, -10, 10),
    trainer_knowledge_rating: aroundOverall(overall, -10, 10),
    training_rating: aroundOverall(overall, -10, 10),
    conditioning_rating: aroundOverall(overall, -10, 10),
    determination_rating: aroundOverall(overall, -15, 15),
    facilities_rating: aroundOverall(overall, -15, 20),
    attack_rating: aroundOverall(overall, -15, 15),
    defense_rating: aroundOverall(overall, -15, 15),
    speed_rating: aroundOverall(overall, -15, 15),
    gimmick_rating: aroundOverall(overall, -15, 15),
  };
}
