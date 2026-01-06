import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Chip } from '@mui/material';
import { PokemonDetail } from '../../types/pokedex';

interface PokemonInfoProps {
    pokemon: PokemonDetail;
}

const PokemonInfo: React.FC<PokemonInfoProps> = ({ pokemon }) => {
    return (
        <Box className="p-4">
            <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Physical Characteristics */}
                <Box>
                    <Typography variant="h6" className="text-white mb-3 border-b border-gray-700 pb-2">
                        Physical
                    </Typography>
                    <Box className="flex flex-col gap-2">
                        <Box className="flex justify-between">
                            <Typography variant="body2" className="text-gray-400">
                                Height:
                            </Typography>
                            <Typography variant="body2" className="text-white">
                                {(pokemon.height / 10).toFixed(1)} m
                            </Typography>
                        </Box>
                        <Box className="flex justify-between">
                            <Typography variant="body2" className="text-gray-400">
                                Weight:
                            </Typography>
                            <Typography variant="body2" className="text-white">
                                {(pokemon.weight / 10).toFixed(1)} kg
                            </Typography>
                        </Box>
                        <Box className="flex justify-between">
                            <Typography variant="body2" className="text-gray-400">
                                Base Experience:
                            </Typography>
                            <Typography variant="body2" className="text-white">
                                {pokemon.base_experience}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Abilities */}
                <Box>
                    <Typography variant="h6" className="text-white mb-3 border-b border-gray-700 pb-2">
                        Abilities
                    </Typography>
                    <Box className="flex flex-wrap gap-1">
                        {pokemon.abilities.map((ability) => (
                            <Chip
                                key={ability}
                                label={ability}
                                size="small"
                                className="!bg-blue-700 !text-white capitalize"
                            />
                        ))}
                    </Box>
                </Box>

                {/* Breeding */}
                <Box>
                    <Typography variant="h6" className="text-white mb-3 border-b border-gray-700 pb-2">
                        Breeding
                    </Typography>
                    <Box className="flex flex-col gap-2">
                        <Box className="flex justify-between">
                            <Typography variant="body2" className="text-gray-400">
                                Egg Groups:
                            </Typography>
                            <Box className="flex gap-1">
                                {pokemon.species.egg_groups.map((group) => (
                                    <Chip
                                        key={group}
                                        label={group}
                                        size="small"
                                        className="!bg-green-700 !text-white !text-xs"
                                    />
                                ))}
                            </Box>
                        </Box>
                        <Box className="flex justify-between">
                            <Typography variant="body2" className="text-gray-400">
                                Gender Ratio:
                            </Typography>
                            <Typography variant="body2" className="text-white">
                                {pokemon.species.gender_ratio}
                            </Typography>
                        </Box>
                        {pokemon.species.hatch_counter !== null && (
                            <Box className="flex justify-between">
                                <Typography variant="body2" className="text-gray-400">
                                    Hatch Counter:
                                </Typography>
                                <Typography variant="body2" className="text-white">
                                    {pokemon.species.hatch_counter}
                                </Typography>
                            </Box>
                        )}
                        {pokemon.species.has_gender_differences && (
                            <Chip
                                label="Has Gender Differences"
                                size="small"
                                className="!bg-pink-600 !text-white !mt-1"
                            />
                        )}
                    </Box>
                </Box>

                {/* Training */}
                <Box>
                    <Typography variant="h6" className="text-white mb-3 border-b border-gray-700 pb-2">
                        Training
                    </Typography>
                    <Box className="flex flex-col gap-2">
                        {pokemon.species.base_happiness !== null && (
                            <Box className="flex justify-between">
                                <Typography variant="body2" className="text-gray-400">
                                    Base Happiness:
                                </Typography>
                                <Typography variant="body2" className="text-white">
                                    {pokemon.species.base_happiness}
                                </Typography>
                            </Box>
                        )}
                        <Box className="flex justify-between">
                            <Typography variant="body2" className="text-gray-400">
                                Capture Rate:
                            </Typography>
                            <Typography variant="body2" className="text-white">
                                {pokemon.species.capture_rate}
                            </Typography>
                        </Box>
                        <Box className="flex justify-between">
                            <Typography variant="body2" className="text-gray-400">
                                Growth Rate:
                            </Typography>
                            <Typography variant="body2" className="text-white capitalize">
                                {pokemon.species.growth_rate.replace(/_/g, ' ')}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Evolution */}
                <Box className="md:col-span-2">
                    <Typography variant="h6" className="text-white mb-3 border-b border-gray-700 pb-2">
                        Evolution
                    </Typography>
                    <Box className="flex flex-col gap-2">
                        {pokemon.species.evolves_from ? (
                            <Box className="flex items-center gap-2">
                                <Typography variant="body2" className="text-gray-400">
                                    Evolves from:
                                </Typography>
                                <Link
                                    to={`/pokedex/pokemon/${pokemon.species.evolves_from.id}`}
                                    className="text-sky-400 hover:text-sky-300 no-underline capitalize"
                                >
                                    {pokemon.species.evolves_from.name}
                                </Link>
                            </Box>
                        ) : (
                            <Typography variant="body2" className="text-gray-500 italic">
                                Does not evolve from another Pokémon
                            </Typography>
                        )}
                        {pokemon.species.forms_switchable && (
                            <Chip
                                label="Can Switch Forms"
                                size="small"
                                className="!bg-purple-700 !text-white !w-fit"
                            />
                        )}
                    </Box>
                </Box>

                {/* Varieties/Forms */}
                {pokemon.species.varieties.length > 1 && (
                    <Box className="md:col-span-2">
                        <Typography variant="h6" className="text-white mb-3 border-b border-gray-700 pb-2">
                            Varieties & Forms
                        </Typography>
                        <Box className="flex flex-wrap gap-2">
                            {pokemon.species.varieties.map((variety) => (
                                <Link
                                    key={variety.id}
                                    to={`/pokedex/pokemon/${variety.id}`}
                                    className="no-underline"
                                >
                                    <Chip
                                        label={variety.name}
                                        size="small"
                                        className={`capitalize ${
                                            variety.id === pokemon.id
                                                ? '!bg-sky-600 !text-white'
                                                : '!bg-gray-700 !text-white hover:!bg-gray-600'
                                        }`}
                                    />
                                </Link>
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default PokemonInfo;
