import React, { useEffect, useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import '../css/Trainers.scss';
import { Pokemon, PokemonForm, Nature } from '../../types';

interface TrainerPokemonStatsProps {
    pokemon: Pokemon;
}

const fetchPokemonForm = async (pokemonId: number): Promise<PokemonForm> => {
    const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    return data;
};

const fetchPokemonNature = async (natureId: number): Promise<Nature> => {
    const { data } = await axios.get(`https://pokeapi.co/api/v2/nature/${natureId}`);
    return data;
};

const TrainerPokemonStats: React.FC<TrainerPokemonStatsProps> = ({ pokemon }) => {
    const [natureName, setNatureName] = useState<string | null>(null);

    const { data: formData, isLoading: isFormLoading } = useQuery<PokemonForm>({
        queryKey: ['pokemonForm', pokemon.pokemon_id],
        queryFn: () => fetchPokemonForm(pokemon.pokemon_id),
    });

    const { data: natureData, isLoading: isNatureLoading } = useQuery<Nature | null>({
        queryKey: ['pokemonNature', pokemon.nature_id],
        queryFn: () => (pokemon.nature_id ? fetchPokemonNature(pokemon.nature_id) : Promise.resolve(null)),
        enabled: !!pokemon.nature_id,
    });

    useEffect(() => {
        if (natureData) {
            setNatureName(natureData.name);
        }
    }, [natureData]);

    if (isFormLoading || isNatureLoading) {
        return <div>Loading...</div>;
    }

    const statNameMapping: { [key: string]: string } = {
        hp: 'HP',
        attack: 'Attack',
        defense: 'Defense',
        'special-attack': 'Sp. Atk',
        'special-defense': 'Sp. Def',
        speed: 'Speed',
    };

    const getStatValue = (statName: string, prefix: '' | 'ev_' | 'iv_'): number => {
        const key = `${prefix}${statName.replace('-', '_')}` as keyof Pokemon;
        const value = pokemon[key];
        return typeof value === 'number' ? value : 0;
    };

    const renderStatBars = () => {
        return formData?.stats.map((stat) => {
            const baseStat = stat.base_stat;
            const statName = stat.stat.name;
            const actualStat = getStatValue(statName, '');
            const ev = getStatValue(statName, 'ev_');
            const iv = getStatValue(statName, 'iv_');

            const percentage = (actualStat / 255) * 100;
            const hue = (actualStat / 255) * 180;
            const color = `hsl(${hue}, 100%, 50%)`;

            return (
                <div key={statName} className="trainer-stat-bar-container mb-3">
                    <Row className="align-items-center">
                        <Col xs={2}>
                            <span className="stat-bar-label">{statNameMapping[statName] || statName}</span>
                        </Col>
                        <Col xs={1}>
                            <span>{baseStat}</span>
                        </Col>
                        <Col xs={4}>
                            <div className="stat-bar" style={{ position: 'relative', height: '12px', backgroundColor: '#ddd', borderRadius: '5px' }}>
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
                        </Col>
                        <Col xs={1}>
                            <span>{ev}</span>
                        </Col>
                        <Col xs={1}>
                            <span>{iv}</span>
                        </Col>
                        <Col xs={2}>
                            <span>{actualStat}</span>
                        </Col>
                    </Row>
                </div>
            );
        });
    };

    return (
        <div className="pokemon-stats">
            <Row className="mb-3">
                <Col>
                    <h3>Stats</h3>
                </Col>
            </Row>
            <Row className="stat-bar-header mb-2 text-left">
                <Col md={12}>
                    <Row className="align-items-center">
                        <Col xs={2}>
                        </Col>
                        <Col xs={1}>
                            <span>Base</span>
                        </Col>
                        <Col xs={4}>
                        </Col>
                        <Col xs={1}>
                            <span>EV</span>
                        </Col>
                        <Col xs={1}>
                            <span>IV</span>
                        </Col>
                        <Col xs={2}>
                            <span>Overall</span>
                        </Col>
                    </Row>
                </Col>
            </Row>
            <Row>
                <Col md={12}>
                    {renderStatBars()}
                </Col>
            </Row>
        </div>
    );
};

export default TrainerPokemonStats;
