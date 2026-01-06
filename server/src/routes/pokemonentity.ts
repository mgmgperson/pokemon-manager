import { Router } from 'express';
import { allPokemon, initPokemon } from '../data/pokemon';
import { allSpecies, initSpecies } from '../data/pokemon-species';
import { Types } from '../data/enums/types';
import { Abilities } from '../data/enums/abilities';
import { EggGroups } from '../data/enums/egg-groups';
import { GrowthRates } from '../data/enums/growth-rates';
import { Pokemon } from '../data/enums/pokemon';

const router: Router = Router();

// Initialize Pokemon data once
let initialized = false;
if (!initialized) {
    initPokemon();
    initSpecies();
    initialized = true;
}

// Helper function to convert Types enum to string
function typeEnumToString(typeEnum: Types): string {
    return Types[typeEnum] || 'UNKNOWN';
}

// Helper function to convert Abilities enum to string
function abilityEnumToString(abilityEnum: Abilities): string {
    return Abilities[abilityEnum] || 'UNKNOWN';
}

// Helper function to convert EggGroups enum to string
function eggGroupEnumToString(eggGroupEnum: EggGroups): string {
    return EggGroups[eggGroupEnum] || 'UNKNOWN';
}

// Helper function to convert GrowthRates enum to string
function growthRateEnumToString(growthRateEnum: GrowthRates): string {
    return GrowthRates[growthRateEnum] || 'UNKNOWN';
}

// Helper function to convert Pokemon enum to string
function pokemonEnumToString(pokemonEnum: Pokemon): string {
    return Pokemon[pokemonEnum] || 'UNKNOWN';
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
            is_default: pokemon.isDefault,
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

// GET /:id - Get Pokemon entity by ID with species information
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

        // Find corresponding species
        const species = allSpecies.find(s => s.id === pokemon.species);
        
        if (!species) {
            return res.status(404).json({
                success: false,
                message: 'Pokemon species not found'
            });
        }

        // Get varieties (all Pokemon forms for this species)
        const varieties = allPokemon
            .filter(p => p.species === pokemon.species)
            .map(p => ({
                id: p.id,
                name: p.name,
                is_default: p.isDefault
            }));

        // Convert the PokemonEntity to detailed format with species info
        const pokemonDetail = {
            // Entity information
            id: pokemon.id,
            name: pokemon.name,
            types: pokemon.types.map(type => typeEnumToString(type)),
            is_default: pokemon.isDefault,
            base_experience: pokemon.baseExperience,
            abilities: pokemon.abilities.map(ability => abilityEnumToString(ability)),
            height: pokemon.height,
            weight: pokemon.weight,
            base_stats: {
                hp: pokemon.baseHP,
                attack: pokemon.baseATK,
                defense: pokemon.baseDEF,
                special_attack: pokemon.baseSPATK,
                special_defense: pokemon.baseSPDEF,
                speed: pokemon.baseSPE
            },
            
            // Species information
            species: {
                id: species.id,
                name: species.name,
                generation: species.generation,
                genera: species.genera,
                base_happiness: species.baseHappiness,
                capture_rate: species.captureRate,
                egg_groups: species.eggGroups.map(eg => eggGroupEnumToString(eg)),
                evolves_from: species.evolvesFrom !== null ? {
                    id: species.evolvesFrom,
                    name: allSpecies.find(s => s.id === species.evolvesFrom)?.name || 'Unknown'
                } : null,
                forms_switchable: species.formsSwitchable,
                gender_rate: species.genderRate,
                gender_ratio: species.getGenderRatio(),
                growth_rate: growthRateEnumToString(species.growthRate),
                has_gender_differences: species.hasGenderDifferences,
                hatch_counter: species.hatchCounter,
                is_baby: species.isBaby,
                is_legendary: species.isLegendary,
                is_mythical: species.isMythical,
                varieties: varieties
            }
        };

        res.json({
            success: true,
            data: pokemonDetail
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
