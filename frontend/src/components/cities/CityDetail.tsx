import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tab, Nav, Container, Row, Col, Card, Badge } from 'react-bootstrap';
import CityMap from './CityMap';
import CityStadiums from './CityStadiums';
import axios from 'axios';
import { City } from './types';

const fetchCity = async (id: string): Promise<City> => {
    const { data } = await axios.get(`http://localhost:5000/cities/${id}`);
    return data.data;
};

const CityDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const { data: city, isLoading, error } = useQuery({
        queryKey: ['city', id],
        queryFn: () => fetchCity(id!),
        enabled: !!id, 
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error loading city data.</div>;
    }

    if (!city) {
        return <div>City not found.</div>;
    }

    // Function to determine background color based on gym leader type
    const getTypeColor = (type: string): string => {
        const typeColors: { [key: string]: string } = {
            'Fire': '#FF9D55',
            'Water': '#5090D6',
            'Grass': '#63BC5A',
            'Electric': '#F4D23C',
            'Ice': '#73CEC0',
            'Fighting': '#CE416B',
            'Poison': '#B567CE',
            'Ground': '#D97845',
            'Flying': '#8FA9DE',
            'Psychic': '#FA7179',
            'Bug': '#91C12F',
            'Rock': '#C5B78C',
            'Ghost': '#5269AD',
            'Dragon': '#0B6DC3',
            'Dark': '#5A5465',
            'Steel': '#5A8EA2',
            'Fairy': '#EC8FE6',
            'Normal': '#919AA2'
        };
        
        return typeColors[type] || '#919AA2'; // Default to Normal color if type not found
    };

    return (
        <Container>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>{city.name}</h1>
                <Link to={`/regions/${city.region.id}`} className="btn btn-outline-primary">
                    Back to {city.region.name} Region
                </Link>
            </div>
            <Row className="mb-4">
                <Col md={8}>
                    <p className="lead">{city.description || 'No description available for this city.'}</p>
                    <p><strong>Population:</strong> {city.population.toLocaleString()}</p>
                </Col>
                <Col md={4}>
                    {city.gymLeaders && city.gymLeaders.length > 0 && (
                        <Card className="shadow-sm">
                            <Card.Header className="bg-primary text-white">
                                <h4 className="mb-0">Gym Leader{city.gymLeaders.length > 1 ? 's' : ''}</h4>
                            </Card.Header>
                            <Card.Body>
                                {city.gymLeaders.map((leader) => (
                                    <div key={leader.id} className="mb-2">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <h5 className="mb-0">{leader.name}</h5>
                                            <Badge
                                                style={{
                                                    backgroundColor: getTypeColor(leader.type),
                                                    color: '#FFFFFF'
                                                }}
                                            >
                                                {leader.type}
                                            </Badge>
                                        </div>
                                        <p className="mb-0"><strong>Badge:</strong> {leader.badge}</p>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>
            <Tab.Container defaultActiveKey="map">
                <Nav variant="tabs" className="mb-4">
                    <Nav.Item>
                        <Nav.Link eventKey="map">City Map</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="stadiums">Stadiums</Nav.Link>
                    </Nav.Item>
                </Nav>
                <Tab.Content>
                    <Tab.Pane eventKey="map">
                        <CityMap
                            regionName={city.region.name}
                            cityName={city.name}
                            x_coordinate={city.x_coordinate}
                            y_coordinate={city.y_coordinate}
                        />
                    </Tab.Pane>
                    <Tab.Pane eventKey="stadiums">
                        <CityStadiums stadiums={city.stadiums} />
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>
        </Container>
    );
};

export default CityDetail;