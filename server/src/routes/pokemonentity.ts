import { Router } from 'express';
import { allPokemon, initPokemon } from '../data/pokemon';
import { Types } from '../data/enums/types';

const router: Router = Router();

// Initialize Pokemon data once
let initialized = false;
if (!initialized) {
    initPokemon();
    initialized = true;
}

// Helper function to convert Types enum to string
function typeEnumToString(typeEnum: Types): string {
    return Types[typeEnum] || 'UNKNOWN';
}

// GET / - Get all Pokemon entities with optional limit
router.get('/', (req: any, res: any) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
        
        if (limit && (isNaN(limit) || limit <= 0)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid limit parameter'
            });
        }

        let pokemonList = allPokemon.map(pokemon => ({
            id: pokemon.id,
            name: pokemon.name,
            types: pokemon.types.map(type => typeEnumToString(type)),
            base_stats: {
                hp: pokemon.baseHP,
                attack: pokemon.baseATK,
                defense: pokemon.baseDEF,
                special_attack: pokemon.baseSPATK,
                special_defense: pokemon.baseSPDEF,
                speed: pokemon.baseSPE
            }
        }));

        // Apply limit if specified
        if (limit) {
            pokemonList = pokemonList.slice(0, limit);
        }

        res.json({
            success: true,
            data: pokemonList
        });
    } catch (error) {
        console.error('Error fetching Pokemon entities:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET /:id - Get Pokemon entity by ID
router.get('/:id', (req: any, res: any) => {
    try {
        const pokemonId = parseInt(req.params.id);
        
        if (isNaN(pokemonId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Pokemon ID'
            });
        }

        const pokemon = allPokemon.find(p => p.id === pokemonId);
        
        if (!pokemon) {
            return res.status(404).json({
                success: false,
                message: 'Pokemon not found'
            });
        }

        // Convert the PokemonEntity to the simplified format expected by frontend
        const pokemonEntity = {
            id: pokemon.id,
            name: pokemon.name,
            types: pokemon.types.map(type => typeEnumToString(type)),
            base_stats: {
                hp: pokemon.baseHP,
                attack: pokemon.baseATK,
                defense: pokemon.baseDEF,
                special_attack: pokemon.baseSPATK,
                special_defense: pokemon.baseSPDEF,
                speed: pokemon.baseSPE
            }
        };

        res.json({
            success: true,
            data: pokemonEntity
        });
    } catch (error) {
        console.error('Error fetching Pokemon entity:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

export default router;
