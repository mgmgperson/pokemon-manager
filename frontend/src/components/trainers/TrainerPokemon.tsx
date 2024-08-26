import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Container, Row, Col, Card, Dropdown } from 'react-bootstrap';
import '../css/Trainers.scss'; 

const fetchTrainer = async (id: string) => {
    const { data } = await axios.get(`http://localhost:5000/trainers/${id}`);
    return data.data;
};

const fetchTrainerPokemon = async (id: string) => {
    const { data } = await axios.get(`http://localhost:5000/trainers/${id}/pokemon`);
    return data.data;
};

const fetchPokemonSpecies = async (speciesId: number) => {
    const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${speciesId}/`);
    return data;
};

const TrainerPokemon: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: trainerData, isLoading: isTrainerLoading } = useQuery({
        queryKey: ['trainer', id],
        queryFn: () => fetchTrainer(id!),
    });

    const { data: pokemonData, isLoading: isPokemonLoading } = useQuery({
        queryKey: ['trainerPokemon', id],
        queryFn: () => fetchTrainerPokemon(id!),
    });

    const [speciesNames, setSpeciesNames] = useState<Record<number, string>>({});

    useEffect(() => {
        if (pokemonData) {
            const fetchSpeciesNames = async () => {
                const names: Record<number, string> = {};
                for (const pokemon of pokemonData) {
                    const speciesData = await fetchPokemonSpecies(pokemon.species_id);
                    names[pokemon.species_id] = speciesData.name;
                }
                setSpeciesNames(names);
            };
            fetchSpeciesNames();
        }
    }, [pokemonData]);

    if (isTrainerLoading || isPokemonLoading) return <div>Loading...</div>;

    const trainer = trainerData.trainer;
    const trainerName = `${trainer.fname} ${trainer.lname}`;

    type StatKey = 'hp' | 'attack' | 'defense' | 'special_attack' | 'special_defense' | 'speed';
    
    const statNameMapping: { [key in StatKey]: string } = {
        hp: 'HP',
        attack: 'Attack',
        defense: 'Defense',
        special_attack: 'Sp. Atk',
        special_defense: 'Sp. Def',
        speed: 'Speed',
    };
    
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
            const percentage = (stats[stat] / 255) * 100;
            const hue = (stats[stat] / 255) * 180;
            const color = `hsl(${hue}, 100%, 50%)`;
    
            return (
                <div key={stat} className="stat-bar-container mb-2">
                    <span className="stat-bar-label">{statNameMapping[stat]}</span>
                    <div className="stat-bar" style={{ height: '10px', backgroundColor: '#ddd', borderRadius: '5px' }}>
                        <div
                            className="stat-bar-fill"
                            style={{
                                width: `${percentage}%`,
                                backgroundColor: color,
                                borderRadius: '5px',
                            }}
                        />
                    </div>
                </div>
            );
        });
    };

    pokemonData.sort((a: any, b: any) => b.level - a.level);

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-3">
                <Col>
                    <h1>{trainerName} - Pokemon</h1>
                </Col>
                <Col xs="auto">
                    <Dropdown>
                        <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                            Pokemon
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item as={Link} to={`/trainers/${id}`}>Overview</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/trainers/${id}/pokemon`}>Pokemon</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/trainers/${id}/ratings`}>Past Ratings</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}`}>Edit</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Col>
            </Row>

            <Row>
                {pokemonData.map((pokemon: any) => (
                    <Col md={3} className="mb-4" key={pokemon.id}>
                        <Link to={`/trainers/${id}/pokemon/${pokemon.id}`} className="pokemon-card-link">
                            <Card className="pokemon-card">
                                <Card.Img
                                    variant="top"
                                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemon_id}.png`}
                                    alt={speciesNames[pokemon.species_id]}
                                    style={{ width: '150px', margin: 'auto', paddingTop: '10px' }}
                                />
                                <Card.Body>
                                    <Card.Title>
                                        {pokemon.nickname || speciesNames[pokemon.species_id]}
                                    </Card.Title>
                                    <Card.Text>
                                        Level: {pokemon.level}
                                        {pokemon.is_mega ? ' (Mega)' : pokemon.is_gigantamax ? ' (Gigantamax)' : ''}
                                    </Card.Text>
                                    <div>{renderStatBars(pokemon)}</div>
                                </Card.Body>
                            </Card>
                        </Link>
                    </Col>
                ))}
            </Row>
        </Container>
    );
};

export default TrainerPokemon;
