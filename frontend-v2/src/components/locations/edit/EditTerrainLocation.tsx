import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
    Box, 
    Typography, 
    Paper, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    SelectChangeEvent,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Alert
} from '@mui/material';
import axios from 'axios';
import { BasicRegion } from '../../../types/region';
import { Terrain } from '../../../types/terrain';

interface LocationWithTerrains {
    id: number;
    name: string;
    region_id: number;
    region_name: string;
    description: string;
    population: number;
    area_coordinates: [number, number][] | string | null;
    travel_time: number;
    accessibility: number;
    parent_location_id: number | null;
    terrains: {
        terrain_id: number;
        name: string;
        code: string;
        description: string;
        rate: number;
        field_id: number | null;
    }[];
}

interface TerrainUpdate {
    location_id: number;
    terrain_id: number;
    rate: number | null;
    field_id?: number | null;
}

const fetchRegions = async (): Promise<BasicRegion[]> => {
    const { data } = await axios.get('http://localhost:5000/regions');
    return data.data;
};

const fetchTerrains = async (): Promise<Terrain[]> => {
    const { data } = await axios.get('http://localhost:5000/locations/terrains/all');
    return data.data;
};

const fetchLocationsByRegion = async (regionId: number): Promise<LocationWithTerrains[]> => {
    const { data } = await axios.get(`http://localhost:5000/locations?region_id=${regionId}`);
    return data.data;
};

const updateTerrainRates = async (updates: TerrainUpdate[]) => {
    console.log('Sending terrain rate updates:', updates);
    const { data } = await axios.put('http://localhost:5000/locations/terrain-rates', { updates });
    console.log('Backend response:', data);
    return data;
};

const EditTerrainLocation: React.FC = () => {
    const [selectedRegionId, setSelectedRegionId] = useState<number | ''>('');
    const [selectedTerrainId, setSelectedTerrainId] = useState<number | ''>('');
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [newRate, setNewRate] = useState<string>('50');
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
    const [pendingUpdates, setPendingUpdates] = useState<Map<string, number | null>>(new Map());

    // Queries
    const { data: regionsData, isLoading: isRegionsLoading } = useQuery({
        queryKey: ['regions'],
        queryFn: fetchRegions,
    });

    const { data: terrainsData, isLoading: isTerrainsLoading } = useQuery({
        queryKey: ['terrains'],
        queryFn: fetchTerrains,
    });

    const { data: locationsData, isLoading: isLocationsLoading, refetch: refetchLocations } = useQuery({
        queryKey: ['regionLocations', selectedRegionId],
        queryFn: () => fetchLocationsByRegion(selectedRegionId as number),
        enabled: !!selectedRegionId,
    });

    // Mutation for updating terrain rates
    const mutation = useMutation({
        mutationFn: updateTerrainRates,
        onSuccess: () => {
            console.log('Terrain rates updated successfully');
            setPendingUpdates(new Map());
            // Refetch locations data to get updated terrain rates
            refetchLocations();
        },
        onError: (error) => {
            console.error('Error updating terrain rates:', error);
        }
    });

    // Handlers
    const handleRegionChange = (e: SelectChangeEvent<number | string>) => {
        setSelectedRegionId(e.target.value as number);
        setSelectedTerrainId('');
        setPendingUpdates(new Map());
    };

    const handleTerrainChange = (e: SelectChangeEvent<number | string>) => {
        setSelectedTerrainId(e.target.value as number);
    };

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        setImageDimensions({
            width: img.width,
            height: img.height
        });
    };

    const handleLocationClick = (locationId: number, currentRate: number | null) => {
        setSelectedLocationId(locationId);
        setNewRate(currentRate?.toString() || '0');
        setEditDialogOpen(true);
    };

    const handleSaveRate = () => {
        console.log('handleSaveRate called', { selectedLocationId, selectedTerrainId, newRate });
        if (selectedLocationId && selectedTerrainId) {
            const key = `${selectedLocationId}-${selectedTerrainId}`;
            const rate = parseInt(newRate) || null;
            console.log('Adding pending update:', { key, rate });
            setPendingUpdates(prev => new Map(prev.set(key, rate)));
        }
        setEditDialogOpen(false);
        setSelectedLocationId(null);
    };

    const handleSaveAllChanges = () => {
        console.log('handleSaveAllChanges called');
        const updates: TerrainUpdate[] = [];
        
        pendingUpdates.forEach((rate, key) => {
            const [locationId, terrainId] = key.split('-').map(Number);
            updates.push({
                location_id: locationId,
                terrain_id: terrainId,
                rate
            });
        });

        console.log('Updates to send:', updates);
        if (updates.length > 0) {
            mutation.mutate(updates);
        }
    };

    // Helper functions
    const getLocationTerrainRate = (locationId: number, terrainId: number): number | null => {
        const key = `${locationId}-${terrainId}`;
        if (pendingUpdates.has(key)) {
            return pendingUpdates.get(key) || null;
        }
        
        const location = locationsData?.find(l => l.id === locationId);
        const terrain = location?.terrains.find(t => t.terrain_id === terrainId);
        return terrain?.rate || null;
    };

    const getPolygonColor = (locationId: number): string => {
        if (!selectedTerrainId) {
            return 'rgba(59, 130, 246, 0.3)'; // Default blue
        }

        const rate = getLocationTerrainRate(locationId, selectedTerrainId as number);
        
        if (rate === null || rate === 0) {
            return 'rgba(107, 114, 128, 0.3)'; // Gray for no terrain
        }

        // Color intensity based on rate (0-100)
        const intensity = Math.min(rate / 100, 1);
        const red = Math.floor(255 * intensity);
        const green = Math.floor(255 * (1 - intensity));
        return `rgba(${red}, ${green}, 0, 0.5)`;
    };

    const getPolygonStrokeColor = (locationId: number): string => {
        if (!selectedTerrainId) {
            return 'rgba(59, 130, 246, 0.8)'; // Default blue
        }

        const rate = getLocationTerrainRate(locationId, selectedTerrainId as number);
        
        if (rate === null || rate === 0) {
            return 'rgba(107, 114, 128, 0.8)'; // Gray for no terrain
        }

        const intensity = Math.min(rate / 100, 1);
        const red = Math.floor(255 * intensity);
        const green = Math.floor(255 * (1 - intensity));
        return `rgba(${red}, ${green}, 0, 0.8)`;
    };

    const selectedRegion = regionsData?.find(r => r.id === selectedRegionId);
    const selectedTerrain = terrainsData?.find(t => t.id === selectedTerrainId);

    if (isRegionsLoading || isTerrainsLoading) {
        return (
            <Box className="flex justify-center items-center h-full">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box className="p-6">
            <Paper className="p-6">
                <Typography variant="h4" className="mb-6 text-white">
                    Terrain Location Manager
                </Typography>

                {/* Controls */}
                <Box className="grid grid-cols-2 gap-6 mb-6">
                    <FormControl fullWidth>
                        <InputLabel>Region</InputLabel>
                        <Select
                            value={selectedRegionId}
                            onChange={handleRegionChange}
                            required
                        >
                            {regionsData?.map(region => (
                                <MenuItem key={region.id} value={region.id}>
                                    {region.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Terrain</InputLabel>
                        <Select
                            value={selectedTerrainId}
                            onChange={handleTerrainChange}
                            disabled={!selectedRegionId}
                        >
                            {terrainsData?.map(terrain => (
                                <MenuItem key={terrain.id} value={terrain.id}>
                                    {terrain.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* Instructions */}
                {selectedRegion && (
                    <Alert severity="info" className="mb-4">
                        {selectedTerrain 
                            ? `Click on any location to modify its ${selectedTerrain.name} terrain rate. Colors represent rate intensity (gray = no terrain, red = high rate, green = low rate).`
                            : 'Select a terrain to see location rates and modify them.'
                        }
                    </Alert>
                )}

                {/* Map Display */}
                {selectedRegion && (
                    <Box className="mb-6">
                        <Box className="relative">
                            <img 
                                src={`/regions/${selectedRegion.name.toLowerCase()}.png`}
                                alt={`${selectedRegion.name} map`}
                                className="w-full"
                                onLoad={handleImageLoad}
                            />
                            
                            {imageDimensions && locationsData && (
                                <svg
                                    className="absolute top-0 left-0"
                                    width={imageDimensions.width}
                                    height={imageDimensions.height}
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {locationsData.map((location) => {
                                        // Safely handle area_coordinates parsing
                                        let coordinates: [number, number][] = [];
                                        
                                        if (location.area_coordinates) {
                                            if (typeof location.area_coordinates === 'string') {
                                                try {
                                                    coordinates = JSON.parse(location.area_coordinates);
                                                } catch (e) {
                                                    console.error('Failed to parse coordinates for location:', location.name, e);
                                                    return null;
                                                }
                                            } else if (Array.isArray(location.area_coordinates)) {
                                                coordinates = location.area_coordinates;
                                            }
                                        }
                                        
                                        if (!coordinates || coordinates.length < 3) {
                                            console.log('Skipping location with insufficient coordinates:', location.name);
                                            return null;
                                        }
                                        
                                        //console.log('Rendering location:', location.name, 'with coordinates:', coordinates);
                                        const points = coordinates.map(([y, x]) => 
                                            `${x * imageDimensions.width},${(1-y) * imageDimensions.height}`
                                        ).join(' ');
                                        
                                        return (
                                            <polygon
                                                key={location.id}
                                                points={points}
                                                fill={getPolygonColor(location.id)}
                                                stroke={getPolygonStrokeColor(location.id)}
                                                strokeWidth="2"
                                                style={{ 
                                                    pointerEvents: 'all',
                                                    cursor: selectedTerrainId ? 'pointer' : 'default'
                                                }}
                                                onClick={() => {
                                                    if (selectedTerrainId) {
                                                        const currentRate = getLocationTerrainRate(location.id, selectedTerrainId as number);
                                                        handleLocationClick(location.id, currentRate);
                                                    }
                                                }}
                                            >
                                                <title>
                                                    {`${location.name}${selectedTerrainId ? ` - ${selectedTerrain?.name}: ${getLocationTerrainRate(location.id, selectedTerrainId as number) || 0}%` : ''}`}
                                                </title>
                                            </polygon>
                                        );
                                    })}
                                </svg>
                            )}
                        </Box>
                        
                        {isLocationsLoading && (
                            <Box className="flex justify-center mt-4">
                                <CircularProgress />
                            </Box>
                        )}
                    </Box>
                )}

                {/* Save Button */}
                {pendingUpdates.size > 0 && (
                    <Box className="flex justify-end">
                        <Button
                            variant="contained"
                            onClick={handleSaveAllChanges}
                            disabled={mutation.isPending}
                            color="primary"
                        >
                            {mutation.isPending ? 'Saving...' : `Save ${pendingUpdates.size} Changes`}
                        </Button>
                    </Box>
                )}
            </Paper>

            {/* Edit Rate Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Edit Terrain Rate
                </DialogTitle>
                <DialogContent>
                    <Box className="pt-4">
                        {selectedLocationId && selectedTerrainId && (
                            <>
                                <Typography variant="body1" className="mb-4">
                                    <strong>Location:</strong> {locationsData?.find(l => l.id === selectedLocationId)?.name}
                                </Typography>
                                <Typography variant="body1" className="mb-4">
                                    <strong>Terrain:</strong> {selectedTerrain?.name}
                                </Typography>
                                <TextField
                                    fullWidth
                                    label="Rate"
                                    type="number"
                                    value={newRate}
                                    onChange={(e) => setNewRate(e.target.value)}
                                    inputProps={{ min: 0, max: 100 }}
                                    helperText="Set to 0 to remove this terrain from the location"
                                />
                            </>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveRate} variant="contained">
                        Update Rate
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EditTerrainLocation;
