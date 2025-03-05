import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Dropdown } from 'react-bootstrap';

const orderedFormatRatingFields: string[] = [
    'singles_rating',
    'doubles_rating',
    'tag_battle_rating',
    'battle_factory_rating',
    'rotation_rating',
    'sixes_rating',
    'threes_rating',
    'twos_rating',
];

const fetchTrainer = async (id: string) => {
    const { data } = await axios.get(`http://localhost:5000/trainers/${id}`);
    return data.data;
};

const fetchFormatRatings = async (id: string) => {
    const { data } = await axios.get(`http://localhost:5000/trainers/${id}`);
    return data.data.format_rating;
};

const updateFormatRating = async ({ id, updatedFormatRatings }: { id: string; updatedFormatRatings: any }) => {
    const { data } = await axios.put(`http://localhost:5000/trainers/${id}/format_ratings`, updatedFormatRatings);
    return data;
};

const generateFormatRatings = async (id: number) => {
    const { data } = await axios.get(`http://localhost:5000/randomize/generate-format-ratings/${id}`);
    return data; 
};

const FormatRatingEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // React Query: fetch trainer
    const { data: trainerData, isLoading: isTrainerLoading } = useQuery({
        queryKey: ['trainer', id],
        queryFn: () => fetchTrainer(id!),
    });

    // React Query: fetch existing format ratings
    const { data: formatRatings, isLoading: isFormatLoading } = useQuery({
        queryKey: ['format_ratings', id],
        queryFn: () => fetchFormatRatings(id!),
    });

    const [updatedRatings, setUpdatedRatings] = useState<any>(null);
    const [calculatedOverall, setCalculatedOverall] = useState<number>(0);

    useEffect(() => {
        if (formatRatings) {
            setUpdatedRatings(formatRatings);
        }
    }, [formatRatings]);

    useEffect(() => {
        if (updatedRatings) {
            const singles = updatedRatings.singles_rating ?? 0;
            const sixes   = updatedRatings.sixes_rating ?? 0;
            const doubles = updatedRatings.doubles_rating ?? 0;
            const tag     = updatedRatings.tag_battle_rating ?? 0;
            const bf      = updatedRatings.battle_factory_rating ?? 0;
            const rotation= updatedRatings.rotation_rating ?? 0;
            const threes  = updatedRatings.threes_rating ?? 0;
            const twos    = updatedRatings.twos_rating ?? 0;

            const totalWeighted =
                (5 * singles) + (5 * sixes) +
                (3.5 * doubles) + (2.5 * tag) + (2.5 * bf) +
                (2 * rotation) + (1 * threes) + (1 * twos);
            
            const overall = totalWeighted / 22.5;  // sum of weights
            setCalculatedOverall(overall);
        }
    }, [updatedRatings]);

    const mutation = useMutation({
        mutationFn: updateFormatRating,
        onSuccess: () => {
            navigate(`/trainers/${id}`);
        },
        onError: (error) => {
            console.error('Failed to update format ratings', error);
            alert('Failed to update format ratings. Please try again.');
        },
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUpdatedRatings({ ...updatedRatings, [name]: Number(value) });
    };

    const handleRandomize = async () => {
        try {
            const generatedRatings = await generateFormatRatings(parseInt(id!, 10));
            setUpdatedRatings(generatedRatings);
        } catch (error) {
            console.error('Failed to generate format ratings', error);
            alert('Failed to generate format ratings. Please try again.');
        }
    };

    // Handler to increment all ratings by 1
    const handleIncrementAll = () => {
        if (updatedRatings) {
            const incrementedRatings = { ...updatedRatings };
            orderedFormatRatingFields.forEach((field) => {
                const currentValue = incrementedRatings[field] ?? 0;
                incrementedRatings[field] = Math.min(currentValue + 1, 99);
            });
            setUpdatedRatings(incrementedRatings);
        }
    };

    // Handler to decrement all ratings by 1
    const handleDecrementAll = () => {
        if (updatedRatings) {
            const decrementedRatings = { ...updatedRatings };
            orderedFormatRatingFields.forEach((field) => {
                const currentValue = decrementedRatings[field] ?? 0;
                decrementedRatings[field] = Math.max(currentValue - 1, 0);
            });
            setUpdatedRatings(decrementedRatings);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (updatedRatings) {
            mutation.mutate({ id: id!, updatedFormatRatings: updatedRatings });
        }
    };

    if (isTrainerLoading || isFormatLoading) return <div>Loading...</div>;

    const trainer = trainerData?.trainer;
    const trainerName = trainer ? `${trainer.fname} ${trainer.lname}` : '';

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-3">
                <Col>
                    <h1>Edit Format Ratings - {trainerName}</h1>
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
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}`}>Edit Trainer</Dropdown.Item>
                            {/* other relevant links */}
                        </Dropdown.Menu>
                    </Dropdown>
                </Col>
            </Row>

            <Form onSubmit={handleSubmit}>
                <Row>
                    {updatedRatings &&
                        orderedFormatRatingFields.map((fieldKey) => (
                            <Col key={fieldKey} md={3} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        {fieldKey.replace(/_/g, ' ')
                                            .replace('rating','')
                                            .trim()
                                            .replace(/\b\w/g, c => c.toUpperCase())}
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        name={fieldKey}
                                        value={updatedRatings[fieldKey] ?? ''}
                                        onChange={handleInputChange}
                                        min={0}
                                        max={99}
                                    />
                                </Form.Group>
                            </Col>
                        ))
                    }
                </Row>
                <Button type="submit" variant="primary">Save Changes</Button>

                <Button
                    type="button"
                    variant="secondary"
                    className="ms-3"
                    onClick={handleRandomize}
                >
                    Randomize Ratings
                </Button>

                {/* New Increment and Decrement Buttons */}
                <Button
                    type="button"
                    variant="outline-secondary"
                    className="ms-3"
                    onClick={handleDecrementAll}
                >
                    -
                </Button>

                <Button
                    type="button"
                    variant="outline-secondary"
                    className="ms-1"
                    onClick={handleIncrementAll}
                >
                    +
                </Button>

                <div style={{ display: 'inline-block', marginLeft: '1rem' }}>
                    <strong>Overall: {Math.round(calculatedOverall)}</strong>
                </div>
            </Form>
            <Row className="mt-3">
                <Col xs="auto" className="text-end">
                    <Dropdown className="float-end">
                        <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                            Other Edits
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}/format_ratings`}>Edit Format Ratings</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}`}>Edit Trainer</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}/field_ratings`}>Edit Field Ratings</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}/mental_ratings`}>Edit Mental Ratings</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Col>
            </Row>
        </Container>
    );
};

export default FormatRatingEdit;