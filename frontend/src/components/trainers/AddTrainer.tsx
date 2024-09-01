import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Dropdown } from 'react-bootstrap';

const fetchRegions = async () => {
    const { data } = await axios.get('http://localhost:5000/regions');
    return data.data;
};

const addTrainer = async (newTrainer: any) => {
    const { data } = await axios.post('http://localhost:5000/trainers', newTrainer);
    return data;
};

const AddTrainer: React.FC = () => {
    const navigate = useNavigate();

    const { data: regionsData, isLoading: isRegionsLoading } = useQuery({
        queryKey: ['regions'],
        queryFn: fetchRegions,
    });

    const mutation = useMutation({
        mutationFn: addTrainer,
        onSuccess: () => {
            navigate(`/trainers`);
        },
        onError: (error) => {
            alert('Error adding trainer');
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

    if (isRegionsLoading) return <div>Loading...</div>;

    if (!regionsData) return <div>No Data Found</div>;

    const handleSave = () => {
        const newTrainer = {
            fname,
            lname,
            region_id: regionId,
            birthdate: birthdate || null,
            pwtr_rating: pwtrRating,
            peak_rating: peakRating || null,
            peak_rank: peakRank || null,
            active_status: activeStatus,
        };

        mutation.mutate(newTrainer);
    };

    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-3">
                <Col>
                    <h1>Add New Trainer</h1>
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
                    Add Trainer
                </Button>
            </Form>
        </Container>
    );
};

export default AddTrainer;
