import React from 'react';
import { Row, Col, Table, Container } from 'react-bootstrap';
import SortableTable from '../SortableTable';

interface GymLeader {
    name: string;
    type: string;
    city_name: string;
}

interface RegionLeagueProps {
    champion: string | null;
    eliteFour: string[];
    gymLeaders: GymLeader[];
}

const RegionLeague: React.FC<RegionLeagueProps> = ({ champion, eliteFour, gymLeaders }) => {
    const gymLeaderColumns: Array<{ key: keyof GymLeader, label: string }> = [
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'city_name', label: 'City' },
    ];

    return (
        <Container>
            {/* Champion Section */}
            {champion && (
                <div className="text-center mb-5">
                    <h3 className="display-4 font-weight-bold mb-3">Champion</h3>
                    <p className="h4 text-muted">{champion}</p>
                </div>
            )}
            
            {/* Elite Four Section */}
            {eliteFour.length > 0 && (
                <div className="text-center mb-5">
                    <h3 className="display-4 font-weight-bold mb-3">Elite Four</h3>
                    <Row className="justify-content-center">
                        {eliteFour.map((member, index) => (
                            <Col key={index} md={3} className="mb-4">
                                <div className="h5">{member}</div>
                            </Col>
                        ))}
                    </Row>
                </div>
            )}

            {/* Gym Leaders Section */}
            {gymLeaders.length > 0 && (
                <div className="mb-5">
                    <h3>Gym Leaders</h3>
                    <SortableTable columns={gymLeaderColumns} data={gymLeaders} />
                </div>
            )}
        </Container>
    );
};

export default RegionLeague;
