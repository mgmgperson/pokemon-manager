export function calculateEloChange(
  winnerRating: number,
  loserRating: number,
  kFactor: number = 32
): [number, number] {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 - expectedWinner;

  return [
    kFactor * (1 - expectedWinner),
    kFactor * -expectedLoser,
  ];
}
