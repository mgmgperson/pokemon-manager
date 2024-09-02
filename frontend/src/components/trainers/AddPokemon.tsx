import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';

const AddPokemon: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [formState, setFormState] = useState({
        trainer_id: '',
        species_id: '',
        pokemon_id: '',
        level: '',
        ot_name: '',
        ot_id: '',
        nickname: '',
        attack: '',
        defense: '',
        special_attack: '',
        special_defense: '',
        speed: '',
        hp: '',
        happiness: '',
        iv_hp: '',
        iv_attack: '',
        iv_defense: '',
        iv_special_attack: '',
        iv_special_defense: '',
        iv_speed: '',
        ev_hp: '',
        ev_attack: '',
        ev_defense: '',
        ev_special_attack: '',
        ev_special_defense: '',
        ev_speed: '',
        nature_id: '',
        ability_id: '',
        gender: '',
        shiny: false,
        pokeball_id: '',
        held_item_id: '',
        experience_points: '',
        is_gigantamax: false,
        is_mega: false,
        date_met_at: '',
        location_met_at: '',
        level_met_at: '',
        current_hp: '',
        current_strength: '',
        status_id: '',
        battles_won: '',
        battles_lost: '',
        kills: '',
        deaths: '',
        training_efficiency: '',
    });

    const handleSave = async () => {
        try {
            await axios.post('http://localhost:5000/pokemon', formState);
            navigate(`/trainers/${id}/pokemon`);
        } catch (error) {
            alert('Error adding Pokémon');
            console.error(error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormState((prev) => ({ ...prev, [name]: checked }));
    };

    useEffect(() => {
        if (id) {
            setFormState((prev) => ({ ...prev, trainer_id: id }));
        }
    }, [id]);

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-3">
                <Col>
                    <h1>Add Pokémon</h1>
                </Col>
            </Row>
            <Form>
                {/* Basic Information */}
                <Row>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Species ID</Form.Label>
                            <Form.Control
                                type="number"
                                name="species_id"
                                value={formState.species_id}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Pokémon ID</Form.Label>
                            <Form.Control
                                type="number"
                                name="pokemon_id"
                                value={formState.pokemon_id}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Level</Form.Label>
                            <Form.Control
                                type="number"
                                name="level"
                                value={formState.level}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                {/* OT Information */}
                <Row>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>OT Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="ot_name"
                                value={formState.ot_name}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>OT ID</Form.Label>
                            <Form.Control
                                type="number"
                                name="ot_id"
                                value={formState.ot_id}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Nickname</Form.Label>
                            <Form.Control
                                type="text"
                                name="nickname"
                                value={formState.nickname}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                {/* Battle Stats */}
                <Row>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Attack</Form.Label>
                            <Form.Control
                                type="number"
                                name="attack"
                                value={formState.attack}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Defense</Form.Label>
                            <Form.Control
                                type="number"
                                name="defense"
                                value={formState.defense}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Special Attack</Form.Label>
                            <Form.Control
                                type="number"
                                name="special_attack"
                                value={formState.special_attack}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Special Defense</Form.Label>
                            <Form.Control
                                type="number"
                                name="special_defense"
                                value={formState.special_defense}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Speed</Form.Label>
                            <Form.Control
                                type="number"
                                name="speed"
                                value={formState.speed}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>HP</Form.Label>
                            <Form.Control
                                type="number"
                                name="hp"
                                value={formState.hp}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>
                
                {/* EVs/IVs */}
                <Row>
                    <Col md={6}>
                        <h5>IVs</h5>
                        <Form.Group className="mb-3">
                            <Form.Label>HP IV</Form.Label>
                            <Form.Control
                                type="number"
                                name="iv_hp"
                                value={formState.iv_hp}
                                onChange={handleChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Attack IV</Form.Label>
                            <Form.Control
                                type="number"
                                name="iv_attack"
                                value={formState.iv_attack}
                                onChange={handleChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Defense IV</Form.Label>
                            <Form.Control
                                type="number"
                                name="iv_defense"
                                value={formState.iv_defense}
                                onChange={handleChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Special Attack IV</Form.Label>
                            <Form.Control
                                type="number"
                                name="iv_special_attack"
                                value={formState.iv_special_attack}
                                onChange={handleChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Special Defense IV</Form.Label>
                            <Form.Control
                                type="number"
                                name="iv_special_defense"
                                value={formState.iv_special_defense}
                                onChange={handleChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Speed IV</Form.Label>
                            <Form.Control
                                type="number"
                                name="iv_speed"
                                value={formState.iv_speed}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <h5>EVs</h5>
                        <Form.Group className="mb-3">
                            <Form.Label>HP EV</Form.Label>
                            <Form.Control
                                type="number"
                                name="ev_hp"
                                value={formState.ev_hp}
                                onChange={handleChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Attack EV</Form.Label>
                            <Form.Control
                                type="number"
                                name="ev_attack"
                                value={formState.ev_attack}
                                onChange={handleChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Defense EV</Form.Label>
                            <Form.Control
                                type="number"
                                name="ev_defense"
                                value={formState.ev_defense}
                                onChange={handleChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Special Attack EV</Form.Label>
                            <Form.Control
                                type="number"
                                name="ev_special_attack"
                                value={formState.ev_special_attack}
                                onChange={handleChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Special Defense EV</Form.Label>
                            <Form.Control
                                type="number"
                                name="ev_special_defense"
                                value={formState.ev_special_defense}
                                onChange={handleChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Speed EV</Form.Label>
                            <Form.Control
                                type="number"
                                name="ev_speed"
                                value={formState.ev_speed}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>
                
                {/* Nature, Ability, and Flavor */}
                <Row>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Nature ID</Form.Label>
                            <Form.Control
                                type="number"
                                name="nature_id"
                                value={formState.nature_id}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Ability ID</Form.Label>
                            <Form.Control
                                type="number"
                                name="ability_id"
                                value={formState.ability_id}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Gender</Form.Label>
                            <Form.Control
                                type="text"
                                name="gender"
                                value={formState.gender}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Row>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Shiny"
                                name="shiny"
                                checked={formState.shiny}
                                onChange={handleCheckboxChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Gigantamax"
                                name="is_gigantamax"
                                checked={formState.is_gigantamax}
                                onChange={handleCheckboxChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Mega"
                                name="is_mega"
                                checked={formState.is_mega}
                                onChange={handleCheckboxChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                {/* Met Information */}
                <Row>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Date Met At</Form.Label>
                            <Form.Control
                                type="text"
                                name="date_met_at"
                                value={formState.date_met_at}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Location Met At</Form.Label>
                            <Form.Control
                                type="text"
                                name="location_met_at"
                                value={formState.location_met_at}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Level Met At</Form.Label>
                            <Form.Control
                                type="number"
                                name="level_met_at"
                                value={formState.level_met_at}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                {/* Stats */}
                <Row>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Current HP</Form.Label>
                            <Form.Control
                                type="number"
                                name="current_hp"
                                value={formState.current_hp}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Current Strength</Form.Label>
                            <Form.Control
                                type="number"
                                name="current_strength"
                                value={formState.current_strength}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Status ID</Form.Label>
                            <Form.Control
                                type="number"
                                name="status_id"
                                value={formState.status_id}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                {/* Battle Stats */}
                <Row>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Battles Won</Form.Label>
                            <Form.Control
                                type="number"
                                name="battles_won"
                                value={formState.battles_won}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Battles Lost</Form.Label>
                            <Form.Control
                                type="number"
                                name="battles_lost"
                                value={formState.battles_lost}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Kills</Form.Label>
                            <Form.Control
                                type="number"
                                name="kills"
                                value={formState.kills}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Deaths</Form.Label>
                            <Form.Control
                                type="number"
                                name="deaths"
                                value={formState.deaths}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                {/* Training */}
                <Row>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Training Efficiency</Form.Label>
                            <Form.Control
                                type="number"
                                name="training_efficiency"
                                value={formState.training_efficiency}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Button variant="primary" onClick={handleSave}>
                    Save
                </Button>
            </Form>
        </Container>
    );
};

export default AddPokemon;