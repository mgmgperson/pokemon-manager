import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { PokemonDetail } from '../../types/pokedex';

interface PokemonStatsProps {
    pokemon: PokemonDetail;
}

const PokemonStats: React.FC<PokemonStatsProps> = ({ pokemon }) => {
    const stats = [
        { name: 'HP', value: pokemon.base_stats.hp },
        { name: 'Attack', value: pokemon.base_stats.attack },
        { name: 'Defense', value: pokemon.base_stats.defense },
        { name: 'Sp. Attack', value: pokemon.base_stats.special_attack },
        { name: 'Sp. Defense', value: pokemon.base_stats.special_defense },
        { name: 'Speed', value: pokemon.base_stats.speed },
    ];

    const totalStats = stats.reduce((acc, stat) => acc + stat.value, 0);
    const maxStatValue = 255; // Maximum individual stat value in Pokemon

    return (
        <Box className="p-4">
            <Typography variant="h6" className="text-white mb-4">Base Stats</Typography>
            {stats.map((stat) => (
                <Box key={stat.name} className="mb-4">
                    <Box className="flex justify-between mb-1">
                        <Typography variant="body2" className="text-gray-400 min-w-[100px]">
                            {stat.name}
                        </Typography>
                        <Typography variant="body2" className="text-white font-bold min-w-[40px] text-right">
                            {stat.value}
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={(stat.value / maxStatValue) * 100}
                        className="h-2 rounded-full bg-gray-700"
                        sx={{
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: `hsl(${(stat.value / maxStatValue) * 120}, 100%, 50%)`,
                            },
                        }}
                    />
                </Box>
            ))}
            
            <Box className="mt-6 pt-4 border-t border-gray-700">
                <Box className="flex justify-between">
                    <Typography variant="body1" className="text-gray-300 font-bold">
                        Total
                    </Typography>
                    <Typography variant="body1" className="text-white font-bold">
                        {totalStats}
                    </Typography>
                </Box>
                <Typography variant="caption" className="text-gray-500 mt-1 block">
                    Base Stat Total (BST)
                </Typography>
            </Box>
        </Box>
    );
};

export default PokemonStats;
