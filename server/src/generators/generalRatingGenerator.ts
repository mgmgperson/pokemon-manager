import { RANK_BREAKPOINTS, RATING_MAP } from '../data/conversions/conversions';

// Helper function to generate a bell-curve distributed random value
function bellCurveRandom(mean: number, stdDev: number): number {
  // Box-Muller transform to get normally distributed random number
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  
  // Transform to desired range
  const result = Math.round(mean + stdDev * z);
  
  // Clamp to valid rating range (0-99)
  return Math.max(0, Math.min(99, result));
}

/**
 * Map PWTR rating to an overall rating with some randomization
 */
function mapPwtrToOverallRating(pwtrRating: number): number {
  // Find the right intervals to interpolate between
  let lowerIndex = 0;
  for (let i = 0; i < RATING_MAP.length - 1; i++) {
    if (pwtrRating <= RATING_MAP[i][0] && pwtrRating > RATING_MAP[i+1][0]) {
      lowerIndex = i;
      break;
    }
  }
  
  // If the rating is below the lowest mapped value, use the lowest
  if (pwtrRating < RATING_MAP[RATING_MAP.length - 1][0]) {
    return Math.max(0, RATING_MAP[RATING_MAP.length - 1][1] - 5);
  }
  
  // If the rating is above the highest mapped value, use the highest
  if (pwtrRating > RATING_MAP[0][0]) {
    return RATING_MAP[0][1];
  }
  
  // Interpolate
  const [higherPwtr, higherRating] = RATING_MAP[lowerIndex];
  const [lowerPwtr, lowerRating] = RATING_MAP[lowerIndex + 1];
  
  const ratio = (pwtrRating - lowerPwtr) / (higherPwtr - lowerPwtr);
  const interpolatedRating = lowerRating + ratio * (higherRating - lowerRating);
  
  // Add some randomization (±3 points)
  const randomFactor = (Math.random() - 0.5) * 6;
  
  return Math.round(Math.max(0, Math.min(99, interpolatedRating + randomFactor)));
}

/**
 * Generate an overall rating based on PWTR rating with fallback
 */
function generateOverallRating(pwtrRating: number | null): number {
  if (pwtrRating === null) {
    // Fallback to a moderate rating with wider randomization
    return Math.round(Math.random() * 40 + 30); // Random between 30-70
  }
  
  return mapPwtrToOverallRating(pwtrRating);
}

/**
 * Generate a complete ratings object based on PWTR rating
 */
export function generateGeneralRatings(trainerId: number, pwtrRating: number | null): any {
  // Generate the overall rating
  const overallRating = generateOverallRating(pwtrRating);
  
  // Generate specialized ratings based on the overall rating
  // Using bell curve distribution to cluster values around the overall rating
  const typingRating = bellCurveRandom(overallRating, 3);
  const mixedRating = bellCurveRandom(overallRating, 3);
  const specialRating = bellCurveRandom(overallRating, 3);
  
  // Standardize the ID structure to match other generators
  return {
    id: trainerId,  // Using trainer ID as the rating ID for now
    trainer_id: trainerId,
    year: 2036, // Current year in the game timeline
    overall_rating: overallRating,
    typing_rating: typingRating,
    mixed_rating: mixedRating,
    special_rating: specialRating
  };
}