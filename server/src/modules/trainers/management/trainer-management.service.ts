import type { TrainerProfileProposal } from './trainer-management.types';
import { validatePeakEstimates } from '../trainer/trainer-peak.validation';
import { peakEstimateStorage } from '../../../infrastructure/database/trainerPeakSchema';
import sqlite3 from 'sqlite3';
import { generateGeneralRatings } from '../../../generators/generalRatingGenerator';
import { generateName } from '../../../generators/nameGenerator';
import { convertPWTRToOverallRating, generatePokemonTeam } from '../../../generators/pokemonGenerator';
import { generatePokemonDetails } from '../../../generators/pokemonSetGenerator';
import { generateTrainerCareerPeak } from '../../../generators/trainerGenerator';
import { Types } from '../../../reference-data/enums/types';
import { allPokemon } from '../../../reference-data/pokemon';
import { allSpecies } from '../../../reference-data/pokemon-species';
import { runInTransaction } from '../../../infrastructure/database/sqlite';
import { createGeneratedPokemonInstance } from '../pokemon/pokemon.repository';
import {
  addTrainerHometown,
  createManagementTrainer,
  createGeneralRating,
  findManagementCity,
  findManagementGameDate,
  findManagementTrainerState,
  regionExists,
  fillMissingGeneralRating,
  updateTrainerProfile,
  type ManagementTrainerState,
} from './trainer-management.repository';
import type {
  ExistingTrainerApplyInput,
  ExistingTrainerProposal,
  ExistingTrainerProposalInput,
  GeneralRatingProposal,
  NewTrainerApplyInput,
  NewTrainerProfileProposal,
  NewTrainerProposal,
  NewTrainerProposalInput,
  NumericRange,
  ProfileProposal,
  RosterApplyInput,
  RosterPokemonProposal,
  RosterProposal,
  RosterProposalInput,
  TrainerNameGender,
} from './trainer-management.types';

const MINIMUM_GENERATED_AGE = 12;
const MAXIMUM_GENERATED_AGE = 80;
const MINIMUM_PWTR = 1000;
const MAXIMUM_PWTR = 4500;
const MAXIMUM_ROSTER_PROPOSAL_SIZE = 24;

export class TrainerManagementError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function requireGameDate(gameDate: string | null): Date {
  if (!gameDate) {
    throw new TrainerManagementError(409, 'The active save has no current game date');
  }

  const parsedDate = parseDateOnly(gameDate);
  if (!parsedDate) {
    throw new TrainerManagementError(409, 'The active save has an invalid current game date');
  }

  return parsedDate;
}

export function calculateAge(birthdate: Date, gameDate: Date): number {
  let age = gameDate.getUTCFullYear() - birthdate.getUTCFullYear();
  const gameMonthAndDay = [gameDate.getUTCMonth(), gameDate.getUTCDate()];
  const birthMonthAndDay = [birthdate.getUTCMonth(), birthdate.getUTCDate()];
  if (
    gameMonthAndDay[0] < birthMonthAndDay[0]
    || (gameMonthAndDay[0] === birthMonthAndDay[0] && gameMonthAndDay[1] < birthMonthAndDay[1])
  ) {
    age -= 1;
  }
  return age;
}

export function generateBirthdate(ageRange: NumericRange, gameDate: Date): string {
  const minimumAge = ageRange.minimum;
  const maximumAge = ageRange.maximum;
  const earliest = new Date(Date.UTC(
    gameDate.getUTCFullYear() - maximumAge - 1,
    gameDate.getUTCMonth(),
    gameDate.getUTCDate() + 1
  ));
  const latest = new Date(Date.UTC(
    gameDate.getUTCFullYear() - minimumAge,
    gameDate.getUTCMonth(),
    gameDate.getUTCDate()
  ));
  const day = 24 * 60 * 60 * 1000;
  const generatedTime = earliest.getTime()
    + Math.floor(Math.random() * (Math.floor((latest.getTime() - earliest.getTime()) / day) + 1)) * day;

  return new Date(generatedTime).toISOString().slice(0, 10);
}

function generatePwtr(range: NumericRange): number {
  const minimum = Math.round(range.minimum * 100);
  const maximum = Math.round(range.maximum * 100);
  return (minimum + Math.floor(Math.random() * (maximum - minimum + 1))) / 100;
}

function gameYear(gameDate: Date): number {
  return gameDate.getUTCFullYear();
}

function hasIncompleteGeneralRating(state: ManagementTrainerState): boolean {
  return state.rating !== null && (
    state.rating.overall_rating === null
    || state.rating.typing_rating === null
    || state.rating.mixed_rating === null
    || state.rating.special_rating === null
  );
}

function toRatingProposal(trainerId: number, pwtrRating: number | null, year: number): GeneralRatingProposal {
  const rating = generateGeneralRatings(trainerId, pwtrRating, year);
  return {
    overallRating: rating.overall_rating,
    typingRating: rating.typing_rating,
    mixedRating: rating.mixed_rating,
    specialRating: rating.special_rating,
  };
}

function validateRange(range: NumericRange, minimum: number, maximum: number, label: string): void {
  if (
    !Number.isFinite(range.minimum)
    || !Number.isFinite(range.maximum)
    || range.minimum < minimum
    || range.maximum > maximum
    || range.minimum > range.maximum
  ) {
    throw new TrainerManagementError(
      400,
      `${label} must be between ${minimum} and ${maximum}, with a minimum no greater than its maximum`
    );
  }
}

function validateProposalInput(input: ExistingTrainerProposalInput): void {
  if (input.ageRange) {
    validateRange(input.ageRange, MINIMUM_GENERATED_AGE, MAXIMUM_GENERATED_AGE, 'Age range');
    if (!Number.isInteger(input.ageRange.minimum) || !Number.isInteger(input.ageRange.maximum)) {
      throw new TrainerManagementError(400, 'Age range values must be whole numbers');
    }
  }
  if (input.pwtrRange) {
    validateRange(input.pwtrRange, MINIMUM_PWTR, MAXIMUM_PWTR, 'PWTR range');
  }
}

function validateNewTrainerProposalInput(input: NewTrainerProposalInput): void {
  if (!Number.isInteger(input.regionId) || input.regionId <= 0) {
    throw new TrainerManagementError(400, 'regionId must be a positive integer');
  }
  if (input.hometownCityId !== undefined && (!Number.isInteger(input.hometownCityId) || input.hometownCityId <= 0)) {
    throw new TrainerManagementError(400, 'hometownCityId must be a positive integer');
  }
  if (input.gender !== undefined && input.gender !== 'M' && input.gender !== 'F') {
    throw new TrainerManagementError(400, 'gender must be M or F');
  }
  if (typeof input.activeStatus !== 'boolean' || typeof input.includeRatings !== 'boolean') {
    throw new TrainerManagementError(400, 'activeStatus and includeRatings must be booleans');
  }

  validateRange(input.ageRange, MINIMUM_GENERATED_AGE, MAXIMUM_GENERATED_AGE, 'Age range');
  if (!Number.isInteger(input.ageRange.minimum) || !Number.isInteger(input.ageRange.maximum)) {
    throw new TrainerManagementError(400, 'Age range values must be whole numbers');
  }
  validateRange(input.pwtrRange, MINIMUM_PWTR, MAXIMUM_PWTR, 'PWTR range');
}

function validateRosterProposalInput(input: RosterProposalInput): void {
  if (
    !Number.isInteger(input.pokemonCount)
    || input.pokemonCount < 1
    || input.pokemonCount > MAXIMUM_ROSTER_PROPOSAL_SIZE
  ) {
    throw new TrainerManagementError(
      400,
      `pokemonCount must be a whole number between 1 and ${MAXIMUM_ROSTER_PROPOSAL_SIZE}`
    );
  }

  if (input.typeIds.some((typeId) => !Number.isInteger(typeId) || typeId < Types.NORMAL || typeId > Types.STELLAR)) {
    throw new TrainerManagementError(400, `typeIds must contain Pokémon type IDs between ${Types.NORMAL} and ${Types.STELLAR}`);
  }
  if (input.generations.some((generation) => !Number.isInteger(generation) || generation < 1 || generation > 9)) {
    throw new TrainerManagementError(400, 'generations must contain values between 1 and 9');
  }
}

function validateProfileProposal(profile: ProfileProposal, gameDate: Date): void {
  if (profile.regionId !== undefined && (!Number.isInteger(profile.regionId) || profile.regionId <= 0)) {
    throw new TrainerManagementError(400, 'regionId must be a positive integer');
  }
  if (profile.hometownCityId !== undefined && (!Number.isInteger(profile.hometownCityId) || profile.hometownCityId <= 0)) {
    throw new TrainerManagementError(400, 'hometownCityId must be a positive integer');
  }
  if (profile.birthdate !== undefined) {
    const birthdate = parseDateOnly(profile.birthdate);
    if (!birthdate || birthdate > gameDate) {
      throw new TrainerManagementError(400, 'birthdate must be a valid date on or before the current game date');
    }
  }
  if (profile.pwtrRating !== undefined && (
    !Number.isFinite(profile.pwtrRating)
    || profile.pwtrRating < MINIMUM_PWTR
    || profile.pwtrRating > MAXIMUM_PWTR
  )) {
    throw new TrainerManagementError(400, `pwtrRating must be between ${MINIMUM_PWTR} and ${MAXIMUM_PWTR}`);
  }
  if (profile.peakRating !== undefined && (
    !Number.isFinite(profile.peakRating)
    || profile.peakRating < MINIMUM_PWTR
    || profile.peakRating > MAXIMUM_PWTR
  )) {
    throw new TrainerManagementError(400, `peakRating must be between ${MINIMUM_PWTR} and ${MAXIMUM_PWTR}`);
  }
  if (profile.peakRank !== undefined && (!Number.isInteger(profile.peakRank) || profile.peakRank < 1)) {
    throw new TrainerManagementError(400, 'peakRank must be a positive integer');
  }
}

export function validateRatingProposal(rating: GeneralRatingProposal): void {
  const values = [rating.overallRating, rating.typingRating, rating.mixedRating, rating.specialRating];
  if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 99)) {
    throw new TrainerManagementError(400, 'General ratings must be whole numbers between 0 and 99');
  }
}

export function validateNewTrainerProfile(profile: TrainerProfileProposal, gameDate: Date, allowUnrated = false): void {
  try { validatePeakEstimates(profile.estimatedPeakAbility, profile.estimatedPeakAbilityYear, profile.birthdate, gameDate); }
  catch (error) { throw new TrainerManagementError(400, error instanceof Error ? error.message : 'Invalid peak estimates'); }
  if (!profile.fname.trim() && !profile.lname.trim()) {
    throw new TrainerManagementError(400, 'A new trainer needs a first or last name');
  }
  if (profile.fname.length > 100 || profile.lname.length > 100) {
    throw new TrainerManagementError(400, 'Trainer names must be 100 characters or fewer');
  }
  if (!Number.isInteger(profile.regionId) || profile.regionId <= 0) {
    throw new TrainerManagementError(400, 'profile.regionId must be a positive integer');
  }
  if (profile.hometownCityId !== undefined && (!Number.isInteger(profile.hometownCityId) || profile.hometownCityId <= 0)) {
    throw new TrainerManagementError(400, 'profile.hometownCityId must be a positive integer');
  }
  const birthdate = parseDateOnly(profile.birthdate);
  if (!birthdate || birthdate > gameDate) {
    throw new TrainerManagementError(400, 'profile.birthdate must be a valid date on or before the current game date');
  }
  if (!(allowUnrated && profile.pwtrRating === null) && (profile.pwtrRating === null
    || !Number.isFinite(profile.pwtrRating) || profile.pwtrRating < MINIMUM_PWTR || profile.pwtrRating > MAXIMUM_PWTR)) {
    throw new TrainerManagementError(400, `profile.pwtrRating must be between ${MINIMUM_PWTR} and ${MAXIMUM_PWTR}`);
  }
  if (!(allowUnrated && profile.peakRating === null) && (profile.peakRating === null || !Number.isFinite(profile.peakRating)
    || profile.peakRating < (profile.pwtrRating ?? MINIMUM_PWTR) || profile.peakRating > MAXIMUM_PWTR)) {
    throw new TrainerManagementError(
      400,
      `profile.peakRating must be between the current PWTR rating and ${MAXIMUM_PWTR}`
    );
  }
  if (!(allowUnrated && profile.peakRank === null) && (profile.peakRank === null || !Number.isInteger(profile.peakRank) || profile.peakRank < 1)) {
    throw new TrainerManagementError(400, 'profile.peakRank must be a positive integer');
  }
  if (typeof profile.activeStatus !== 'boolean') {
    throw new TrainerManagementError(400, 'profile.activeStatus must be a boolean');
  }
}

function generatedGender(gender: TrainerNameGender | undefined): TrainerNameGender {
  return gender ?? (Math.random() < 0.5 ? 'M' : 'F');
}

function ensureTrainerState(state: ManagementTrainerState | null, trainerId: number): ManagementTrainerState {
  if (!state) {
    throw new TrainerManagementError(404, `No trainer found with ID ${trainerId}`);
  }
  return state;
}

export async function createExistingTrainerProposal(
  database: sqlite3.Database,
  trainerId: number,
  input: ExistingTrainerProposalInput
): Promise<ExistingTrainerProposal> {
  validateProposalInput(input);
  const state = ensureTrainerState(await findManagementTrainerState(database, trainerId), trainerId);
  const currentGameDate = requireGameDate(state.gameDate);
  const profile: ProfileProposal = {};
  const notices: string[] = [];

  if (input.regionId !== undefined && input.regionId !== state.trainer.region_id) {
    if (!await regionExists(database, input.regionId)) {
      throw new TrainerManagementError(400, 'The selected region does not exist');
    }
    profile.regionId = input.regionId;
  } else if (input.regionId !== undefined) {
    notices.push('The selected region already matches the trainer’s saved region.');
  }

  const effectiveRegionId = profile.regionId ?? state.trainer.region_id;
  if (input.hometownCityId !== undefined) {
    const city = await findManagementCity(database, input.hometownCityId);
    if (!city) {
      throw new TrainerManagementError(400, 'The selected hometown does not exist');
    }
    if (effectiveRegionId === null || city.region_id !== effectiveRegionId) {
      throw new TrainerManagementError(400, 'The hometown must belong to the trainer’s selected region');
    }
    if (state.hometownCityIds.includes(city.id)) {
      notices.push('The selected hometown is already saved for this trainer.');
    } else {
      profile.hometownCityId = city.id;
      profile.hometownName = city.name;
    }
  }

  if (state.trainer.birthdate === null && input.ageRange) {
    profile.birthdate = generateBirthdate(input.ageRange, currentGameDate);
  } else if (state.trainer.birthdate !== null) {
    notices.push('Existing birthdate is preserved.');
  }

  if (state.trainer.pwtr_rating === null && input.pwtrRange) {
    profile.pwtrRating = generatePwtr(input.pwtrRange);
  } else if (state.trainer.pwtr_rating !== null) {
    notices.push('Existing PWTR is preserved.');
  }

  if (state.trainer.active_status === null && input.activeStatus !== undefined) {
    profile.activeStatus = input.activeStatus;
  } else if (state.trainer.active_status !== null) {
    notices.push('Existing activity status is preserved.');
  }

  const birthdate = profile.birthdate ?? state.trainer.birthdate;
  const pwtrRating = profile.pwtrRating ?? state.trainer.pwtr_rating;
  if (birthdate && pwtrRating !== null) {
    const age = calculateAge(requireDate(birthdate), currentGameDate);
    const careerPeak = generateTrainerCareerPeak(age, pwtrRating);
    if (state.trainer.peak_rating === null) {
      profile.peakRating = careerPeak.peak_rating;
    }
    if (state.trainer.peak_rank === null) {
      profile.peakRank = careerPeak.peak_rank;
    }
  }

  const rating = input.includeRatings && (state.rating === null || hasIncompleteGeneralRating(state))
    ? toRatingProposal(trainerId, pwtrRating, gameYear(currentGameDate))
    : null;

  if (input.includeRatings && rating === null) {
    notices.push('The latest general rating is already complete and is preserved.');
  }
  if (Object.keys(profile).length === 0) {
    notices.push('No profile fields are eligible for a proposal with the supplied constraints.');
  }

  return { trainerId, profile, rating, notices };
}

export async function createRosterProposal(
  database: sqlite3.Database,
  trainerId: number,
  input: RosterProposalInput
): Promise<RosterProposal> {
  validateRosterProposalInput(input);
  const state = ensureTrainerState(await findManagementTrainerState(database, trainerId), trainerId);
  const currentGameDate = requireGameDate(state.gameDate);
  const overallRating = state.rating?.overall_rating
    ?? (state.trainer.pwtr_rating === null ? null : convertPWTRToOverallRating(state.trainer.pwtr_rating));

  if (overallRating === null) {
    throw new TrainerManagementError(
      409,
      'A current PWTR or overall rating is required before generating a roster proposal'
    );
  }

  const generatedPokemon = generatePokemonTeam(
    overallRating,
    input.typeIds,
    input.generations,
    undefined,
    {
      teamSize: input.pokemonCount,
      excludedSpeciesIds: state.existingPokemonSpeciesIds,
      uniqueSpecies: true,
    }
  );

  if (generatedPokemon.length !== input.pokemonCount) {
    throw new TrainerManagementError(
      409,
      'The selected constraints do not leave enough distinct species for this roster proposal'
    );
  }

  const plannedRosterLevels = [
    ...state.existingPokemonLevels,
    ...generatedPokemon.map((pokemon) => pokemon.level),
  ];

  return {
    trainerId,
    existingPokemonCount: state.existingPokemonCount,
    pokemon: generatedPokemon.map((pokemon) => ({
      speciesId: pokemon.species_id,
      pokemonId: pokemon.pokemon_id,
      name: pokemon.name,
      level: pokemon.level,
      typeIds: pokemon.types,
      isMega: pokemon.is_mega,
      isGigantamax: pokemon.is_gigantamax,
      details: generatePokemonDetails({
        trainerId,
        trainerFirstName: state.trainer.fname,
        trainerLastName: state.trainer.lname,
        trainerPwtrRating: state.trainer.pwtr_rating,
        trainerBirthdate: state.trainer.birthdate,
        speciesId: pokemon.species_id,
        pokemonId: pokemon.pokemon_id,
        level: pokemon.level,
        gameDate: currentGameDate.toISOString().slice(0, 10),
        rosterLevels: plannedRosterLevels,
      }),
    })),
    overallRating,
    notices: [
      'Review the generated detail records, then apply this proposal to create exactly these Pokémon rows.',
      'Existing trainer-owned species are excluded from this proposal and are never replaced or removed.',
    ],
  };
}

function requireIntegerInRange(value: unknown, label: string, minimum: number, maximum: number): void {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < minimum || value > maximum) {
    throw new TrainerManagementError(400, `${label} must be a whole number between ${minimum} and ${maximum}`);
  }
}

function requireNonNegativeInteger(value: unknown, label: string): void {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new TrainerManagementError(400, `${label} must be a non-negative whole number`);
  }
}

export function validateRosterPokemon(
  trainerId: number,
  trainer: ManagementTrainerState['trainer'],
  gameDate: Date,
  pokemon: RosterPokemonProposal
): void {
  requireIntegerInRange(pokemon.speciesId, 'pokemon.speciesId', 1, Number.MAX_SAFE_INTEGER);
  requireIntegerInRange(pokemon.pokemonId, 'pokemon.pokemonId', 1, Number.MAX_SAFE_INTEGER);
  requireIntegerInRange(pokemon.level, 'pokemon.level', 1, 100);
  if (typeof pokemon.name !== 'string' || pokemon.name.length === 0) {
    throw new TrainerManagementError(400, 'pokemon.name must be a non-empty string');
  }
  if (typeof pokemon.isMega !== 'boolean' || typeof pokemon.isGigantamax !== 'boolean') {
    throw new TrainerManagementError(400, 'pokemon form flags must be booleans');
  }
  if (!Array.isArray(pokemon.typeIds) || pokemon.typeIds.some((typeId) => !Number.isInteger(typeId))) {
    throw new TrainerManagementError(400, 'pokemon.typeIds must contain whole numbers');
  }

  const species = allSpecies.find((candidate) => candidate.id === pokemon.speciesId);
  const pokemonEntity = allPokemon.find((candidate) => candidate.id === pokemon.pokemonId);
  if (!species || !pokemonEntity || pokemonEntity.species !== pokemon.speciesId || !species.varieties.includes(pokemon.pokemonId)) {
    throw new TrainerManagementError(400, 'Each proposed Pokémon must use a valid species and form pair');
  }
  if (pokemon.name !== pokemonEntity.name) {
    throw new TrainerManagementError(400, 'pokemon.name must match the selected Pokémon form');
  }

  const details = pokemon.details;
  const expectedOtName = [trainer.fname, trainer.lname].filter(Boolean).join(' ');
  if (details.otName !== expectedOtName || details.otId !== trainerId || details.nickname !== species.name) {
    throw new TrainerManagementError(409, 'A roster proposal no longer matches the selected trainer or Pokémon species');
  }
  if (!['male', 'female', 'genderless'].includes(details.gender)) {
    throw new TrainerManagementError(400, 'pokemon.details.gender must be male, female, or genderless');
  }
  if (typeof details.shiny !== 'boolean') {
    throw new TrainerManagementError(400, 'pokemon.details.shiny must be a boolean');
  }
  if (typeof details.dateMetAt !== 'string') {
    throw new TrainerManagementError(400, 'pokemon.details.dateMetAt must be a date string');
  }
  const dateMetAt = parseDateOnly(details.dateMetAt);
  if (!dateMetAt || dateMetAt > gameDate) {
    throw new TrainerManagementError(400, 'pokemon.details.dateMetAt must be a valid date on or before the current game date');
  }

  const boundedValues: ReadonlyArray<readonly [unknown, string, number, number]> = [
    [details.happiness, 'pokemon.details.happiness', 1, 255],
    [details.levelMetAt, 'pokemon.details.levelMetAt', 1, pokemon.level],
    [details.currentHp, 'pokemon.details.currentHp', 0, Number.MAX_SAFE_INTEGER],
    [details.currentStrength, 'pokemon.details.currentStrength', 0, Number.MAX_SAFE_INTEGER],
    [details.statusId, 'pokemon.details.statusId', 0, Number.MAX_SAFE_INTEGER],
    [details.trainingEfficiency, 'pokemon.details.trainingEfficiency', 1, 100],
    [details.abilityId, 'pokemon.details.abilityId', 0, Number.MAX_SAFE_INTEGER],
    [details.natureId, 'pokemon.details.natureId', 0, Number.MAX_SAFE_INTEGER],
    [details.evHp, 'pokemon.details.evHp', 0, 252],
    [details.evAttack, 'pokemon.details.evAttack', 0, 252],
    [details.evDefense, 'pokemon.details.evDefense', 0, 252],
    [details.evSpecialAttack, 'pokemon.details.evSpecialAttack', 0, 252],
    [details.evSpecialDefense, 'pokemon.details.evSpecialDefense', 0, 252],
    [details.evSpeed, 'pokemon.details.evSpeed', 0, 252],
    [details.ivHp, 'pokemon.details.ivHp', 0, 31],
    [details.ivAttack, 'pokemon.details.ivAttack', 0, 31],
    [details.ivDefense, 'pokemon.details.ivDefense', 0, 31],
    [details.ivSpecialAttack, 'pokemon.details.ivSpecialAttack', 0, 31],
    [details.ivSpecialDefense, 'pokemon.details.ivSpecialDefense', 0, 31],
    [details.ivSpeed, 'pokemon.details.ivSpeed', 0, 31],
    [details.hp, 'pokemon.details.hp', 1, Number.MAX_SAFE_INTEGER],
    [details.attack, 'pokemon.details.attack', 1, Number.MAX_SAFE_INTEGER],
    [details.defense, 'pokemon.details.defense', 1, Number.MAX_SAFE_INTEGER],
    [details.specialAttack, 'pokemon.details.specialAttack', 1, Number.MAX_SAFE_INTEGER],
    [details.specialDefense, 'pokemon.details.specialDefense', 1, Number.MAX_SAFE_INTEGER],
    [details.speed, 'pokemon.details.speed', 1, Number.MAX_SAFE_INTEGER],
  ];
  boundedValues.forEach(([value, label, minimum, maximum]) => requireIntegerInRange(value, label, minimum, maximum));
  [
    [details.pokeballId, 'pokemon.details.pokeballId'],
    [details.heldItemId, 'pokemon.details.heldItemId'],
    [details.experiencePoints, 'pokemon.details.experiencePoints'],
    [details.battlesWon, 'pokemon.details.battlesWon'],
    [details.battlesLost, 'pokemon.details.battlesLost'],
    [details.kills, 'pokemon.details.kills'],
    [details.deaths, 'pokemon.details.deaths'],
  ].forEach(([value, label]) => requireNonNegativeInteger(value, label as string));
}

export async function applyRosterProposal(
  database: sqlite3.Database,
  trainerId: number,
  input: RosterApplyInput
): Promise<number> {
  if (!Array.isArray(input.pokemon) || input.pokemon.length < 1 || input.pokemon.length > MAXIMUM_ROSTER_PROPOSAL_SIZE) {
    throw new TrainerManagementError(400, `pokemon must contain between 1 and ${MAXIMUM_ROSTER_PROPOSAL_SIZE} entries`);
  }

  return runInTransaction(database, async () => {
    const state = ensureTrainerState(await findManagementTrainerState(database, trainerId), trainerId);
    const gameDate = requireGameDate(state.gameDate);
    const existingSpeciesIds = new Set(state.existingPokemonSpeciesIds);
    const proposedSpeciesIds = new Set<number>();

    for (const pokemon of input.pokemon) {
      validateRosterPokemon(trainerId, state.trainer, gameDate, pokemon);
      if (existingSpeciesIds.has(pokemon.speciesId) || proposedSpeciesIds.has(pokemon.speciesId)) {
        throw new TrainerManagementError(409, 'Roster proposals cannot add a species the trainer already owns or duplicate a proposed species');
      }
      proposedSpeciesIds.add(pokemon.speciesId);
    }

    for (const pokemon of input.pokemon) {
      await createGeneratedPokemonInstance(database, {
        trainerId,
        speciesId: pokemon.speciesId,
        pokemonId: pokemon.pokemonId,
        level: pokemon.level,
        isMega: pokemon.isMega,
        isGigantamax: pokemon.isGigantamax,
        details: pokemon.details,
      });
    }
    return input.pokemon.length;
  });
}

export async function createNewTrainerProposal(
  database: sqlite3.Database,
  input: NewTrainerProposalInput
): Promise<NewTrainerProposal> {
  validateNewTrainerProposalInput(input);
  const gameDate = requireGameDate(await findManagementGameDate(database));
  if (!await regionExists(database, input.regionId)) {
    throw new TrainerManagementError(400, 'The selected region does not exist');
  }

  let hometownName: string | undefined;
  if (input.hometownCityId !== undefined) {
    const hometown = await findManagementCity(database, input.hometownCityId);
    if (!hometown) {
      throw new TrainerManagementError(400, 'The selected hometown does not exist');
    }
    if (hometown.region_id !== input.regionId) {
      throw new TrainerManagementError(400, 'The hometown must belong to the selected region');
    }
    hometownName = hometown.name;
  }

  const nameGender = generatedGender(input.gender);
  const name = await generateName(database, input.regionId, nameGender);
  if (!name.fname?.trim() || !name.lname?.trim()) {
    throw new TrainerManagementError(409, 'The selected region does not have enough name data for a complete generated name');
  }

  const pwtrRating = generatePwtr(input.pwtrRange);
  const birthdate = generateBirthdate(input.ageRange, gameDate);
  const careerPeak = generateTrainerCareerPeak(calculateAge(requireDate(birthdate), gameDate), pwtrRating);
  const profile: NewTrainerProfileProposal = {
    fname: name.fname,
    lname: name.lname,
    regionId: input.regionId,
    hometownCityId: input.hometownCityId,
    hometownName,
    birthdate,
    pwtrRating,
    peakRating: careerPeak.peak_rating,
    peakRank: careerPeak.peak_rank,
    activeStatus: input.activeStatus,
  };

  return {
    profile,
    rating: input.includeRatings ? toRatingProposal(0, pwtrRating, gameYear(gameDate)) : null,
    nameGender,
    notices: [
      'This proposal creates a new trainer only after you explicitly apply the reviewed values.',
      'No Pokémon roster is included. Roster composition stays a separate preview-only workflow.',
    ],
  };
}

export async function applyNewTrainerProposal(
  database: sqlite3.Database,
  input: NewTrainerApplyInput
): Promise<number> {
  return runInTransaction(database, async () => {
    const gameDate = requireGameDate(await findManagementGameDate(database));
    validateNewTrainerProfile(input.profile, gameDate);
    try {
      await peakEstimateStorage(database, input.profile.estimatedPeakAbility, input.profile.estimatedPeakAbilityYear);
    } catch (error) {
      throw new TrainerManagementError(409, error instanceof Error ? error.message : 'Invalid peak-estimate schema');
    }
    if (!await regionExists(database, input.profile.regionId)) {
      throw new TrainerManagementError(400, 'The selected region does not exist');
    }

    if (input.profile.hometownCityId !== undefined) {
      const hometown = await findManagementCity(database, input.profile.hometownCityId);
      if (!hometown) {
        throw new TrainerManagementError(400, 'The selected hometown does not exist');
      }
      if (hometown.region_id !== input.profile.regionId) {
        throw new TrainerManagementError(400, 'The hometown must belong to the selected region');
      }
    }

    if (input.rating) {
      validateRatingProposal(input.rating);
    }

    const statement = await createManagementTrainer(database, {
      ...input.profile,
      fname: input.profile.fname.trim(),
      lname: input.profile.lname.trim(),
    });
    const trainerId = statement.lastInsertId;
    if (input.profile.hometownCityId !== undefined) {
      await addTrainerHometown(database, trainerId, input.profile.hometownCityId);
    }
    if (input.rating) {
      await createGeneralRating(database, trainerId, gameYear(gameDate), input.rating);
    }
    return trainerId;
  });
}

function requireDate(value: string): Date {
  const parsedDate = parseDateOnly(value);
  if (!parsedDate) {
    throw new TrainerManagementError(409, 'The trainer has an invalid saved birthdate');
  }
  return parsedDate;
}

function assertMissingProfileFields(state: ManagementTrainerState, profile: ProfileProposal): void {
  if (profile.birthdate !== undefined && state.trainer.birthdate !== null) {
    throw new TrainerManagementError(409, 'The trainer already has a birthdate; the proposal cannot overwrite it');
  }
  if (profile.pwtrRating !== undefined && state.trainer.pwtr_rating !== null) {
    throw new TrainerManagementError(409, 'The trainer already has a PWTR rating; the proposal cannot overwrite it');
  }
  if (profile.peakRating !== undefined && state.trainer.peak_rating !== null) {
    throw new TrainerManagementError(409, 'The trainer already has a peak rating; the proposal cannot overwrite it');
  }
  if (profile.peakRank !== undefined && state.trainer.peak_rank !== null) {
    throw new TrainerManagementError(409, 'The trainer already has a peak rank; the proposal cannot overwrite it');
  }
  if (profile.activeStatus !== undefined && state.trainer.active_status !== null) {
    throw new TrainerManagementError(409, 'The trainer already has an activity status; the proposal cannot overwrite it');
  }
}

async function validateHometownForApply(
  database: sqlite3.Database,
  state: ManagementTrainerState,
  profile: ProfileProposal
): Promise<void> {
  if (profile.hometownCityId === undefined) {
    return;
  }

  const city = await findManagementCity(database, profile.hometownCityId);
  if (!city) {
    throw new TrainerManagementError(400, 'The selected hometown does not exist');
  }

  const effectiveRegionId = profile.regionId ?? state.trainer.region_id;
  if (effectiveRegionId === null || city.region_id !== effectiveRegionId) {
    throw new TrainerManagementError(400, 'The hometown must belong to the trainer’s selected region');
  }
}

export async function applyExistingTrainerProposal(
  database: sqlite3.Database,
  trainerId: number,
  input: ExistingTrainerApplyInput
): Promise<void> {
  if (!input.profile && !input.rating) {
    throw new TrainerManagementError(400, 'Select at least one proposal section to apply');
  }

  await runInTransaction(database, async () => {
    const state = ensureTrainerState(await findManagementTrainerState(database, trainerId), trainerId);
    const currentGameDate = requireGameDate(state.gameDate);

    if (input.profile) {
      validateProfileProposal(input.profile, currentGameDate);
      assertMissingProfileFields(state, input.profile);
      if (input.profile.regionId !== undefined && !await regionExists(database, input.profile.regionId)) {
        throw new TrainerManagementError(400, 'The selected region does not exist');
      }
      await validateHometownForApply(database, state, input.profile);

      const effectivePwtr = input.profile.pwtrRating ?? state.trainer.pwtr_rating;
      if (
        input.profile.peakRating !== undefined
        && effectivePwtr !== null
        && input.profile.peakRating < effectivePwtr
      ) {
        throw new TrainerManagementError(400, 'peakRating cannot be lower than the current PWTR rating');
      }

      await updateTrainerProfile(database, trainerId, input.profile);
      if (input.profile.hometownCityId !== undefined) {
        await addTrainerHometown(database, trainerId, input.profile.hometownCityId);
      }
    }

    if (input.rating) {
      validateRatingProposal(input.rating);
      const year = gameYear(currentGameDate);
      if (state.rating) {
        await fillMissingGeneralRating(database, state.rating.id, input.rating);
      } else {
        await createGeneralRating(database, trainerId, year, input.rating);
      }
    }
  });
}
