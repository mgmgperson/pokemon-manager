import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Pokemon, PokemonSpecies } from '../../../types/pokemon';

interface TrainerPokemonStatsProps {
    pokemon: Pokemon;
}

const fetchPokemonSpecies = async (speciesId: number): Promise<PokemonSpecies> => {
    const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${speciesId}`);
    return data;
};

const TrainerPokemonStats: React.FC<TrainerPokemonStatsProps> = ({ pokemon }) => {
    const { data: species, isLoading } = useQuery({
        queryKey: ['pokemonSpecies', pokemon.species_id],
        queryFn: () => fetchPokemonSpecies(pokemon.species_id),
    });

    if (isLoading || !species) {
        return (
            <Box className="!flex !justify-center !items-center !h-full">
                <Typography variant="h6" className="!text-white">
                    Loading...
                </Typography>
            </Box>
        );
    }

    const stats = [
        { name: 'HP', value: pokemon.hp, iv: pokemon.iv_hp, ev: pokemon.ev_hp },
        { name: 'Attack', value: pokemon.attack, iv: pokemon.iv_attack, ev: pokemon.ev_attack },
        { name: 'Defense', value: pokemon.defense, iv: pokemon.iv_defense, ev: pokemon.ev_defense },
        { name: 'Sp. Atk', value: pokemon.special_attack, iv: pokemon.iv_special_attack, ev: pokemon.ev_special_attack },
        { name: 'Sp. Def', value: pokemon.special_defense, iv: pokemon.iv_special_defense, ev: pokemon.ev_special_defense },
        { name: 'Speed', value: pokemon.speed, iv: pokemon.iv_speed, ev: pokemon.ev_speed },
    ];

    return (
        <Box className="!p-4">
            <Typography variant="h6" className="!mb-4">Stats</Typography>
            {stats.map((stat) => (
                <Box key={stat.name} className="!mb-4">
                    <Box className="!flex !justify-between !mb-1">
                        <Typography variant="body2" className="!text-gray-400">
                            {stat.name}
                        </Typography>
                        <Typography variant="body2" className="!text-gray-400">
                            {stat.value}
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={(stat.value / 500) * 100}
                        className="!h-2 !rounded-full !bg-gray-700"
                        sx={{
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: `hsl(${(stat.value / 500) * 180}, 100%, 50%)`,
                            },
                        }}
                    />
                    <Box className="!flex !justify-between !mt-1">
                        <Typography variant="caption" className="!text-gray-500">
                            IV: {stat.iv}
                        </Typography>
                        <Typography variant="caption" className="!text-gray-500">
                            EV: {stat.ev}
                        </Typography>
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

export default TrainerPokemonStats; 