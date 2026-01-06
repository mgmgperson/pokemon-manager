import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Box, Typography, Paper, Tabs, Tab, Chip, CircularProgress } from '@mui/material';
import { PokemonDetail } from '../../types/pokedex';
import TypeBadge from '../TypeBadge';
import PokemonInfo from './PokemonInfo';
import PokemonStats from './PokemonStats';

const fetchPokemonDetail = async (pokemonId: string): Promise<PokemonDetail> => {
    const { data } = await axios.get(`http://localhost:5000/pokemon-entity/${pokemonId}`);
    return data.data;
};

const PokemonDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState(0);

    const { data: pokemon, isLoading, error } = useQuery({
        queryKey: ['pokemon-detail', id],
        queryFn: () => fetchPokemonDetail(id!),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <Box className="flex justify-center items-center h-full">
                <CircularProgress />
            </Box>
        );
    }

    if (error || !pokemon) {
        return (
            <Box className="flex justify-center items-center h-full">
                <Typography color="error">Error loading Pokémon data.</Typography>
            </Box>
        );
    }

    const pokemonImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;

    return (
        <Box className="p-6">
            <Paper className="p-6 bg-gray-800">
                <Box className="flex flex-wrap">
                    {/* Left Column - Image and Basic Info */}
                    <Box className="w-full md:w-1/3 pr-4">
                        <Box className="flex flex-col items-center">
                            <img
                                src={pokemonImageUrl}
                                alt={pokemon.name}
                                className="w-64 h-64 object-contain"
                            />
                            <Typography variant="caption" className="text-gray-500 font-mono mt-2">
                                #{pokemon.id.toString().padStart(4, '0')}
                            </Typography>
                            <Typography variant="h4" className="text-white mt-2 capitalize">
                                {pokemon.name}
                            </Typography>
                            <Box className="flex gap-1 mt-3">
                                {pokemon.types.map((type) => (
                                    <TypeBadge key={type} type={type} />
                                ))}
                            </Box>
                            <Typography variant="body1" className="text-gray-400 mt-3 text-center italic">
                                {pokemon.species.genera}
                            </Typography>
                            <Box className="mt-4 flex flex-col gap-1 w-full">
                                <Box className="flex justify-between">
                                    <Typography variant="body2" className="text-gray-500">
                                        Generation:
                                    </Typography>
                                    <Typography variant="body2" className="text-white">
                                        {pokemon.species.generation}
                                    </Typography>
                                </Box>
                                {pokemon.species.is_legendary && (
                                    <Chip
                                        label="Legendary"
                                        size="small"
                                        className="!bg-yellow-600 !text-white mt-2"
                                    />
                                )}
                                {pokemon.species.is_mythical && (
                                    <Chip
                                        label="Mythical"
                                        size="small"
                                        className="!bg-purple-600 !text-white mt-2"
                                    />
                                )}
                                {pokemon.species.is_baby && (
                                    <Chip
                                        label="Baby"
                                        size="small"
                                        className="!bg-pink-400 !text-white mt-2"
                                    />
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {/* Right Column - Tabs */}
                    <Box className="w-full md:w-2/3">
                        <Tabs
                            value={activeTab}
                            onChange={(_, newValue) => setActiveTab(newValue)}
                            className="border-b border-gray-700"
                            TabIndicatorProps={{
                                style: {
                                    backgroundColor: '#7DD3FC',
                                },
                            }}
                        >
                            <Tab label="Info" className="!text-white" />
                            <Tab label="Stats" className="!text-white" />
                        </Tabs>

                        <Box className="mt-4">
                            {activeTab === 0 && <PokemonInfo pokemon={pokemon} />}
                            {activeTab === 1 && <PokemonStats pokemon={pokemon} />}
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default PokemonDetailPage;
