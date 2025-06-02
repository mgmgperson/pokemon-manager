import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { Stadium } from './types';

interface CityStadiumsProps {
    stadiums: Stadium[];
}

const CityStadiums: React.FC<CityStadiumsProps> = ({ stadiums }) => {
    if (!stadiums || stadiums.length === 0) {
        return <div className="text-center p-4">No stadiums found in this city.</div>;
    }

    // Function to determine background color based on stadium type
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
        <div>
            <h3 className="mb-4">Stadiums</h3>
            <Row xs={1} md={2} lg={3} className="g-4">
                {stadiums.map((stadium) => (
                    <Col key={stadium.id}>
                        <Card className="h-100 shadow-sm">
                            <Card.Body>
                                <Card.Title className="d-flex justify-content-between align-items-center">
                                    {stadium.name}
                                    <Badge 
                                        style={{ 
                                            backgroundColor: getTypeColor(stadium.type),
                                            color: '#FFFFFF'
                                        }}
                                    >
                                        {stadium.type}
                                    </Badge>
                                </Card.Title>
                                <Card.Text>
                                    <strong>Capacity:</strong> {stadium.capacity.toLocaleString()} spectators
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default CityStadiums;