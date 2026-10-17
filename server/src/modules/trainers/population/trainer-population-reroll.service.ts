import { isInactiveBrief } from './trainer-population-proposal.types';
import { generateInactivePopulationTrainer, planInactivePopulationFromSource } from './trainer-population-inactive.service';
import sqlite3 from 'sqlite3';
import { generatePopulationRatings, generatePopulationRoster, generatePopulationTrainer } from './trainer-population-proposal.service';
import { populationObject } from './trainer-population-proposal.validation';
import { readPopulationSource } from './trainer-population.repository';
import { inspectTrainerPopulation, planTrainerPopulationFromSource } from './trainer-population.service';
import { reviewPopulationProposal } from './trainer-population-review.service';
import type { PopulationReview } from './trainer-population-review.types';
import { PopulationPlanningError } from './trainer-population.validation';

export async function rerollPopulationTrainer(database: sqlite3.Database, value: unknown): Promise<PopulationReview> {
  const input = populationObject(value, 'Reroll input', ['proposal', 'trainerKey', 'section']);
  if (typeof input.trainerKey !== 'string' || (input.section !== 'trainer' && input.section !== 'ratings' && input.section !== 'roster')) {
    throw new PopulationPlanningError(400, 'Choose a trainer key and trainer, ratings or roster section');
  }
  const { proposal } = await reviewPopulationProposal(database, input.proposal);
  const source = await readPopulationSource(database);
  const plan = isInactiveBrief(proposal.brief) ? planInactivePopulationFromSource(source, proposal.brief)
    : planTrainerPopulationFromSource(source, proposal.brief.planning);
  if (plan.inspection.snapshot !== proposal.snapshot) throw new PopulationPlanningError(409, 'The save changed; inspect again before rerolling');
  const index = proposal.trainers.findIndex((trainer) => trainer.key === input.trainerKey);
  if (index < 0) throw new PopulationPlanningError(400, 'The trainer key is not in this proposal');
  const trainer = proposal.trainers[index];
  if (input.section === 'trainer') {
    const usedNames = new Set(source.trainers.map((existing) => `${existing.fname ?? ''} ${existing.lname ?? ''}`.trim().toLowerCase()));
    for (const other of proposal.trainers) if (other.key !== trainer.key) usedNames.add(`${other.profile.fname} ${other.profile.lname}`.trim().toLowerCase());
    proposal.trainers[index] = isInactiveBrief(proposal.brief)
      ? await generateInactivePopulationTrainer(database, source, plan, proposal.brief, trainer.key, usedNames)
      : await generatePopulationTrainer(database, source, plan, proposal.brief,
        plan.inspection.ratingBands.find((candidate) => candidate.id === trainer.ratingBandId)!, trainer.ageBand, trainer.key, usedNames);
  } else if (input.section === 'ratings') {
    Object.assign(trainer, generatePopulationRatings(trainer.profile.pwtrRating, trainer.ratingYear, isInactiveBrief(proposal.brief) ? trainer.generalRatings.overallRating : undefined));
  } else {
    Object.assign(trainer, generatePopulationRoster(trainer.profile, plan.inspection.gameDate, proposal.brief, trainer.generalRatings));
  }
  if ((await inspectTrainerPopulation(database)).snapshot !== proposal.snapshot) throw new PopulationPlanningError(409, 'The save changed during reroll; inspect again');
  const reviewed = await reviewPopulationProposal(database, proposal);
  reviewed.changes.unshift(`${trainer.key}: explicitly rerolled ${input.section}; other trainers retain their values.`);
  return reviewed;
}
