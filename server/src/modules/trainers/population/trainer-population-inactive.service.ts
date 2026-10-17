import { randomUUID } from 'crypto';
import sqlite3 from 'sqlite3';
import { generateName } from '../../../generators/nameGenerator';
import { PEAK_SCHEMA_UPGRADE_MESSAGE, TRAINER_PEAK_SCHEMA_VERSION } from '../../../infrastructure/database/trainerPeakSchema';
import { calculateAge, generateBirthdate, parseDateOnly } from '../management/trainer-management.service';
import type { NumericRange, TrainerProfileProposal } from '../management/trainer-management.types';
import { chooseWeighted, generatePopulationRatings, generatePopulationRoster, nameCache, normalizedName, requireReadyRegion } from './trainer-population-proposal.service';
import { SPECIAL_OWNERSHIP_KINDS, type InactivePopulationProposalInput, type PopulationProposal, type PopulationTrainerProposal } from './trainer-population-proposal.types';
import { readPopulationSource, type PopulationSource } from './trainer-population.repository';
import { inspectTrainerPopulation, planTrainerPopulationFromSource } from './trainer-population.service';
import { PopulationPlanningError } from './trainer-population.validation';
import type { PopulationPlan } from './trainer-population.types';

function draw(range: NumericRange): number { return range.minimum + Math.floor(Math.random() * (range.maximum - range.minimum + 1)); }

export function planInactivePopulationFromSource(source: PopulationSource, brief: InactivePopulationProposalInput, count = brief.batch.count): PopulationPlan {
  if (source.schemaVersion < TRAINER_PEAK_SCHEMA_VERSION) throw new PopulationPlanningError(409, PEAK_SCHEMA_UPGRADE_MESSAGE);
  const plan = planTrainerPopulationFromSource(source);
  const { inspection } = plan;
  if (inspection.snapshot !== brief.snapshot) throw new PopulationPlanningError(409, 'The inactive brief belongs to a changed or different save; inspect again');
  const region = inspection.regions.find((candidate) => candidate.id === brief.batch.regionId);
  if (!region) throw new PopulationPlanningError(400, 'The selected region does not exist');
  const year = Number(inspection.gameDate.slice(0, 4));
  if (year - brief.ageRange.maximum - 1 < 100) throw new PopulationPlanningError(400, 'Inactive ages must produce supported four-digit birthdates');
  if (brief.peakYear && (brief.peakYear.maximum > year || brief.peakYear.maximum < year - brief.ageRange.minimum)) {
    throw new PopulationPlanningError(400, 'The estimated peak-year range must be within the save year and allow every chosen age to have been alive; leave it unknown otherwise');
  }
  plan.settings = { batch: { ...brief.batch, count } };
  plan.regionalTargets = null; plan.ageTargets = null; plan.unresolvedInputs = [];
  plan.allocationMethod = 'Explicit inactive cohort; no current active PWTR target or historical population curve. Ages are sampled from the chosen birthdate interval; peak ability and decline points are sampled uniformly.';
  plan.inactiveCohort = { beforeInactive: inspection.counts.inactive, afterInactive: inspection.counts.inactive + count, ageRange: brief.ageRange };
  plan.batch = { regionId: brief.batch.regionId, count, ratingBands: [], ageBands: [{ ...brief.ageRange, count }],
    projectedActive: region.counts.active, projectedActiveInCoverage: region.counts.activeInCoverage,
    projectedWorldwideActive: inspection.counts.active, projectedWorldwideActiveInCoverage: inspection.counts.activeInCoverage,
    issues: ['Inactive trainers do not fill active-population deficits. Official PWTR fields start unknown; peak years are ability estimates, not career dates.', ...region.issues] };
  requireReadyRegion(source, plan);
  return plan;
}

export async function generateInactivePopulationTrainer(database: sqlite3.Database, source: PopulationSource, plan: PopulationPlan,
  brief: InactivePopulationProposalInput, key: string, usedNames: Set<string>): Promise<PopulationTrainerProposal> {
  const gameDate = parseDateOnly(plan.inspection.gameDate)!;
  const birthdate = generateBirthdate(brief.ageRange, gameDate);
  const age = calculateAge(parseDateOnly(birthdate)!, gameDate);
  if (age < brief.ageRange.minimum || age > brief.ageRange.maximum) throw new PopulationPlanningError(400, 'The inactive age interval cannot be represented in this save');
  const peak = draw(brief.peakAbility);
  const declinePoints = draw(brief.declinePoints);
  const peakYear = brief.peakYear ? draw({ minimum: Math.max(brief.peakYear.minimum, Number(birthdate.slice(0, 4))), maximum: brief.peakYear.maximum }) : null;
  const gender = brief.nameGender === 'random' ? (Math.random() < 0.5 ? 'M' : 'F') : brief.nameGender;
  const name = await generateName(database, brief.batch.regionId, gender, nameCache(source));
  if (!name.fname?.trim() || !name.lname?.trim()) throw new PopulationPlanningError(409, 'Incomplete regional name; check the configured countries in the static names database');
  const cities = source.cities.filter((city) => city.region_id === brief.batch.regionId && Number.isSafeInteger(city.population) && city.population! > 0);
  const home = chooseWeighted(cities, cities.map((city) => city.population!));
  const profile: TrainerProfileProposal = { fname: name.fname, lname: name.lname, regionId: brief.batch.regionId, hometownCityId: home.id,
    hometownName: home.name, birthdate, pwtrRating: null, peakRating: null, peakRank: null, activeStatus: false,
    estimatedPeakAbility: peak, estimatedPeakAbilityYear: peakYear };
  const ratings = generatePopulationRatings(null, gameDate.getUTCFullYear(), peak - declinePoints);
  const roster = generatePopulationRoster(profile, plan.inspection.gameDate, brief, ratings.generalRatings);
  const notices: string[] = [];
  const fullName = normalizedName(profile.fname, profile.lname);
  if (usedNames.has(fullName)) notices.push('Duplicate name: inspect identity before approval.');
  usedNames.add(fullName);
  return { key, profile, nameGender: gender, age, ageBand: { ...brief.ageRange }, ratingBandId: 'inactive', declinePoints,
    ratingYear: gameDate.getUTCFullYear(), ...ratings, ...roster, notices };
}

export async function createInactivePopulationProposal(database: sqlite3.Database, brief: InactivePopulationProposalInput): Promise<PopulationProposal> {
  const source = await readPopulationSource(database);
  const plan = planInactivePopulationFromSource(source, brief);
  const proposalId = randomUUID();
  const usedNames = new Set(source.trainers.map((trainer) => normalizedName(trainer.fname, trainer.lname)));
  const trainers: PopulationTrainerProposal[] = [];
  for (let index = 0; index < brief.batch.count; index += 1) trainers.push(await generateInactivePopulationTrainer(database, source, plan, brief, `${proposalId}:${index + 1}`, usedNames));
  if ((await inspectTrainerPopulation(database)).snapshot !== brief.snapshot) throw new PopulationPlanningError(409, 'The save changed while generating this inactive cohort; inspect again');
  const specials = {} as PopulationProposal['summary']['specials'];
  for (const kind of SPECIAL_OWNERSHIP_KINDS) specials[kind] = { expectedTrainers: trainers.length * brief.pokemon.specialOwnership[kind].chancePercent / 100,
    actualTrainers: trainers.filter((trainer) => trainer.specialOwnership[kind] > 0).length, pokemonCount: trainers.reduce((sum, trainer) => sum + trainer.specialOwnership[kind], 0) };
  return { version: 2, mode: 'preview-only', proposalId, snapshot: brief.snapshot, brief, plan, trainers,
    summary: { trainerCount: trainers.length, pokemonCount: trainers.reduce((sum, trainer) => sum + trainer.pokemon.length, 0),
      exceptionalTrainers: trainers.filter((trainer) => SPECIAL_OWNERSHIP_KINDS.some((kind) => trainer.specialOwnership[kind] > 0)).length, specials },
    notices: ['Unsaved inactive cohort; review all estimates before approval.', 'Pokemon counters explicitly start unrecorded at zero; manual review edits are estimates, not event results.', 'Current strength is independent of official PWTR. Peak years do not establish participation or career dates.'] };
}
