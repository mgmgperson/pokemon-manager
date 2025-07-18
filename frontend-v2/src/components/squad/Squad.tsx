import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Button,
} from '@mui/material';
import { Pokemon, PokemonEntity } from '../../types/pokemon';
import { GameState } from '../../types/gamestate';
import TypeBadge from '../TypeBadge';

type StatKey = 'hp' | 'attack' | 'defense' | 'special_attack' | 'special_defense' | 'speed';

const statNameMapping: Record<StatKey, string> = {
    hp: 'HP',
    attack: 'ATK',
    defense: 'DEF',
    special_attack: 'SPA',
    special_defense: 'SPD',
    speed: 'SPE'
};

interface PokemonWithTrainer extends Pokemon {
  trainer_fname: string;
  trainer_lname: string;
}

const fetchGameState = async (): Promise<GameState> => {
  const response = await axios.get('http://localhost:5000/game_state/home');
  return response.data.data;
};

const fetchTrainerPokemon = async (trainerId: number): Promise<PokemonWithTrainer[]> => {
  const response = await axios.get(`http://localhost:5000/trainers/${trainerId}/pokemon`);
  return response.data.data;
};

const fetchPokemonEntity = async (pokemonId: number): Promise<PokemonEntity> => {
  const response = await axios.get(`http://localhost:5000/pokemon-entity/${pokemonId}`);
  return response.data.data;
};

const Squad: React.FC = () => {
  const navigate = useNavigate();
  const [pokemonEntities, setPokemonEntities] = useState<Record<number, PokemonEntity>>({});

  const { data: gameState, isLoading: gameStateLoading } = useQuery<GameState>({
    queryKey: ['gameState'],
    queryFn: fetchGameState,
  });

  const { data: pokemon, isLoading: pokemonLoading } = useQuery<PokemonWithTrainer[]>({
    queryKey: ['trainerPokemon', gameState?.active_trainer_id],
    queryFn: () => fetchTrainerPokemon(gameState!.active_trainer_id),
    enabled: !!gameState?.active_trainer_id,
  });

  // Fetch pokemon entities for each pokemon
  useEffect(() => {
    if (pokemon) {
      const fetchEntities = async () => {
        const entities: Record<number, PokemonEntity> = {};
        
        for (const p of pokemon) {
          if (p.species_id && !entities[p.species_id]) {
            try {
              const entity = await fetchPokemonEntity(p.species_id);
              entities[p.species_id] = entity;
            } catch (error) {
              console.error(`Failed to fetch entity for species ${p.species_id}:`, error);
            }
          }
        }
        
        setPokemonEntities(entities);
      };

      fetchEntities();
    }
  }, [pokemon]);

  const renderStatBars = (pokemon: any) => {
    const stats: Record<StatKey, number> = {
      hp: pokemon.hp || 0,
      attack: pokemon.attack || 0,
      defense: pokemon.defense || 0,
      special_attack: pokemon.special_attack || 0,
      special_defense: pokemon.special_defense || 0,
      speed: pokemon.speed || 0,
    };

    return (Object.keys(stats) as StatKey[]).map((stat) => {
      const percentage = (stats[stat] / 500) * 100;
      const hue = (stats[stat] / 500) * 180;
      const color = `hsl(${hue}, 100%, 50%)`;

      return (
        <div key={stat} className="stat-bar-container mb-2">
          <div className="!flex !items-center !gap-2">
            <span className="stat-bar-label !w-12 !text-gray-400">{statNameMapping[stat]}</span>
            <div className="stat-bar !flex-1" style={{ height: '10px', backgroundColor: '#ddd', borderRadius: '5px' }}>
              <div
                className="stat-bar-fill"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color,
                  height: '100%',
                  borderRadius: '5px',
                }}
              />
            </div>
          </div>
        </div>
      );
    });
  };

  const handleViewPokemon = (pokemonId: number) => {
    if (gameState) {
      navigate(`/trainers/${gameState.active_trainer_id}/pokemon/${pokemonId}`);
    }
  };

  const handleEditPokemon = (pokemonId: number) => {
    if (gameState) {
      navigate(`/trainers/${gameState.active_trainer_id}/edit_pokemon/${pokemonId}`);
    }
  };

  const handleAddPokemon = () => {
    if (gameState) {
      navigate(`/trainers/${gameState.active_trainer_id}/add_pokemon`);
    }
  };

  if (gameStateLoading || pokemonLoading) {
    return (
      <Box className="!flex !justify-center !items-center !h-full">
        <Typography variant="h6" className="!text-white">
          Loading squad...
        </Typography>
      </Box>
    );
  }

  if (!gameState) {
    return (
      <Box className="!flex !justify-center !items-center !h-full">
        <Typography variant="h6" className="!text-white">
          No active game state found
        </Typography>
      </Box>
    );
  }

  const trainerName = `${gameState.trainer_fname} ${gameState.trainer_lname}`;

  // Sort pokemon by level (descending)
  const sortedPokemon = pokemon ? [...pokemon].sort((a, b) => b.level - a.level) : [];

  return (
    <Box className="!p-6">
      <Paper className="!p-6 !bg-gray-800">
        <Box className="!flex !justify-between !items-center !mb-6">
          <Box>
            <Typography variant="h4" className="!mb-2 !text-white">
              {trainerName}'s Squad
            </Typography>
            <Typography variant="body1" className="!text-gray-400">
              Location: {gameState.location_name}, {gameState.region_name}
            </Typography>
            <Typography variant="body2" className="!text-gray-500">
              {gameState.current_date} - {gameState.current_time}
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={handleAddPokemon}
            className="!bg-green-600 hover:!bg-green-700"
          >
            Add Pokemon
          </Button>
        </Box>

        {sortedPokemon && sortedPokemon.length > 0 ? (
          <div className="!grid !grid-cols-1 sm:!grid-cols-2 md:!grid-cols-3 lg:!grid-cols-4 !gap-6">
            {sortedPokemon.map((p: Pokemon) => {
              const entity = pokemonEntities[p.species_id];
              const pokemonName = p.nickname || entity?.name || 'Unknown Pokemon';
              
              return (
                <div key={p.id}>
                  <div
                    onClick={() => handleViewPokemon(p.id)}
                    className="!no-underline !cursor-pointer"
                  >
                    <Paper className="!p-4 !bg-gray-700 !hover:!bg-gray-600 !transition-colors">
                      <Box className="!flex !flex-col !items-center">
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemon_id}.png`}
                          alt={pokemonName}
                          className="!w-32 !h-32 !object-contain"
                        />
                        <Typography variant="h6" className="!text-white !mt-2">
                          {pokemonName}
                        </Typography>
                        <Typography variant="body2" className="!text-gray-400">
                          Level: {p.level}
                          {p.is_mega ? ' (Mega)' : p.is_gigantamax ? ' (Gigantamax)' : ''}
                        </Typography>
                        <Box className="!flex !gap-2 !mt-2">
                          {entity?.types.map((type: string, index: number) => (
                            <TypeBadge key={index} type={type.toLowerCase()} />
                          ))}
                        </Box>
                        <Box className="!w-full !mt-4 !space-y-2">
                          {renderStatBars(p)}
                        </Box>
                        <Box className="!flex !gap-2 !mt-4 !w-full">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewPokemon(p.id);
                            }}
                            className="!flex-1 !text-blue-400 !border-blue-400 hover:!bg-blue-400 hover:!text-white"
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPokemon(p.id);
                            }}
                            className="!flex-1 !text-yellow-400 !border-yellow-400 hover:!bg-yellow-400 hover:!text-white"
                          >
                            Edit
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Box className="!text-center !py-12">
            <Typography variant="h6" className="!text-gray-400 !mb-4">
              No Pokemon in your squad
            </Typography>
            <Button
              variant="contained"
              onClick={handleAddPokemon}
              className="!bg-green-600 hover:!bg-green-700"
            >
              Add Your First Pokemon
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Squad;
