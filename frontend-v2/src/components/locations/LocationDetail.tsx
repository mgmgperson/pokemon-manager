import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
    Box, 
    Typography, 
    Tabs, 
    Tab, 
    Paper, 
    CircularProgress,
    Chip,
    List,
    ListItem,
    ListItemText,
    Divider,
    Button
} from '@mui/material';
import axios from 'axios';

import { Location, getAccessibilityLabel, getTravelTimeLabel } from '../../types/location';
import LocationMap from './LocationMap';

const fetchLocation = async (id: string): Promise<Location> => {
    const { data } = await axios.get(`http://localhost:5000/locations/${id}`);
    return data.data;
};

const LocationDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = React.useState(0);

    const { data: location, isLoading, error } = useQuery({
        queryKey: ['location', id],
        queryFn: () => fetchLocation(id!),
        enabled: !!id,
    });

    const parseAreaCoordinates = (coords: string | null): [number, number][] => {
        if (!coords) return [];
        try {
            return JSON.parse(coords);
        } catch {
            console.error('Failed to parse area coordinates');
            return [];
        }
    };

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
                <Typography color="error">Error loading location data.</Typography>
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
                    <Box>
                        <Typography variant="h4" className="text-white">
                            {location?.name}
                        </Typography>
                        <Typography variant="subtitle1" className="text-gray-400 mt-2">
                            Region: {location && (
                                <Link to={`/regions/${location.region_id}`} className="text-blue-400 hover:text-blue-300">
                                    {location.region_name}
                                </Link>
                            )}
                        </Typography>
                    </Box>
                    <Box className="flex gap-2">
                        <Button
                            variant="contained"
                            component={Link}
                            to={`/edit_location/${location?.id}`}
                            className="mb-4"
                        >
                            Edit Location
                        </Button>
                        <Chip 
                            label={getAccessibilityLabel(location?.accessibility ?? 1).label}
                            color={getAccessibilityLabel(location?.accessibility ?? 1).color as any}
                        />
                        <Chip 
                            label={getTravelTimeLabel(location?.travel_time ?? 1)}
                            className="bg-blue-600"
                        />
                    </Box>
                </Box>
                {location?.parent_location_name && (
                    <Typography variant="subtitle1" className="text-gray-400 mb-2">
                        Part of: {location.parent_location_name}
                    </Typography>
                )}
                <Typography variant="subtitle1" className="text-gray-400 mb-4">
                    Population: {location?.population?.toLocaleString() ?? 'Unknown'}
                </Typography>
                {location?.description && (
                    <Typography variant="body1" className="mt-4 text-white">
                        {location.description}
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
                    <Tab label="Details" className="text-white" />
                    <Tab label="Map" className="text-white" />
                    <Tab label="Shops" className="text-white" />
                    <Tab label="Sub-Locations" className="text-white" />
                </Tabs>
            </Box>

            <Box className="mt-4">
                {activeTab === 0 && location && (
                    <Paper className="p-6">
                        <Typography variant="h6" className="text-white mb-4">
                            Terrain Types
                        </Typography>
                        <Box className="flex gap-2 flex-wrap mb-6">
                            {location.terrain_types.length > 0 ? location.terrain_types.map((terrain, index) => (
                                <Chip 
                                    key={index}
                                    label={terrain}
                                    className="bg-blue-600"
                                />
                            )) : (
                                <Typography className="text-gray-400">
                                    No special terrain types
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                )}
                {activeTab === 1 && location && (
                    <Box>
                        <LocationMap
                            locationName={location.name}
                            regionName={location.region_name}
                            areaCoordinates={parseAreaCoordinates(location.area_coordinates)}
                        />
                    </Box>
                )}
                {activeTab === 2 && location && (
                    <Paper className="p-6">
                        <Typography variant="h6" className="text-white mb-4">
                            Available Shops
                        </Typography>
                        {location.shops.length > 0 ? (
                            <List>
                                {location.shops.map((shop, index) => (
                                    <React.Fragment key={shop.id}>
                                        {index > 0 && <Divider className="my-2 !border-gray-700" />}
                                        <ListItem>
                                            <ListItemText
                                                primary={
                                                    <Link to={`/shops/${shop.id}`} className="text-blue-400 hover:text-blue-300">
                                                        {shop.name}
                                                    </Link>
                                                }
                                                secondary={
                                                    <Box className="mt-1">
                                                        <Typography className="text-gray-400">
                                                            {shop.description}
                                                        </Typography>
                                                        <Chip 
                                                            size="small"
                                                            label={shop.shop_type}
                                                            className="mt-2 bg-gray-700"
                                                        />
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    </React.Fragment>
                                ))}
                            </List>
                        ) : (
                            <Typography className="text-gray-400">
                                No shops available in this location
                            </Typography>
                        )}
                    </Paper>
                )}
                {activeTab === 3 && location && (
                    <Paper className="p-6">
                        <Typography variant="h6" className="text-white mb-4">
                            Sub-Locations
                        </Typography>
                        {location.sub_locations.length > 0 ? (
                            <List>
                                {location.sub_locations.map((subLocation, index) => (
                                    <React.Fragment key={index}>
                                        {index > 0 && <Divider className="my-2 !border-gray-700" />}
                                        <ListItem>
                                            <ListItemText 
                                                primary={
                                                    <Typography className="text-white">
                                                        {subLocation}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    </React.Fragment>
                                ))}
                            </List>
                        ) : (
                            <Typography className="text-gray-400">
                                No sub-locations found
                            </Typography>
                        )}
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

export default LocationDetail;
