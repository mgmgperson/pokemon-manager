import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Paper, CircularProgress, Card, CardContent, Chip } from '@mui/material';
import axios from 'axios';
import { RecentPokemon as RecentPokemonType } from '../../types/history';

interface RecentPokemonProps {
    trainerId: string;
}

const fetchRecentPokemon = async (trainerId: string): Promise<RecentPokemonType[]> => {
    const { data } = await axios.get(`http://localhost:5000/history/pokemon/${trainerId}`);
    return data.data;
};

const RecentPokemon: React.FC<RecentPokemonProps> = ({ trainerId }) => {
    const { data: pokemon, isLoading, error } = useQuery({
        queryKey: ['history-pokemon', trainerId],
        queryFn: () => fetchRecentPokemon(trainerId),
    });

    if (isLoading) {
        return (
            <Box className="flex justify-center items-center p-8">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Paper className="p-6">
                <Typography color="error">Error loading Pokémon capture history.</Typography>
            </Paper>
        );
    }

    if (!pokemon || pokemon.length === 0) {
        return (
            <Paper className="p-6">
                <Typography className="text-gray-400 text-center">
                    No Pokémon capture history found.
                </Typography>
            </Paper>
        );
    }

    return (
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pokemon.map((poke) => (
                <Card key={poke.id} className="bg-gray-800 hover:bg-gray-700 transition-colors">
                    <CardContent>
                        <Box className="flex items-start justify-between">
                            <Box className="flex items-center gap-3">
                                <img
                                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${poke.pokemon_id}.png`}
                                    alt={poke.nickname || `Pokemon ${poke.pokemon_id}`}
                                    className="w-16 h-16"
                                />
                                <Box>
                                    <Typography variant="h6" className="text-white capitalize">
                                        {poke.nickname || `Pokemon #${poke.pokemon_id}`}
                                    </Typography>
                                    <Typography variant="body2" className="text-gray-400">
                                        Level {poke.level}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box className="flex flex-col gap-1 items-end">
                                {poke.gender && (
                                    <Chip
                                        label={poke.gender === 'male' ? '♂' : poke.gender === 'female' ? '♀' : '⚲'}
                                        size="small"
                                        className={`!text-white ${
                                            poke.gender === 'male'
                                                ? '!bg-blue-600'
                                                : poke.gender === 'female'
                                                ? '!bg-pink-600'
                                                : '!bg-gray-600'
                                        }`}
                                    />
                                )}
                            </Box>
                        </Box>

                        <Box className="mt-4 grid grid-cols-2 gap-2 text-sm">
                            <Box>
                                <Typography variant="caption" className="text-gray-500">
                                    Location
                                </Typography>
                                <Typography variant="body2" className="text-white">
                                    {poke.location_met_at}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" className="text-gray-500">
                                    Date Caught
                                </Typography>
                                <Typography variant="body2" className="text-white">
                                    {new Date(poke.date_met_at).toLocaleDateString()}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" className="text-gray-500">
                                    Level Met
                                </Typography>
                                <Typography variant="body2" className="text-white">
                                    Level {poke.level_met_at}
                                </Typography>
                            </Box>
                        </Box>

                        <Box className="mt-3 pt-3 border-t border-gray-700">
                            <Typography variant="caption" className="text-gray-500">
                                OT: {poke.ot_name} (ID: {poke.ot_id})
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            ))}
        </Box>
    );
};

export default RecentPokemon;
