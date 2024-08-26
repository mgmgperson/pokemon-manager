import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Dropdown } from 'react-bootstrap';

const fetchTrainer = async (id: string) => {
    const { data } = await axios.get(`http://localhost:5000/trainers/${id}`);
    return data.data;
};

const fetchRegions = async () => {
    const { data } = await axios.get('http://localhost:5000/regions');
    return data.data;
};

const updateTrainer = async ({ id, updatedTrainer }: { id: string, updatedTrainer: any }) => {
    const { data } = await axios.put(`http://localhost:5000/trainers/${id}`, updatedTrainer);
    return data;
};

const EditTrainer: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: trainerData, isLoading: isTrainerLoading } = useQuery({
        queryKey: ['trainer', id],
        queryFn: () => fetchTrainer(id!),
    });

    const { data: regionsData, isLoading: isRegionsLoading } = useQuery({
        queryKey: ['regions'],
        queryFn: fetchRegions,
    });

    const mutation = useMutation({
        mutationFn: updateTrainer,
        onSuccess: () => {
            navigate(`/trainers/${id}`);
        },
        onError: (error) => {
            alert('Error updating trainer');
            console.error(error);
        },
    });

    const [fname, setFname] = useState('');
    const [lname, setLname] = useState('');
    const [regionId, setRegionId] = useState<number | string>('');
    const [birthdate, setBirthdate] = useState<string | null>('');
    const [pwtrRating, setPwtrRating] = useState<number | string>('');
    const [peakRating, setPeakRating] = useState<number | string | null>(null);
    const [peakRank, setPeakRank] = useState<number | string | null>(null);
    const [activeStatus, setActiveStatus] = useState(1);

    if (isTrainerLoading || isRegionsLoading) return <div>Loading...</div>;

    if (!trainerData || !regionsData) return <div>No Data Found</div>;

    const trainer = trainerData.trainer;

    if (fname === '' && lname === '') {
        setFname(trainer.fname);
        setLname(trainer.lname);
        setRegionId(trainer.region_id);
        setBirthdate(trainer.birthdate || '');
        setPwtrRating(trainer.pwtr_rating);
        setPeakRating(trainer.peak_rating);
        setPeakRank(trainer.peak_rank);
        setActiveStatus(trainer.active_status);
    }

    const handleSave = () => {
        const updatedTrainer = {
            fname,
            lname,
            region_id: regionId,
            birthdate: birthdate || null,
            pwtr_rating: pwtrRating,
            peak_rating: peakRating || null,
            peak_rank: peakRank || null,
            active_status: activeStatus,
        };

        mutation.mutate({ id: id!, updatedTrainer });
    };

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-3">
                <Col>
                    <h1>Edit Trainer - {fname} {lname}</h1>
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
            <Form>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>First Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={fname}
                                onChange={(e) => setFname(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Last Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={lname}
                                onChange={(e) => setLname(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Birthdate</Form.Label>
                            <Form.Control
                                type="date"
                                value={birthdate || ''}
                                onChange={(e) => setBirthdate(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>PWTR Rating</Form.Label>
                            <Form.Control
                                type="number"
                                value={pwtrRating}
                                onChange={(e) => setPwtrRating(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Peak Rating</Form.Label>
                            <Form.Control
                                type="number"
                                value={peakRating || ''}
                                onChange={(e) => setPeakRating(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Peak Rank</Form.Label>
                            <Form.Control
                                type="number"
                                value={peakRank || ''}
                                onChange={(e) => setPeakRank(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Region</Form.Label>
                            <Form.Select
                                value={regionId}
                                onChange={(e) => setRegionId(e.target.value)}
                            >
                                {regionsData.map((region: any) => (
                                    <option key={region.id} value={region.id}>
                                        {region.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Active Status</Form.Label>
                            <Form.Select
                                value={activeStatus}
                                onChange={(e) => setActiveStatus(Number(e.target.value))}
                            >
                                <option value={1}>Active</option>
                                <option value={0}>Inactive</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                <Button variant="primary" onClick={handleSave}>
                    Save
                </Button>
            </Form>
            <Row className="mt-3">
                <Col xs="auto" className="text-end">
                    <Dropdown className="float-end">
                        <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                            Other Edits
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}`}>Edit Trainer</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}/field_ratings`}>Edit Field Ratings</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}/mental_ratings`}>Edit Mental Ratings</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/edit_trainer/${id}/format_ratings`}>Edit Format Ratings</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Col>
            </Row>
        </Container>
    );
};

export default EditTrainer;
