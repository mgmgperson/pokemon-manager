export interface RatingParams {
    /** Total number of players (best rank = 0, worst = totalPlayers) */
    totalPlayers: number;
    /** Base Elo for new trainers (this is our midpoint) */
    baseElo: number;
    /** A high Elo threshold where we know the rank (e.g. Elo 3400 gives rank ~2000) */
    eloAtThreshold: number;
    /** The rank corresponding to eloAtThreshold */
    rankAtThreshold: number;
  }
  
  /** Global rating parameters; modify as needed */
  export const GLOBAL_RATING_PARAMS: RatingParams = {
    totalPlayers: 30_000_000,
    baseElo: 1000,
    eloAtThreshold: 3400,
    rankAtThreshold: 2000,
  };
  
  /**
   * Compute the logistic steepness parameter k.
   * Given our model:
   *    rank = totalPlayers / (1 + exp(k*(elo - baseElo)))
   * then at elo = eloAtThreshold, we have:
   *    rankAtThreshold = totalPlayers / (1 + exp(k*(eloAtThreshold - baseElo)))
   * Solving:
   *    exp(k*(eloAtThreshold - baseElo)) = totalPlayers / rankAtThreshold - 1
   *    k = ln(totalPlayers / rankAtThreshold - 1) / (eloAtThreshold - baseElo)
   */
  function computeK(params: RatingParams): number {
    const { totalPlayers, baseElo, eloAtThreshold, rankAtThreshold } = params;
    return Math.log(totalPlayers / rankAtThreshold - 1) / (eloAtThreshold - baseElo);
  }
  
  /**
   * Given an Elo rating, predict the trainer’s rank.
   * Lower rank numbers are better (0 is best, totalPlayers is worst).
   * For Elo = baseElo (500), rank = totalPlayers/2.
   */
  export function eloToRank(elo: number): number {
    const k = computeK(GLOBAL_RATING_PARAMS);
    const total = GLOBAL_RATING_PARAMS.totalPlayers;
    return total / (1 + Math.exp(k * (elo - GLOBAL_RATING_PARAMS.baseElo)));
  }
  
  /**
   * Given a rank, predict the corresponding Elo rating.
   * The inverse of the logistic function:
   *    elo = baseElo + (1/k)*ln(totalPlayers/rank - 1)
   */
  export function rankToElo(rank: number): number {
    const k = computeK(GLOBAL_RATING_PARAMS);
    const total = GLOBAL_RATING_PARAMS.totalPlayers;
    return GLOBAL_RATING_PARAMS.baseElo + (1 / k) * Math.log(total / rank - 1);
  }

  