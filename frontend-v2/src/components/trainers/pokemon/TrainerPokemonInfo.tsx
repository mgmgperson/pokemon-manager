import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import TypeBadge from '../../TypeBadge';
import { Pokemon, PokemonEntity, PokemonSpeciesData, NatureData } from '../../../types/pokemon';

interface TrainerPokemonInfoProps {
    pokemon: Pokemon;
}

const fetchPokemonEntity = async (pokemonId: number): Promise<PokemonEntity> => {
    const { data } = await axios.get(`http://localhost:5000/pokemon-entity/${pokemonId}`);
    return data.data;
};

const fetchPokemonSpecies = async (speciesId: number): Promise<PokemonSpeciesData> => {
    const { data } = await axios.get(`http://localhost:5000/pokemon-species/${speciesId}`);
    return data.data;
};

const fetchPokemonNature = async (natureId: number): Promise<NatureData> => {
    const { data } = await axios.get(`http://localhost:5000/natures/${natureId}`);
    return data.data;
};

const TrainerPokemonInfo: React.FC<TrainerPokemonInfoProps> = ({ pokemon }) => {
    const [speciesName, setSpeciesName] = useState<string>('');
    const [types, setTypes] = useState<string[]>([]);
    const [natureName, setNatureName] = useState<string | null>(null);

    const { data: pokemonEntityData, isLoading: isPokemonEntityLoading } = useQuery<PokemonEntity>({
        queryKey: ['pokemonEntity', pokemon.pokemon_id],
        queryFn: () => fetchPokemonEntity(pokemon.pokemon_id),
    });

    const { data: speciesData, isLoading: isSpeciesLoading } = useQuery<PokemonSpeciesData>({
        queryKey: ['pokemonSpecies', pokemon.species_id],
        queryFn: () => fetchPokemonSpecies(pokemon.species_id),
    });

    const { data: natureData, isLoading: isNatureLoading } = useQuery<NatureData | null>({
        queryKey: ['pokemonNature', pokemon.nature_id],
        queryFn: () => (pokemon.nature_id ? fetchPokemonNature(pokemon.nature_id) : Promise.resolve(null)),
        enabled: !!pokemon.nature_id,
    });

    useEffect(() => {
        if (speciesData) {
            setSpeciesName(speciesData.name);
        }
    }, [speciesData]);

    useEffect(() => {
        if (pokemonEntityData) {
            setTypes(pokemonEntityData.types);
        }
    }, [pokemonEntityData]);

    useEffect(() => {
        if (natureData) {
            setNatureName(natureData.name);
        }
    }, [natureData]);

    if (isSpeciesLoading || isPokemonEntityLoading || isNatureLoading) {
        return (
            <Box className="!flex !justify-center !items-center !h-full">
                <Typography variant="h6" className="!text-white">
                    Loading...
                </Typography>
            </Box>
        );
    }

    return (
        <Box className="!flex !flex-wrap">
            <Box className="!w-full md:!w-1/2 !pr-4">
                <Box className="!bg-gray-700 !p-4 !rounded-lg">
                    <Typography variant="h6" className="!text-white !mb-4">
                        Basic Information
                    </Typography>
                    <Box className="!space-y-2">
                        <Typography variant="body1" className="!text-gray-400">
                            <span className="!text-white">Dex No:</span> {pokemon.species_id}
                        </Typography>
                        <Typography variant="body1" className="!text-gray-400">
                            <span className="!text-white">Species:</span>{' '}
                            <Link
                                to={`/pokemon/${pokemon.species_id}`}
                                className="!text-sky-400 hover:!text-sky-300 !no-underline"
                            >
                                {speciesName.charAt(0).toUpperCase() + speciesName.slice(1)}
                            </Link>
                        </Typography>
                        <Box className="!flex !gap-2 !mt-2">
                            {types.map((type: string, idx: number) => (
                                <TypeBadge key={idx} type={type.toLowerCase()} />
                            ))}
                        </Box>
                    </Box>
                </Box>

                <Box className="!bg-gray-700 !p-4 !rounded-lg !mt-4">
                    <Typography variant="h6" className="!text-white !mb-4">
                        Trainer Information
                    </Typography>
                    <Box className="!space-y-2">
                        <Typography variant="body1" className="!text-gray-400">
                            <span className="!text-white">OT:</span> {pokemon.ot_name || 'Unknown'}
                        </Typography>
                        <Typography variant="body1" className="!text-gray-400">
                            <span className="!text-white">ID No:</span> {pokemon.id}
                        </Typography>
                        <Typography variant="body1" className="!text-gray-400">
                            <span className="!text-white">Exp. Points:</span> {pokemon.experience_points || 'Unknown'}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box className="!w-full md:!w-1/2">
                <Box className="!bg-gray-700 !p-4 !rounded-lg">
                    <Typography variant="h6" className="!text-white !mb-4">
                        Additional Information
                    </Typography>
                    <Box className="!space-y-2">
                        <Typography variant="body1" className="!text-gray-400">
                            <span className="!text-white">Nature:</span> {natureName || 'Unknown'}
                        </Typography>
                        <Typography variant="body1" className="!text-gray-400">
                            <span className="!text-white">Date Met At:</span> {pokemon.date_met_at || 'Unknown'}
                        </Typography>
                        <Typography variant="body1" className="!text-gray-400">
                            <span className="!text-white">Location Met At:</span> {pokemon.location_met_at || 'Unknown'}
                        </Typography>
                        <Typography variant="body1" className="!text-gray-400">
                            <span className="!text-white">Level Met At:</span> {pokemon.level_met_at || 'Unknown'}
                        </Typography>
                        <Typography variant="body1" className="!text-gray-400">
                            <span className="!text-white">Happiness:</span> {pokemon.happiness || 'Unknown'}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default TrainerPokemonInfo; 