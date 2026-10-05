import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import {
  applyRosterProposal,
  applyNewTrainerProposal,
  applyExistingTrainerProposal,
  createRosterProposal,
  createNewTrainerProposal,
  createExistingTrainerProposal,
  TrainerManagementError,
} from './trainer-management.service';
import type {
  ExistingTrainerApplyInput,
  ExistingTrainerProposalInput,
  GeneralRatingProposal,
  NewTrainerApplyInput,
  NewTrainerProfileProposal,
  NewTrainerProposalInput,
  NumericRange,
  ProfileProposal,
  RosterApplyInput,
  RosterProposalInput,
  TrainerNameGender,
} from './trainer-management.types';

function sendError(response: Response, error: unknown): void {
  const status = error instanceof TrainerManagementError ? error.status : 500;
  const message = error instanceof Error ? error.message : 'Unknown error';
  response.status(status).json({ error: message });
}

function parseTrainerId(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new TrainerManagementError(400, 'trainerId must be a positive integer');
  }

  const trainerId = Number(value);
  if (!Number.isSafeInteger(trainerId)) {
    throw new TrainerManagementError(400, 'trainerId is too large');
  }
  return trainerId;
}

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TrainerManagementError(400, `${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function optionalBoolean(value: unknown, label: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throw new TrainerManagementError(400, `${label} must be a boolean`);
  }
  return value;
}

function optionalGender(value: unknown, label: string): TrainerNameGender | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value !== 'M' && value !== 'F') {
    throw new TrainerManagementError(400, `${label} must be M or F`);
  }
  return value;
}

function optionalNumber(value: unknown, label: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TrainerManagementError(400, `${label} must be a finite number`);
  }
  return value;
}

function optionalPositiveInteger(value: unknown, label: string): number | undefined {
  const parsedValue = optionalNumber(value, label);
  if (parsedValue !== undefined && (!Number.isInteger(parsedValue) || parsedValue <= 0)) {
    throw new TrainerManagementError(400, `${label} must be a positive integer`);
  }
  return parsedValue;
}

function optionalRange(value: unknown, label: string): NumericRange | undefined {
  if (value === undefined) {
    return undefined;
  }
  const range = objectValue(value, label);
  const minimum = optionalNumber(range.minimum, `${label}.minimum`);
  const maximum = optionalNumber(range.maximum, `${label}.maximum`);
  if (minimum === undefined || maximum === undefined) {
    throw new TrainerManagementError(400, `${label} requires minimum and maximum`);
  }
  return { minimum, maximum };
}

function parseProposalInput(body: unknown): ExistingTrainerProposalInput {
  const input = objectValue(body, 'request body');
  const includeRatings = optionalBoolean(input.includeRatings, 'includeRatings');
  if (includeRatings === undefined) {
    throw new TrainerManagementError(400, 'includeRatings is required');
  }
  return {
    regionId: optionalPositiveInteger(input.regionId, 'regionId'),
    hometownCityId: optionalPositiveInteger(input.hometownCityId, 'hometownCityId'),
    ageRange: optionalRange(input.ageRange, 'ageRange'),
    pwtrRange: optionalRange(input.pwtrRange, 'pwtrRange'),
    activeStatus: optionalBoolean(input.activeStatus, 'activeStatus'),
    includeRatings,
  };
}

function parseProfileProposal(value: unknown): ProfileProposal | undefined {
  if (value === undefined) {
    return undefined;
  }
  const profile = objectValue(value, 'profile');
  const birthdate = profile.birthdate;
  if (birthdate !== undefined && typeof birthdate !== 'string') {
    throw new TrainerManagementError(400, 'profile.birthdate must be a string');
  }
  return {
    regionId: optionalPositiveInteger(profile.regionId, 'profile.regionId'),
    hometownCityId: optionalPositiveInteger(profile.hometownCityId, 'profile.hometownCityId'),
    birthdate,
    pwtrRating: optionalNumber(profile.pwtrRating, 'profile.pwtrRating'),
    peakRating: optionalNumber(profile.peakRating, 'profile.peakRating'),
    peakRank: optionalPositiveInteger(profile.peakRank, 'profile.peakRank'),
    activeStatus: optionalBoolean(profile.activeStatus, 'profile.activeStatus'),
  };
}

function parseRatingProposal(value: unknown): GeneralRatingProposal | undefined {
  if (value === undefined) {
    return undefined;
  }
  const rating = objectValue(value, 'rating');
  const overallRating = optionalNumber(rating.overallRating, 'rating.overallRating');
  const typingRating = optionalNumber(rating.typingRating, 'rating.typingRating');
  const mixedRating = optionalNumber(rating.mixedRating, 'rating.mixedRating');
  const specialRating = optionalNumber(rating.specialRating, 'rating.specialRating');
  if (
    overallRating === undefined
    || typingRating === undefined
    || mixedRating === undefined
    || specialRating === undefined
  ) {
    throw new TrainerManagementError(400, 'rating requires all four general rating values');
  }
  return { overallRating, typingRating, mixedRating, specialRating };
}

function parseApplyInput(body: unknown): ExistingTrainerApplyInput {
  const input = objectValue(body, 'request body');
  return {
    profile: parseProfileProposal(input.profile),
    rating: parseRatingProposal(input.rating),
  };
}

function integerArray(value: unknown, label: string): number[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'number' || !Number.isInteger(item))) {
    throw new TrainerManagementError(400, `${label} must be an array of whole numbers`);
  }
  return [...new Set(value)];
}

function parseRosterProposalInput(body: unknown): RosterProposalInput {
  const input = objectValue(body, 'request body');
  const pokemonCount = optionalNumber(input.pokemonCount, 'pokemonCount');
  if (pokemonCount === undefined || !Number.isInteger(pokemonCount)) {
    throw new TrainerManagementError(400, 'pokemonCount must be a whole number');
  }
  return {
    pokemonCount,
    typeIds: integerArray(input.typeIds, 'typeIds'),
    generations: integerArray(input.generations, 'generations'),
  };
}

function requiredRange(value: unknown, label: string): NumericRange {
  const range = optionalRange(value, label);
  if (!range) {
    throw new TrainerManagementError(400, `${label} is required`);
  }
  return range;
}

function requiredBoolean(value: unknown, label: string): boolean {
  const parsedValue = optionalBoolean(value, label);
  if (parsedValue === undefined) {
    throw new TrainerManagementError(400, `${label} is required`);
  }
  return parsedValue;
}

function requiredPositiveInteger(value: unknown, label: string): number {
  const parsedValue = optionalPositiveInteger(value, label);
  if (parsedValue === undefined) {
    throw new TrainerManagementError(400, `${label} is required`);
  }
  return parsedValue;
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new TrainerManagementError(400, `${label} must be a string`);
  }
  return value;
}

function requiredNumber(value: unknown, label: string): number {
  const parsedValue = optionalNumber(value, label);
  if (parsedValue === undefined) {
    throw new TrainerManagementError(400, `${label} is required`);
  }
  return parsedValue;
}

function parseRosterPokemon(value: unknown) {
  const pokemon = objectValue(value, 'pokemon');
  const details = objectValue(pokemon.details, 'pokemon.details');
  return {
    speciesId: requiredPositiveInteger(pokemon.speciesId, 'pokemon.speciesId'),
    pokemonId: requiredPositiveInteger(pokemon.pokemonId, 'pokemon.pokemonId'),
    name: requiredString(pokemon.name, 'pokemon.name'),
    level: requiredNumber(pokemon.level, 'pokemon.level'),
    typeIds: integerArray(pokemon.typeIds, 'pokemon.typeIds'),
    isMega: requiredBoolean(pokemon.isMega, 'pokemon.isMega'),
    isGigantamax: requiredBoolean(pokemon.isGigantamax, 'pokemon.isGigantamax'),
    details: {
      otName: requiredString(details.otName, 'pokemon.details.otName'),
      otId: requiredPositiveInteger(details.otId, 'pokemon.details.otId'),
      nickname: requiredString(details.nickname, 'pokemon.details.nickname'),
      happiness: requiredNumber(details.happiness, 'pokemon.details.happiness'),
      gender: requiredString(details.gender, 'pokemon.details.gender'),
      shiny: requiredBoolean(details.shiny, 'pokemon.details.shiny'),
      pokeballId: requiredNumber(details.pokeballId, 'pokemon.details.pokeballId'),
      heldItemId: requiredNumber(details.heldItemId, 'pokemon.details.heldItemId'),
      experiencePoints: requiredNumber(details.experiencePoints, 'pokemon.details.experiencePoints'),
      dateMetAt: requiredString(details.dateMetAt, 'pokemon.details.dateMetAt'),
      levelMetAt: requiredNumber(details.levelMetAt, 'pokemon.details.levelMetAt'),
      currentHp: requiredNumber(details.currentHp, 'pokemon.details.currentHp'),
      currentStrength: requiredNumber(details.currentStrength, 'pokemon.details.currentStrength'),
      statusId: requiredNumber(details.statusId, 'pokemon.details.statusId'),
      battlesWon: requiredNumber(details.battlesWon, 'pokemon.details.battlesWon'),
      battlesLost: requiredNumber(details.battlesLost, 'pokemon.details.battlesLost'),
      kills: requiredNumber(details.kills, 'pokemon.details.kills'),
      deaths: requiredNumber(details.deaths, 'pokemon.details.deaths'),
      trainingEfficiency: requiredNumber(details.trainingEfficiency, 'pokemon.details.trainingEfficiency'),
      abilityId: requiredNumber(details.abilityId, 'pokemon.details.abilityId'),
      natureId: requiredNumber(details.natureId, 'pokemon.details.natureId'),
      evHp: requiredNumber(details.evHp, 'pokemon.details.evHp'),
      evAttack: requiredNumber(details.evAttack, 'pokemon.details.evAttack'),
      evDefense: requiredNumber(details.evDefense, 'pokemon.details.evDefense'),
      evSpecialAttack: requiredNumber(details.evSpecialAttack, 'pokemon.details.evSpecialAttack'),
      evSpecialDefense: requiredNumber(details.evSpecialDefense, 'pokemon.details.evSpecialDefense'),
      evSpeed: requiredNumber(details.evSpeed, 'pokemon.details.evSpeed'),
      ivHp: requiredNumber(details.ivHp, 'pokemon.details.ivHp'),
      ivAttack: requiredNumber(details.ivAttack, 'pokemon.details.ivAttack'),
      ivDefense: requiredNumber(details.ivDefense, 'pokemon.details.ivDefense'),
      ivSpecialAttack: requiredNumber(details.ivSpecialAttack, 'pokemon.details.ivSpecialAttack'),
      ivSpecialDefense: requiredNumber(details.ivSpecialDefense, 'pokemon.details.ivSpecialDefense'),
      ivSpeed: requiredNumber(details.ivSpeed, 'pokemon.details.ivSpeed'),
      hp: requiredNumber(details.hp, 'pokemon.details.hp'),
      attack: requiredNumber(details.attack, 'pokemon.details.attack'),
      defense: requiredNumber(details.defense, 'pokemon.details.defense'),
      specialAttack: requiredNumber(details.specialAttack, 'pokemon.details.specialAttack'),
      specialDefense: requiredNumber(details.specialDefense, 'pokemon.details.specialDefense'),
      speed: requiredNumber(details.speed, 'pokemon.details.speed'),
    },
  };
}

function parseRosterApplyInput(body: unknown): RosterApplyInput {
  const input = objectValue(body, 'request body');
  if (!Array.isArray(input.pokemon)) {
    throw new TrainerManagementError(400, 'pokemon must be an array');
  }
  return { pokemon: input.pokemon.map(parseRosterPokemon) };
}

function parseNewTrainerProposalInput(body: unknown): NewTrainerProposalInput {
  const input = objectValue(body, 'request body');
  return {
    regionId: requiredPositiveInteger(input.regionId, 'regionId'),
    hometownCityId: optionalPositiveInteger(input.hometownCityId, 'hometownCityId'),
    gender: optionalGender(input.gender, 'gender'),
    ageRange: requiredRange(input.ageRange, 'ageRange'),
    pwtrRange: requiredRange(input.pwtrRange, 'pwtrRange'),
    activeStatus: requiredBoolean(input.activeStatus, 'activeStatus'),
    includeRatings: requiredBoolean(input.includeRatings, 'includeRatings'),
  };
}

function parseNewTrainerProfileProposal(value: unknown): NewTrainerProfileProposal {
  const profile = objectValue(value, 'profile');
  return {
    fname: requiredString(profile.fname, 'profile.fname'),
    lname: requiredString(profile.lname, 'profile.lname'),
    regionId: requiredPositiveInteger(profile.regionId, 'profile.regionId'),
    hometownCityId: optionalPositiveInteger(profile.hometownCityId, 'profile.hometownCityId'),
    birthdate: requiredString(profile.birthdate, 'profile.birthdate'),
    pwtrRating: requiredNumber(profile.pwtrRating, 'profile.pwtrRating'),
    peakRating: requiredNumber(profile.peakRating, 'profile.peakRating'),
    peakRank: requiredPositiveInteger(profile.peakRank, 'profile.peakRank'),
    activeStatus: requiredBoolean(profile.activeStatus, 'profile.activeStatus'),
  };
}

function parseNewTrainerApplyInput(body: unknown): NewTrainerApplyInput {
  const input = objectValue(body, 'request body');
  return {
    profile: parseNewTrainerProfileProposal(input.profile),
    rating: parseRatingProposal(input.rating),
  };
}

export async function previewExistingTrainerProposal(
  request: Request<{ trainerId: string }>,
  response: Response
): Promise<void> {
  try {
    const proposal = await createExistingTrainerProposal(
      getActiveDB(),
      parseTrainerId(request.params.trainerId),
      parseProposalInput(request.body)
    );
    response.json({ message: 'success', data: proposal });
  } catch (error) {
    sendError(response, error);
  }
}

export async function applyExistingTrainerProposalController(
  request: Request<{ trainerId: string }>,
  response: Response
): Promise<void> {
  try {
    await applyExistingTrainerProposal(
      getActiveDB(),
      parseTrainerId(request.params.trainerId),
      parseApplyInput(request.body)
    );
    response.json({ message: 'success' });
  } catch (error) {
    sendError(response, error);
  }
}

export async function previewRosterProposal(
  request: Request<{ trainerId: string }>,
  response: Response
): Promise<void> {
  try {
    const proposal = await createRosterProposal(
      getActiveDB(),
      parseTrainerId(request.params.trainerId),
      parseRosterProposalInput(request.body)
    );
    response.json({ message: 'success', data: proposal });
  } catch (error) {
    sendError(response, error);
  }
}

export async function applyRosterProposalController(
  request: Request<{ trainerId: string }>,
  response: Response
): Promise<void> {
  try {
    const pokemonCreated = await applyRosterProposal(
      getActiveDB(),
      parseTrainerId(request.params.trainerId),
      parseRosterApplyInput(request.body)
    );
    response.status(201).json({ message: 'success', data: { pokemonCreated } });
  } catch (error) {
    sendError(response, error);
  }
}

export async function previewNewTrainerProposal(
  request: Request<Record<string, never>, unknown, unknown>,
  response: Response
): Promise<void> {
  try {
    const proposal = await createNewTrainerProposal(getActiveDB(), parseNewTrainerProposalInput(request.body));
    response.json({ message: 'success', data: proposal });
  } catch (error) {
    sendError(response, error);
  }
}

export async function applyNewTrainerProposalController(
  request: Request<Record<string, never>, unknown, unknown>,
  response: Response
): Promise<void> {
  try {
    const trainerId = await applyNewTrainerProposal(getActiveDB(), parseNewTrainerApplyInput(request.body));
    response.status(201).json({ message: 'success', data: { trainerId } });
  } catch (error) {
    sendError(response, error);
  }
}
