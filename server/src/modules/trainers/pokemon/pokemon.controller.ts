import { type Request, type Response } from 'express';
import { getActiveDB } from '../../../infrastructure/database/activeSave';
import {
  createPokemonInstance as createPokemonInstanceRecord,
  findPokemonInstanceById,
  updatePokemonInstance as updatePokemonInstanceRecord,
  type PokemonWriteInput,
} from './pokemon.repository';

export async function getPokemonInstance(
  request: Request<{ id: string }>,
  response: Response
): Promise<void> {
  try {
    const pokemon = await findPokemonInstanceById(getActiveDB(), request.params.id);

    if (!pokemon) {
      response.status(404).json({ message: 'Pokémon not found' });
      return;
    }

    response.json({ message: 'success', data: pokemon });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function updatePokemonInstance(
  request: Request<{ id: string }, unknown, PokemonWriteInput>,
  response: Response
): Promise<void> {
  try {
    const statementResult = await updatePokemonInstanceRecord(
      getActiveDB(),
      request.params.id,
      request.body
    );
    response.json({
      message: 'success',
      data: request.body,
      changes: statementResult.changes,
    });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}

export async function createPokemonInstance(
  request: Request<Record<string, never>, unknown, PokemonWriteInput>,
  response: Response
): Promise<void> {
  try {
    await createPokemonInstanceRecord(getActiveDB(), request.body);
    response.json({ message: 'success', data: request.body });
  } catch (error) {
    response.status(400).json({ error: (error as Error).message });
  }
}
