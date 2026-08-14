export interface RatedMatchParticipant {
  participantId: number;
  pwtrRating: number | null;
}

export function determineRatedMatchWinner(
  participantA: RatedMatchParticipant,
  participantB: RatedMatchParticipant,
  random: () => number = Math.random
): number {
  const ratingA = participantA.pwtrRating ?? 3000;
  const ratingB = participantB.pwtrRating ?? 3000;
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));

  return random() < expectedA ? participantA.participantId : participantB.participantId;
}
