import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Container, Row, Col, Tabs, Tab } from 'react-bootstrap';
import TrainerPokemonInfo from './TrainerPokemonInfo';
import TrainerPokemonStats from './TrainerPokemonStats';

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

    const { data: pokemonData, isLoading } = useQuery({
        queryKey: ['pokemonDetails', id, pokemonId],
        queryFn: () => fetchPokemonDetails(id!, pokemonId!),
        enabled: !!id && !!pokemonId,
    });

    if (isLoading) return <div>Loading...</div>;
    if (!pokemonData) return <div>No Data Found</div>;

    const trainerName = `${pokemonData.trainer_fname} ${pokemonData.trainer_lname}`;
    const pokemonName = pokemonData.nickname || `Pokémon #${pokemonData.pokemon_id}`;
    const pokemonImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonData.pokemon_id}.png`;

    return (
        <Container className="mt-4">
            <Row>
                <Col md={4} className="d-flex flex-column align-items-center">
                    

                    {/* Nickname and Gender */}
                    <Row className="mb-2">
                        {/* Placeholder for Pokéball image */}
                        <div
                            style={{
                                width: '30px',
                                height: '30px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '50%',
                                marginBottom: '10px',
                            }}
                        />
                        <Col>
                            <h4>
                                {pokemonName} <GenderIcon gender={pokemonData.gender} />
                            </h4>
                        </Col>
                    </Row>

                    {/* Trainer Name */}
                    <Row className="mb-2">
                        <Col>
                            Trainer: <Link to={`/trainers/${pokemonData.trainer_id}`} style={{ textDecoration: 'none' }}>{trainerName}</Link>
                        </Col>
                    </Row>

                    {/* Level */}
                    <Row className="mb-3">
                        <Col>Level: {pokemonData.level}</Col>
                    </Row>

                    {/* Pokémon Image */}
                    <img
                        src={pokemonImageUrl}
                        alt={pokemonName}
                        style={{ width: '100%', maxWidth: '300px', marginBottom: '20px' }}
                    />
                </Col>

                {/* Right Column - 2/3 */}
                <Col md={8}>
                    <Tabs defaultActiveKey="info" className="mb-3">
                        <Tab eventKey="info" title="Info">
                            <TrainerPokemonInfo pokemon={pokemonData} />
                        </Tab>
                        <Tab eventKey="stats" title="Stats">
                            <TrainerPokemonStats pokemon={pokemonData} />
                        </Tab>
                        <Tab eventKey="battle" title="Battle">
                            <div>Battle Stats content will go here</div>
                        </Tab>
                        <Tab eventKey="moves" title="Moves">
                            <div>Moves content will go here</div>
                        </Tab>
                    </Tabs>
                </Col>
            </Row>
        </Container>
    );
};

export default TrainerPokemonDetail;
