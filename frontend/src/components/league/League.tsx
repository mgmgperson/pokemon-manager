import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Table, Row, Col } from 'react-bootstrap';
import { LeagueData } from './leaguetypes';
import axios from 'axios';

// Fetch league data from API
const fetchLeagueData = async (): Promise<LeagueData> => {
    const { data } = await axios.get('http://localhost:5000/league');
    return data.data;
};

const League: React.FC = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['leagueData'],
        queryFn: fetchLeagueData
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error fetching league data</div>;
    }

    const leagueData = data as LeagueData;

    const getFirstName = (name: string) => name.split(' ')[0];

    return (
        <Container>
            {/* Display Grand Champion */}
            <Row className="text-center mb-4">
                <h2>Grand Champion</h2>
                <h3>{(leagueData.grandChampion.name)}</h3>
            </Row>

            {/* Display League Table */}
            <Row>
                <Table borderless className="text-center">
                    <thead>
                        <tr>
                            {leagueData.champions.map((champion) => (
                                <th key={champion.region}>
                                    <h4>{champion.region}</h4>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Display Champions */}
                        <tr>
                            {leagueData.champions.map((champion) => (
                                <td key={champion.id}>
                                    <strong>{getFirstName(champion.name)}</strong>
                                </td>
                            ))}
                        </tr>

                        {/* Display Elite Four */}
                        <tr>
                            {leagueData.eliteFour.map((eliteGroup) => (
                                <td key={eliteGroup.region}>
                                    <ul className="list-unstyled">
                                        {eliteGroup.eliteFour.map((member) => (
                                            <li key={member.id}>{getFirstName(member.name)}</li>
                                        ))}
                                    </ul>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </Table>
            </Row>
        </Container>
    );
};

export default League;