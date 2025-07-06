import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Tabs, Tab, Paper, CircularProgress } from '@mui/material';
import { Region } from '../../types/region';
import axios from 'axios';
import RegionLeague from './RegionLeague';
import RegionMap from './RegionMap';
import RegionCities from './RegionCities';
import RegionLocations from './RegionLocations';

const fetchRegion = async (id: string): Promise<Region> => {
    const { data } = await axios.get(`http://localhost:5000/regions/${id}`);
    return data.data;
};

const RegionDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = React.useState(0);

    const { data: region, isLoading, error } = useQuery({
        queryKey: ['region', id],
        queryFn: () => fetchRegion(id!),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <Box className="flex justify-center items-center h-full">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box className="flex justify-center items-center h-full">
                <Typography color="error">Error loading region data.</Typography>
            </Box>
        );
    }

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Box className="p-6">
            <Paper className="p-6 mb-6">
                <Typography variant="h4" className="mb-2 text-white">
                    {region?.name}
                </Typography>
                <Typography variant="subtitle1" className="text-gray-400">
                    Population: {region?.population.toLocaleString()}
                </Typography>
            </Paper>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }} className="mb-4">
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange}
                    textColor="primary"
                    indicatorColor="primary"
                    className="text-white"
                >
                    <Tab label="Cities" className="text-white" />
                    <Tab label="Locations" className="text-white" />
                    <Tab label="League" className="text-white" />
                    <Tab label="Map" className="text-white" />
                </Tabs>
            </Box>

            <Box className="mt-4">
                {activeTab === 0 && region && <RegionCities cities={region.cities} />}
                {activeTab === 1 && region && <RegionLocations locations={region.locations} />}
                {activeTab === 2 && region && (
                    <RegionLeague
                        champion={region.champion}
                        eliteFour={region.eliteFour}
                        gymLeaders={region.gymLeaders}
                    />
                )}
                {activeTab === 3 && region && (
                    <RegionMap 
                        regionName={region.name} 
                        cities={region.cities} 
                        locations={region.locations} 
                    />
                )}
            </Box>
        </Box>
    );
};

export default RegionDetail;