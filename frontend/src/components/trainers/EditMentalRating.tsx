import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Dropdown } from 'react-bootstrap';

const fetchTrainer = async (id: string) => {
    const { data } = await axios.get(`http://localhost:5000/trainers/${id}`);
    return data.data;
};

const fetchMentalRatings = async (id: string) => {
    const { data } = await axios.get(`http://localhost:5000/trainers/${id}`);
    return data.data.mental_rating;
};

const updateMentalRating = async ({ id, updatedMentalRatings }: { id: string; updatedMentalRatings: any }) => {
    const { data } = await axios.put(`http://localhost:5000/trainers/${id}/mental_ratings`, updatedMentalRatings);
    return data;
};

const MentalRatingEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: trainerData, isLoading: isTrainerLoading } = useQuery({
        queryKey: ['trainer', id],
        queryFn: () => fetchTrainer(id!),
    });

    const { data: mentalRatings, isLoading: isMentalLoading } = useQuery({
        queryKey: ['mental_ratings', id],
        queryFn: () => fetchMentalRatings(id!),
    });

    const [updatedRatings, setUpdatedRatings] = useState<any>(null);

    useEffect(() => {
        if (mentalRatings) {
            setUpdatedRatings(mentalRatings);
        }
    }, [mentalRatings]);

    const mutation = useMutation({
        mutationFn: updateMentalRating,
        onSuccess: () => {
            navigate(`/trainers/${id}`);
        },
        onError: (error) => {
            console.error('Failed to update mental ratings', error);
        },
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUpdatedRatings({ ...updatedRatings, [name]: Number(value) });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (updatedRatings) {
            mutation.mutate({ id: id!, updatedMentalRatings: updatedRatings });
        }
    };

    if (isTrainerLoading || isMentalLoading) return <div>Loading...</div>;

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
                        Object.keys(updatedRatings).map((key) => (
                            key !== 'id' && key !== 'rating_id' && (
                                <Col key={key} md={2} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>{key.replace(/_/g, ' ').replace('rating', '').trim()}</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name={key}
                                            value={updatedRatings[key] || ''}
                                            onChange={handleInputChange}
                                        />
                                    </Form.Group>
                                </Col>
                            )
                        ))}
                </Row>
                <Button type="submit" variant="primary">
                    Save Changes
                </Button>
            </Form>

            <Row className="mt-3">
                <Col xs="auto" className="text-end">
                    <Dropdown className="float-end">
                        <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                            Other Edits
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}/mental_ratings`}>Edit Mental Ratings</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}`}>Edit Trainer</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}/field_ratings`}>Edit Field Ratings</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}/format_ratings`}>Edit Format Ratings</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Col>
            </Row>
        </Container>
    );
};

export default MentalRatingEdit;
