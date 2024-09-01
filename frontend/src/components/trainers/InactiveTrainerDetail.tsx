import React from 'react';
import { TrainerData } from '../../types';
import { Container, Row, Col, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const InactiveTrainerDetail: React.FC<{ trainerData: TrainerData }> = ({ trainerData }) => {
    const trainer = trainerData.trainer;
    const id = trainer.id;

    return (
        <Container className="mt-4">
            {/* Top header with name and title */}
            <Row className="align-items-center mb-3">
                <Col>
                    <h1>{trainer.fname} {trainer.lname}</h1>
                </Col>
                <Col xs="auto">
                    <Dropdown>
                        <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                            Overview
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

            {/* Profile section with picture and details */}
            <Row>
                {/* Column for Trainer Image and Details */}
                <Col xs={12} sm={12} md={4} className="d-flex align-items-start">
                    <Col xs={3} sm={3} md={6} className="d-flex align-items-center">
                        <div
                            style={{
                                width: '150px',
                                height: '150px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                marginRight: '1rem',
                            }}
                        />
                    </Col>

                    <Col xs={9} sm={9} md={8} className="d-flex flex-column">
                        <div>
                            <p className="mb-2"><strong>Title:</strong> {trainer.title || 'None'}</p>
                            <p className="mb-2"><strong>Birthdate:</strong> {trainer.birthdate || 'Unknown'}</p>
                            <p className="mb-2">
                                <strong>Region:</strong>{' '}
                                <Link to={`/regions/${trainer.region_id}`}>{trainer.region_name}</Link>
                            </p>
                        </div>
                    </Col>
                </Col>

                {/* Column for Peak Rank and Rating */}
                <Col xs={12} sm={12} md={2} className="d-flex flex-column justify-content-start">
                    <div className="text-start">
                        <p className="mb-1"><strong>Peak Rank</strong></p>
                        <h2>{trainer.peak_rank || 'N/A'}</h2>
                    </div>
                    <div className="text-start">
                        <p className="mb-1"><strong>Peak Rating</strong></p>
                        <h2>{trainer.peak_rating ? trainer.peak_rating.toFixed(2) : 'N/A'}</h2>
                    </div>
                </Col>

                {/* Empty Column for Future Badges */}
                <Col xs={12} sm={12} md={3} className="d-flex justify-content-end">
                    {/* This space can be used for future badges */}
                </Col>
            </Row>
        </Container>
    );
};

export default InactiveTrainerDetail;
