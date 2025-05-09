import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Box, Typography, Paper, Button, Tabs, Tab } from '@mui/material';
import TrainerPokemonInfo from './TrainerPokemonInfo.tsx';
import TrainerPokemonStats from './TrainerPokemonStats.tsx';

const GenderIcon: React.FC<{ gender: string | null }> = ({ gender }) => {
    if (gender === 'male') return <span>♂</span>;
    if (gender === 'female') return <span>♀</span>;
    return <span>⚲</span>; // Genderless
};

const fetchPokemonDetails = async (trainerId: string, pokemonId: string) => {
    const { data } = await axios.get(`http://localhost:5000/pokemon/${pokemonId}`);
    return data.data;
};

const TrainerPokemonDetail: React.FC = () => {
    const { id, pokemonId } = useParams<{ id: string; pokemonId: string }>();
    const [activeTab, setActiveTab] = React.useState(0);

    const { data: pokemonData, isLoading } = useQuery({
        queryKey: ['pokemonDetails', id, pokemonId],
        queryFn: () => fetchPokemonDetails(id!, pokemonId!),
        enabled: !!id && !!pokemonId,
    });

    if (isLoading) {
        return (
            <Box className="!flex !justify-center !items-center !h-full">
                <Typography variant="h6" className="!text-white">
                    Loading...
                </Typography>
            </Box>
        );
    }

    if (!pokemonData) {
        return (
            <Box className="!flex !justify-center !items-center !h-full">
                <Typography variant="h6" className="!text-white">
                    No Data Found
                </Typography>
            </Box>
        );
    }

    const trainerName = `${pokemonData.trainer_fname} ${pokemonData.trainer_lname}`;
    const pokemonName = pokemonData.nickname || `Pokémon #${pokemonData.pokemon_id}`;
    const pokemonImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonData.pokemon_id}.png`;

    return (
        <Box className="!p-6">
            <Paper className="!p-6 !bg-gray-800">
                <Box className="!flex !justify-between !items-center !mb-6">
                    <Typography variant="h4" className="!text-white">
                        {pokemonName}
                    </Typography>
                    <Box className="!flex !gap-2">
                        <Button
                            component={Link}
                            to={`/trainers/${pokemonData.trainer_id}/pokemon/${pokemonId}`}
                            variant="contained"
                            className="!bg-sky-300 hover:!bg-sky-400"
                        >
                            Overview
                        </Button>
                        <Button
                            component={Link}
                            to={`/trainers/${pokemonData.trainer_id}/edit_pokemon/${pokemonId}`}
                            variant="contained"
                            className="!bg-sky-300 hover:!bg-sky-400"
                        >
                            Edit
                        </Button>
                    </Box>
                </Box>

                <Box className="!flex !flex-wrap">
                    <Box className="!w-full md:!w-1/3 !pr-4">
                        <Box className="!flex !flex-col !items-center">
                            <img
                                src={pokemonImageUrl}
                                alt={pokemonName}
                                className="!w-64 !h-64 !object-contain"
                            />
                            <Typography variant="h6" className="!text-white !mt-4">
                                {pokemonName} <GenderIcon gender={pokemonData.gender} />
                            </Typography>
                            <Typography variant="body1" className="!text-gray-400">
                                Level: {pokemonData.level}
                            </Typography>
                            <Typography variant="body1" className="!text-gray-400">
                                Trainer: <Link to={`/trainers/${pokemonData.trainer_id}`} className="!text-sky-400 hover:!text-sky-300 !no-underline">
                                    {trainerName}
                                </Link>
                            </Typography>
                        </Box>
                    </Box>

                    <Box className="!w-full md:!w-2/3">
                        <Tabs
                            value={activeTab}
                            onChange={(_, newValue) => setActiveTab(newValue)}
                            className="!border-b !border-gray-700"
                            TabIndicatorProps={{
                                style: {
                                    backgroundColor: '#7DD3FC', // sky-300
                                },
                            }}
                        >
                            <Tab label="Info" className="!text-white" />
                            <Tab label="Stats" className="!text-white" />
                            <Tab label="Battle" className="!text-white" />
                            <Tab label="Moves" className="!text-white" />
                        </Tabs>

                        <Box className="!mt-4">
                            {activeTab === 0 && <TrainerPokemonInfo pokemon={pokemonData} />}
                            {activeTab === 1 && <TrainerPokemonStats pokemon={pokemonData} />}
                            {activeTab === 2 && (
                                <Typography variant="body1" className="!text-white">
                                    Battle Stats content will go here
                                </Typography>
                            )}
                            {activeTab === 3 && (
                                <Typography variant="body1" className="!text-white">
                                    Moves content will go here
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default TrainerPokemonDetail; 