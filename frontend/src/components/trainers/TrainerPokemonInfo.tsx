import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Row, Col } from 'react-bootstrap';
import TypeBadge from './TypeBadge';
import '../css/Trainers.scss';
import { Pokemon, PokemonSpecies, Type, Nature } from '../../types';

interface TrainerPokemonInfoProps {
    pokemon: Pokemon;
}

const fetchPokemonSpecies = async (speciesId: number): Promise<PokemonSpecies> => {
    const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${speciesId}`);
    return data;
};

const fetchPokemonTypes = async (pokemonId: number): Promise<Type[]> => {
    const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    return data.types;
};

const fetchPokemonNature = async (natureId: number): Promise<Nature> => {
    const { data } = await axios.get(`https://pokeapi.co/api/v2/nature/${natureId}`);
    return data;
};

const TrainerPokemonInfo: React.FC<TrainerPokemonInfoProps> = ({ pokemon }) => {
    const [speciesName, setSpeciesName] = useState<string>('');
    const [types, setTypes] = useState<Type[]>([]);
    const [natureName, setNatureName] = useState<string | null>(null);

    const { data: speciesData, isLoading: isSpeciesLoading } = useQuery<PokemonSpecies>({
        queryKey: ['pokemonSpecies', pokemon.species_id],
        queryFn: () => fetchPokemonSpecies(pokemon.species_id),
    });

    const { data: typesData, isLoading: isTypesLoading } = useQuery<Type[]>({
        queryKey: ['pokemonTypes', pokemon.pokemon_id],
        queryFn: () => fetchPokemonTypes(pokemon.pokemon_id),
    });

    const { data: natureData, isLoading: isNatureLoading } = useQuery<Nature | null>({
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
        if (typesData) {
            setTypes(typesData);
        }
    }, [typesData]);

    useEffect(() => {
        if (natureData) {
            setNatureName(natureData ? natureData.name : 'Unknown');
        }
    }, [natureData]);

    if (isSpeciesLoading || isTypesLoading || isNatureLoading) {
        return <div>Loading...</div>;
    }

    return (
        <Row>
            <Col md={6}>
                <div className="pokemon-info">
                    <div className="pokemon-details">
                        <p><strong>Dex No.:</strong> {pokemon.species_id}</p>
                        <p><strong>Species:</strong> {speciesName.charAt(0).toUpperCase() + speciesName.slice(1)}</p>
                    </div>
                    
                    <div className="type-buttons">
                        {types.map((type, idx) => (
                            <TypeBadge key={idx} type={type.type.name} />
                        ))}
                    </div>
                    
                    <div className="pokemon-details">
                        <p><strong>OT:</strong> {pokemon.ot_name || 'Unknown'}</p>
                        <p><strong>ID No.:</strong> {pokemon.id}</p>
                        <p><strong>Exp. Points:</strong> {pokemon.experience_points || 'Unknown'}</p>
                    </div>
                </div>
            </Col>

            <Col md={6}>
                <div className="pokemon-details">
                    <p><strong>Nature:</strong> {natureName}</p>
                    <p><strong>Date Met At:</strong> {pokemon.date_met_at}</p>
                    <p><strong>Location Met At:</strong> {pokemon.location_met_at}</p>
                    <p><strong>Level Met At:</strong> {pokemon.level_met_at}</p>
                    <p><strong>Happiness:</strong> {pokemon.happiness}</p>
                </div>
            </Col>
        </Row>
    );
};

export default TrainerPokemonInfo;