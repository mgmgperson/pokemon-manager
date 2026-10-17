import sqlite3 from 'sqlite3';
import { createActivePopulationProposal, reviewPopulationBrief } from './trainer-population-proposal.service';
import { createInactivePopulationProposal, planInactivePopulationFromSource } from './trainer-population-inactive.service';
import { parsePopulationProposalInput } from './trainer-population-inactive.validation';
import { isInactiveBrief, type PopulationProposal, type PopulationProposalInput } from './trainer-population-proposal.types';
import { readPopulationSource } from './trainer-population.repository';
import type { PopulationPlan } from './trainer-population.types';

export async function createPopulationProposal(database: sqlite3.Database, value: unknown): Promise<PopulationProposal> {
  const brief = parsePopulationProposalInput(value);
  return isInactiveBrief(brief) ? createInactivePopulationProposal(database, brief) : createActivePopulationProposal(database, brief);
}

export async function reviewCohortBrief(database: sqlite3.Database, value: unknown): Promise<{ brief: PopulationProposalInput; plan: PopulationPlan }> {
  const brief = parsePopulationProposalInput(value);
  return isInactiveBrief(brief) ? { brief, plan: planInactivePopulationFromSource(await readPopulationSource(database), brief) }
    : reviewPopulationBrief(database, brief);
}
