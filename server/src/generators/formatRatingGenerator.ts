
// This file contains functions to generate format ratings for trainers.
  function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  

  export function generateFormatRatingsRandom(overall: number) {
    return {
      singles_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
      doubles_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
      tag_battle_rating: randomInt(Math.max(0, overall - 10), Math.min(99, overall + 10)),
      battle_factory_rating: randomInt(Math.max(0, overall - 15), Math.min(99, overall + 15)),
      rotation_rating: randomInt(Math.max(0, overall - 5), Math.min(99, overall + 5)),
      sixes_rating: randomInt(Math.max(0, overall - 20), Math.min(99, overall + 20)),
      threes_rating: randomInt(Math.max(0, overall - 15), Math.min(99, overall + 10)),
      twos_rating: randomInt(Math.max(0, overall - 5),  Math.min(99, overall + 15)),
    };
  }
  
  /**
   * Weighted approach from your Python's generate_format_ratings_fixed.
   * The sum of (rating * weight) is scaled to match overall * SUM_WEIGHTS.
   */
  const WEIGHTS: Record<string, number> = {
    singles_rating: 5,
    sixes_rating: 5,
    doubles_rating: 3.5,
    tag_battle_rating: 2.5,
    battle_factory_rating: 2.5,
    rotation_rating: 2,
    threes_rating: 1,
    twos_rating: 1,
  };
  const SUM_WEIGHTS = Object.values(WEIGHTS).reduce((acc, val) => acc + val, 0);
  
  export function generateFormatRatingsFixed(overall: number, trainerId: number, ratingId: number) {
    // 1) compute desired sum
    const desiredSum = overall * SUM_WEIGHTS;
  
    // 2) initialize each field close to overall ± 10% random
    const rawRatings: Record<string, number> = {};
    for (const field of Object.keys(WEIGHTS)) {
      const variation = (Math.random() - 0.5) * 0.2 * overall; // ±10% of overall
      let rating = overall + variation;
      rating = Math.max(0, Math.min(99, rating)); // clamp
      rawRatings[field] = rating;
    }
  
    // 3) compute current sum of (weight * rating)
    let currentSum = 0;
    for (const field of Object.keys(rawRatings)) {
      currentSum += rawRatings[field] * WEIGHTS[field];
    }
    const scaleFactor = currentSum === 0 ? 1 : (desiredSum / currentSum);
  
    // 4) scale + clamp
    for (const field of Object.keys(rawRatings)) {
      const scaled = rawRatings[field] * scaleFactor;
      rawRatings[field] = Math.round(Math.max(0, Math.min(99, scaled)));
    }
  
    // 5) return a final object, including IDs
    return {
      id: ratingId,
      rating_id: ratingId,
      ...rawRatings,
    };
  }
  