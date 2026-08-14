import { type Request, type Response } from 'express';
import {
  findPokemonCatalogEntryById,
  findPokemonSpeciesById,
  listPokemonCatalog,
  listPokemonSpecies,
} from './pokemon.catalog';

interface CatalogQuery {
  limit?: string | string[];
}

function parseLegacyLimit(value: string | string[] | undefined): number | null | undefined {
  if (!value) {
    return undefined;
  }

  const limit = parseInt(value as string, 10);
  return limit && (Number.isNaN(limit) || limit <= 0) ? null : (limit || undefined);
}

function parseLegacyId(value: string): number | null {
  const id = parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
}

export function listSpecies(
  request: Request<Record<string, never>, unknown, unknown, CatalogQuery>,
  response: Response
): void {
  try {
    const limit = parseLegacyLimit(request.query.limit);
    if (limit === null) {
      response.status(400).json({ success: false, message: 'Invalid limit parameter' });
      return;
    }

    response.json({ success: true, data: listPokemonSpecies(limit) });
  } catch (error) {
    console.error('Error fetching Pokemon species:', error);
    response.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export function getSpecies(request: Request<{ id: string }>, response: Response): void {
  try {
    const speciesId = parseLegacyId(request.params.id);
    if (speciesId === null) {
      response.status(400).json({ success: false, message: 'Invalid species ID' });
      return;
    }

    const species = findPokemonSpeciesById(speciesId);
    if (!species) {
      response.status(404).json({ success: false, message: 'Pokemon species not found' });
      return;
    }

    response.json({ success: true, data: species });
  } catch (error) {
    console.error('Error fetching Pokemon species:', error);
    response.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export function listPokemon(
  request: Request<Record<string, never>, unknown, unknown, CatalogQuery>,
  response: Response
): void {
  try {
    const limit = parseLegacyLimit(request.query.limit);
    if (limit === null) {
      response.status(400).json({ success: false, message: 'Invalid limit parameter' });
      return;
    }

    response.json({ success: true, data: listPokemonCatalog(limit) });
  } catch (error) {
    console.error('Error fetching Pokemon entities:', error);
    response.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export function getPokemon(request: Request<{ id: string }>, response: Response): void {
  try {
    const pokemonId = parseLegacyId(request.params.id);
    if (pokemonId === null) {
      response.status(400).json({ success: false, message: 'Invalid Pokemon ID' });
      return;
    }

    const pokemon = findPokemonCatalogEntryById(pokemonId);
    if (!pokemon) {
      response.status(404).json({ success: false, message: 'Pokemon not found' });
      return;
    }

    response.json({ success: true, data: pokemon });
  } catch (error) {
    console.error('Error fetching Pokemon entity:', error);
    response.status(500).json({ success: false, message: 'Internal server error' });
  }
}
