import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Dropdown } from 'react-bootstrap';

// Define the order of mental rating fields as per the SQL schema
const orderedMentalRatingFields: string[] = [
    'planning_rating',
    'risk_rating',
    'prediction_rating',
    'clutch_rating',
    'consistency_rating',
    'motivation_rating',
    'pokemon_knowledge_rating',
    'trainer_knowledge_rating',
    'training_rating',
    'conditioning_rating',
    'determination_rating',
    'facilities_rating',
    'attack_rating',
    'defense_rating',
    'speed_rating',
    'gimmick_rating',
];

// Fetch trainer data from the Node.js server
const fetchTrainer = async (id: string) => {
    const { data } = await axios.get(`http://localhost:5000/trainers/${id}`);
    return data.data;
};

// Fetch mental ratings from the Node.js server
const fetchMentalRatings = async (id: string) => {
    const { data } = await axios.get(`http://localhost:5000/trainers/${id}`);
    return data.data.mental_rating;
};

// Update mental ratings in the Node.js server
const updateMentalRating = async ({ id, updatedMentalRatings }: { id: string; updatedMentalRatings: any }) => {
    console.log('Updated Mental Ratings:', updatedMentalRatings);
    const { data } = await axios.put(`http://localhost:5000/trainers/${id}/mental_ratings`, updatedMentalRatings);
    return data;
};

// Generate mental ratings from the C++ backend
const generateMentalRatings = async (id: number) => {
    const { data } = await axios.get(`http://localhost:18080/generate-mental-ratings/${id}`);
    return data; // Expecting the API to return the generated mental ratings
};

const MentalRatingEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Fetch trainer data
    const { data: trainerData, isLoading: isTrainerLoading, error: trainerError } = useQuery({
        queryKey: ['trainer', id],
        queryFn: () => fetchTrainer(id!),
    });

    // Fetch existing mental ratings
    const { data: mentalRatings, isLoading: isMentalLoading, error: mentalError } = useQuery({
        queryKey: ['mental_ratings', id],
        queryFn: () => fetchMentalRatings(id!),
    });

    const [updatedRatings, setUpdatedRatings] = useState<any>(null);

    // Initialize form with existing mental ratings
    useEffect(() => {
        if (mentalRatings) {
            setUpdatedRatings(mentalRatings);
        }
    }, [mentalRatings]);

    // Mutation to save updated mental ratings
    const mutation = useMutation({
        mutationFn: updateMentalRating,
        onSuccess: () => {
            navigate(`/trainers/${id}`);
        },
        onError: (error) => {
            console.error('Failed to update mental ratings', error);
            alert('Failed to update mental ratings. Please try again.');
        },
    });

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUpdatedRatings({ ...updatedRatings, [name]: Number(value) });
    };

    // Handle randomizing mental ratings
    const handleRandomize = async () => {
        try {
            const generatedRatings = await generateMentalRatings(parseInt(id!, 10));
            console.log('Generated Ratings:', generatedRatings);
            setUpdatedRatings(generatedRatings);
        } catch (error) {
            console.error('Failed to generate mental ratings', error);
            alert('Failed to generate mental ratings. Please try again.');
        }
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (updatedRatings) {
            mutation.mutate({ id: id!, updatedMentalRatings: updatedRatings });
        }
    };

    // Display loading or error states
    if (isTrainerLoading || isMentalLoading) return <div>Loading...</div>;
    if (trainerError) return <div>Error loading trainer data.</div>;
    if (mentalError) return <div>Error loading mental ratings.</div>;

    const trainer = trainerData.trainer;
    const trainerName = `${trainer.fname} ${trainer.lname}`;

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-3">
                <Col>
                    <h1>Edit Mental Ratings - {trainerName}</h1>
                </Col>
                <Col xs="auto" className="text-end">
                    <Dropdown className="float-end">
                        <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                            Edit
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

            <Form onSubmit={handleSubmit}>
                <Row>
                    {updatedRatings &&
                        orderedMentalRatingFields.map((key) => (
                            <Col key={key} md={3} className="mb-3">
                                <Form.Group>
                                    <Form.Label>{key.replace(/_/g, ' ').replace('rating', '').trim().replace(/\b\w/g, c => c.toUpperCase())}</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name={key}
                                        value={updatedRatings[key] !== undefined ? updatedRatings[key] : ''}
                                        onChange={handleInputChange}
                                        min={0}
                                        max={100}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        ))
                    }
                </Row>
                <Button type="submit" variant="primary">
                    Save Changes
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    className="ms-3"
                    onClick={handleRandomize}
                >
                    Randomize Ratings
                </Button>
            </Form>
            <Row className="mt-3">
                <Col xs="auto" className="text-end">
                    <Dropdown className="float-end">
                        <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                            Other Edits
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}/field_ratings`}>Edit Field Ratings</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}`}>Edit Trainer</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}/mental_ratings`}>Edit Mental Ratings</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}/format_ratings`}>Edit Format Ratings</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Col>
            </Row>
        </Container>
    );
};

export default MentalRatingEdit;
