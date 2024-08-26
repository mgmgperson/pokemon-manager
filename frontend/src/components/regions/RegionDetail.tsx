import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tab, Nav, Container } from 'react-bootstrap';
import SortableTable from '../SortableTable';
import RegionLeague from './RegionLeague';
import RegionMap from './RegionMap';
import { City, Region } from '../../types';
import axios from 'axios';

const fetchRegion = async (id: string): Promise<Region> => {
    const { data } = await axios.get(`http://localhost:5000/regions/${id}`);
    return data.data;
};

const RegionDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const { data: region, isLoading, error } = useQuery({
        queryKey: ['region', id],
        queryFn: () => fetchRegion(id!),
        enabled: !!id, 
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error loading region data.</div>;
    }

    const cityColumns: Array<{ key: keyof City, label: string, render?: (item: City) => React.ReactNode }> = [
        { key: 'name', label: 'City' },
        { key: 'population', label: 'Population' },
    ];

    return (
        <Container>
            <h1>{region?.name}</h1>
            <p>Population: {region?.population.toLocaleString()}</p>
            <Tab.Container defaultActiveKey="cities">
                <Nav variant="tabs">
                    <Nav.Item>
                        <Nav.Link eventKey="cities">Cities</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="league">League</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="map">Map</Nav.Link>
                    </Nav.Item>
                </Nav>
                <Tab.Content>
                    <Tab.Pane eventKey="cities">
                        {region && (
                            <SortableTable
                                columns={cityColumns}
                                data={region.cities}
                                itemsPerPage={10}
                                withPagination={true}
                            />
                        )}
                    </Tab.Pane>
                    <Tab.Pane eventKey="league">
                        {region && (
                            <RegionLeague
                                champion={region.champion}
                                eliteFour={region.eliteFour}
                                gymLeaders={region.gymLeaders}
                            />
                        )}
                    </Tab.Pane>
                    <Tab.Pane eventKey="map">
                        {region && <RegionMap regionName={region.name} cities={region.cities} />}
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>
        </Container>
    );
};

export default RegionDetail;
