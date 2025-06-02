import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Tabs, Tab, Paper, CircularProgress, Button } from '@mui/material';
import { City } from '../../types/city';
import axios from 'axios';
import CityStadiums from './CityStadiums';
import CityMap from './CityMap';

const fetchCity = async (id: string): Promise<City> => {
    const { data } = await axios.get(`http://localhost:5000/cities/${id}`);
    return data.data;
};

const CityDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = React.useState(0);

    const { data: city, isLoading, error } = useQuery({
        queryKey: ['city', id],
        queryFn: () => fetchCity(id!),
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
                <Typography color="error">Error loading city data.</Typography>
            </Box>
        );
    }

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Box className="p-6">
            <Paper className="p-6 mb-6">
                <Box className="flex justify-between items-center mb-4">
                    <Typography variant="h4" className="text-white">
                        {city?.name}
                    </Typography>
                    <Button 
                        variant="contained"
                        color="primary"
                        onClick={() => navigate(`/edit_city/${id}`)}
                    >
                        Edit City
                    </Button>
                </Box>
                <Typography variant="subtitle1" className="text-gray-400 mb-1">
                    Region: {city && (
                        <Link to={`/regions/${city.region.id}`} className="text-blue-400 hover:text-blue-300">
                            {city.region.name}
                        </Link>
                    )}
                </Typography>
                <Typography variant="subtitle1" className="text-gray-400">
                    Population: {city?.population?.toLocaleString()}
                </Typography>
                {city?.description && (
                    <Typography variant="body1" className="mt-4 text-white">
                        {city.description}
                    </Typography>
                )}
            </Paper>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }} className="mb-4">
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange}
                    textColor="primary"
                    indicatorColor="primary"
                    className="text-white"
                >
                    <Tab label="Info" className="text-white" />
                    <Tab label="Stadiums" className="text-white" />
                    <Tab label="Map" className="text-white" />
                </Tabs>
            </Box>

            <Box className="mt-4">
                {activeTab === 0 && city && (
                    <Paper className="p-6">
                        <Typography variant="h5" className="mb-4 text-white">Gym Leaders</Typography>
                        {city.gymLeaders.length > 0 ? (
                            city.gymLeaders.map((leader) => (
                                <Box key={leader.id} className="mb-4">
                                    <Typography variant="h6" className="text-white">
                                        <Link to={`/trainers/${leader.trainer_id}`} className="text-blue-400 hover:text-blue-300">
                                            {leader.name}
                                        </Link>
                                    </Typography>
                                    <Typography variant="body1" className="text-gray-400">
                                        Type: {leader.type}
                                    </Typography>
                                    {leader.badge && (
                                        <Typography variant="body1" className="text-gray-400">
                                            Badge: {leader.badge}
                                        </Typography>
                                    )}
                                </Box>
                            ))
                        ) : (
                            <Typography variant="body1" className="text-gray-400">
                                No gym leaders in this city.
                            </Typography>
                        )}
                    </Paper>
                )}
                {activeTab === 1 && city && (
                    <CityStadiums stadiums={city.stadiums} />
                )}
                {activeTab === 2 && city && (
                    <CityMap 
                        cityName={city.name} 
                        regionName={city.region.name} 
                        coordinates={{ x: city.x_coordinate, y: city.y_coordinate }} 
                    />
                )}
            </Box>
        </Box>
    );
};

export default CityDetail;