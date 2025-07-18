import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Box, Typography, Paper, Button } from '@mui/material';
import TypeBadge from '../../TypeBadge';
import { Pokemon, PokemonEntity } from '../../../types/pokemon';

type StatKey = 'hp' | 'attack' | 'defense' | 'special_attack' | 'special_defense' | 'speed';

const statNameMapping: Record<StatKey, string> = {
    hp: 'HP',
    attack: 'ATK',
    defense: 'DEF',
    special_attack: 'SPA',
    special_defense: 'SPD',
    speed: 'SPE'
};

const fetchTrainer = async (id: string) => {
    const { data } = await axios.get(`http://localhost:5000/trainers/${id}`);
    return data.data;
};

const fetchTrainerPokemon = async (id: string) => {
    const { data } = await axios.get(`http://localhost:5000/trainers/${id}/pokemon`);
    return data.data;
};

const fetchPokemonEntity = async (pokemonId: number) => {
    const { data } = await axios.get(`http://localhost:5000/pokemon-entity/${pokemonId}`);
    return data.data;
};

const TrainerPokemon: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [pokemonEntityData, setPokemonEntityData] = useState<Record<number, PokemonEntity>>({});

    const { data: trainerData, isLoading: isTrainerLoading } = useQuery({
        queryKey: ['trainer', id],
        queryFn: () => fetchTrainer(id!),
    });

    const { data: pokemonData, isLoading: isPokemonLoading } = useQuery({
        queryKey: ['trainerPokemon', id],
        queryFn: () => fetchTrainerPokemon(id!),
    });

    useEffect(() => {
        if (pokemonData) {
            const fetchPokemonEntityData = async () => {
                const entityMap: Record<number, PokemonEntity> = {};
                for (const pokemon of pokemonData) {
                    if (!entityMap[pokemon.pokemon_id]) {
                        const entityData = await fetchPokemonEntity(pokemon.pokemon_id);
                        entityMap[pokemon.pokemon_id] = entityData;
                    }
                }
                setPokemonEntityData(entityMap);
            };
            fetchPokemonEntityData();
        }
    }, [pokemonData]);

    if (isTrainerLoading || isPokemonLoading) {
        return (
            <Box className="!flex !justify-center !items-center !h-full">
                <Typography variant="h6" className="!text-white">
                    Loading...
                </Typography>
            </Box>
        );
    }

    const trainer = trainerData.trainer;
    const trainerName = `${trainer.fname} ${trainer.lname}`;

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

    const sortedPokemon = [...pokemonData].sort((a, b) => b.level - a.level);

    return (
        <Box className="!p-6">
            <Paper className="!p-6 !bg-gray-800">
                <Box className="!flex !justify-between !items-center !mb-6">
                    <Typography variant="h4" className="!text-white">
                        {trainerName} - Pokemon
                    </Typography>
                    <Box className="!flex !gap-2">
                        <Button
                            component={Link}
                            to={`/trainers/${id}`}
                            variant="contained"
                            className="!bg-sky-300 hover:!bg-sky-400"
                        >
                            Overview
                        </Button>
                        <Button
                            component={Link}
                            to={`/trainers/${id}/pokemon`}
                            variant="contained"
                            className="!bg-sky-300 hover:!bg-sky-400"
                        >
                            Pokemon
                        </Button>
                        <Button
                            component={Link}
                            to={`/trainers/${id}/ratings`}
                            variant="contained"
                            className="!bg-sky-300 hover:!bg-sky-400"
                        >
                            Past Ratings
                        </Button>
                        <Button
                            component={Link}
                            to={`/edit_trainer/${id}`}
                            variant="contained"
                            className="!bg-sky-300 hover:!bg-sky-400"
                        >
                            Edit
                        </Button>
                    </Box>
                </Box>

                <Box className="!flex !justify-center !mb-6">
                    <Button
                        component={Link}
                        to={`/trainers/${id}/add_pokemon`}
                        variant="contained"
                        className="!bg-sky-300 hover:!bg-sky-400"
                    >
                        Add Pokemon
                    </Button>
                </Box>

                <div className="!grid !grid-cols-1 sm:!grid-cols-2 md:!grid-cols-3 lg:!grid-cols-4 !gap-6">
                    {sortedPokemon.map((pokemon: Pokemon) => (
                        <div key={pokemon.id}>
                            <Link
                                to={`/trainers/${id}/pokemon/${pokemon.id}`}
                                className="!no-underline"
                            >
                                <Paper className="!p-4 !bg-gray-700 !hover:!bg-gray-600 !transition-colors">
                                    <Box className="!flex !flex-col !items-center">
                                        <img
                                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemon_id}.png`}
                                            alt={pokemonEntityData[pokemon.pokemon_id]?.name || 'Pokemon'}
                                            className="!w-32 !h-32 !object-contain"
                                        />
                                        <Typography variant="h6" className="!text-white !mt-2">
                                            {pokemon.nickname || pokemonEntityData[pokemon.pokemon_id]?.name}
                                        </Typography>
                                        <Typography variant="body2" className="!text-gray-400">
                                            Level: {pokemon.level}
                                            {pokemon.is_mega ? ' (Mega)' : pokemon.is_gigantamax ? ' (Gigantamax)' : ''}
                                        </Typography>
                                        <Box className="!flex !gap-2 !mt-2">
                                            {pokemonEntityData[pokemon.pokemon_id]?.types.map((type: string, index: number) => (
                                                <TypeBadge key={index} type={type.toLowerCase()} />
                                            ))}
                                        </Box>
                                        <Box className="!w-full !mt-4 !space-y-2">
                                            {renderStatBars(pokemon)}
                                        </Box>
                                    </Box>
                                </Paper>
                            </Link>
                        </div>
                    ))}
                </div>
            </Paper>
        </Box>
    );
};

export default TrainerPokemon; 