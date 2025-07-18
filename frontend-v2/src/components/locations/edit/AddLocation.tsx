import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
    Box, 
    Typography, 
    Paper, 
    CircularProgress, 
    TextField, 
    Button, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    SelectChangeEvent,
    Slider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import axios from 'axios';

interface BasicRegion {
    id: number;
    name: string;
}

interface BasicLocation {
    id: number;
    name: string;
    area_coordinates?: string;
}

const fetchRegions = async (): Promise<BasicRegion[]> => {
    const { data } = await axios.get('http://localhost:5000/regions');
    return data.data;
};

const fetchLocations = async (): Promise<BasicLocation[]> => {
    const { data } = await axios.get('http://localhost:5000/locations');
    return data.data;
};

const fetchLocationsByRegion = async (regionId: string): Promise<BasicLocation[]> => {
    const { data } = await axios.get(`http://localhost:5000/locations?region_id=${regionId}`);
    return data.data;
};

const addLocation = async (newLocation: any) => {
    const { data } = await axios.post('http://localhost:5000/locations', newLocation);
    return data;
};

const AddLocation: React.FC = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        region_id: '',
        population: '',
        description: '',
        area_coordinates: '[]',
        travel_time: 1,
        accessibility: 1,
        parent_location_id: '',
    });

    const [showMapDialog, setShowMapDialog] = useState(false);
    const [currentRegion, setCurrentRegion] = useState<string>('');
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

    // Query for regions
    const { data: regionsData, isLoading: isRegionsLoading } = useQuery({
        queryKey: ['regions'],
        queryFn: fetchRegions,
    });

    // Query for locations (for parent location selection)
    const { data: locationsData, isLoading: isLocationsLoading } = useQuery({
        queryKey: ['locations'],
        queryFn: fetchLocations,
    });

    // Query for locations in the selected region (for map context)
    const { data: regionLocationsData } = useQuery({
        queryKey: ['regionLocations', formData.region_id],
        queryFn: () => fetchLocationsByRegion(formData.region_id),
        enabled: !!formData.region_id,
    });

    // Mutation for adding location
    const mutation = useMutation({
        mutationFn: addLocation,
        onSuccess: () => {
            console.log('Location added successfully, navigating to region page');
            const regionId = formData.region_id;
            if (regionId) {
                navigate(`/regions/${regionId}`);
            } else {
                navigate('/locations'); // Fallback
            }
        },
        onError: (error) => {
            console.error('Error adding location:', error);
        },
    });

    // Form handlers
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'region_id' && regionsData) {
            const selectedRegion = regionsData.find(region => region.id === Number(value));
            if (selectedRegion) {
                setCurrentRegion(selectedRegion.name);
                console.log('Selected region:', selectedRegion.name);
            }
        }
    };

    const handleSliderChange = (name: string) => (_: Event, value: number | number[]) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle image load to get dimensions
    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        setImageDimensions({
            width: img.width,
            height: img.height
        });
    };

    // Utility function to safely parse JSON
    const safeJsonParse = (jsonString: string | null | undefined, fallback: any = []): any => {
        if (!jsonString) return fallback;
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.warn('Failed to parse JSON:', jsonString);
            return fallback;
        }
    };

    // Map dialog handlers
    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageDimensions) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        
        const x = (e.clientX - rect.left) / rect.width; // normalized x (0-1)
        const y = 1 - ((e.clientY - rect.top) / rect.height); // normalized y (0-1), inverted
        
        // Update area_coordinates as a JSON array of coordinate pairs
        const currentCoords = safeJsonParse(formData.area_coordinates, []);
        currentCoords.push([y, x]); // Store normalized coordinates
        
        setFormData(prev => ({
            ...prev,
            area_coordinates: JSON.stringify(currentCoords)
        }));
    };

    // Remove a coordinate point
    const handleRemovePoint = (index: number) => {
        const currentCoords = safeJsonParse(formData.area_coordinates, []);
        currentCoords.splice(index, 1);
        setFormData(prev => ({
            ...prev,
            area_coordinates: JSON.stringify(currentCoords)
        }));
    };

    // Clear all points
    const handleClearPoints = () => {
        setFormData(prev => ({
            ...prev,
            area_coordinates: '[]'
        }));
    };

    // Form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting form...');
        
        const newLocation = {
            ...formData,
            region_id: formData.region_id ? Number(formData.region_id) : null,
            population: formData.population ? Number(formData.population) : null,
            parent_location_id: formData.parent_location_id ? Number(formData.parent_location_id) : null,
        };
        
        console.log('New location data:', newLocation);
        mutation.mutate(newLocation);
    };

    if (isRegionsLoading || isLocationsLoading) {
        return (
            <Box className="flex justify-center items-center h-full">
                <CircularProgress />
            </Box>
        );
    }

    const coordinates = safeJsonParse(formData.area_coordinates, []);

    return (
        <Box component="form" onSubmit={handleSubmit} className="p-6">
            <Paper className="p-6">
                <Typography variant="h4" className="mb-6 text-white">
                    New Location
                </Typography>

                <Box className="grid grid-cols-2 !gap-6">
                    {/* Basic Information - Left Column */}
                    <Box className="flex flex-col gap-6">
                        <TextField
                            fullWidth
                            label="Name"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleTextChange}
                            required
                        />

                        <FormControl fullWidth>
                            <InputLabel>Region</InputLabel>
                            <Select
                                name="region_id"
                                value={formData.region_id || ''}
                                onChange={handleSelectChange}
                                required
                            >
                                {regionsData?.map(region => (
                                    <MenuItem key={region.id} value={region.id}>
                                        {region.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Population"
                            name="population"
                            type="number"
                            value={formData.population || ''}
                            onChange={handleTextChange}
                        />

                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            multiline
                            rows={4}
                            value={formData.description || ''}
                            onChange={handleTextChange}
                        />
                    </Box>

                    {/* Travel and Accessibility - Right Column */}
                    <Box className="flex flex-col gap-6">
                        <Box>
                            <Typography gutterBottom>Travel Time</Typography>
                            <Slider
                                value={formData.travel_time || 1}
                                onChange={handleSliderChange('travel_time')}
                                step={1}
                                marks
                                min={1}
                                max={5}
                                valueLabelDisplay="auto"
                            />
                        </Box>

                        <Box>
                            <Typography gutterBottom>Accessibility</Typography>
                            <Slider
                                value={formData.accessibility || 1}
                                onChange={handleSliderChange('accessibility')}
                                step={1}
                                marks
                                min={1}
                                max={5}
                                valueLabelDisplay="auto"
                            />
                        </Box>

                        <FormControl fullWidth>
                            <InputLabel>Parent Location</InputLabel>
                            <Select
                                name="parent_location_id"
                                value={formData.parent_location_id || ''}
                                onChange={handleSelectChange}
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {locationsData?.map(location => (
                                    <MenuItem key={location.id} value={location.id}>
                                        {location.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            onClick={() => setShowMapDialog(true)}
                            fullWidth
                        >
                            Edit Area Coordinates
                        </Button>
                    </Box>
                </Box>

                <Box className="mt-6 flex justify-end gap-4">
                    <Button
                        variant="outlined"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? 'Adding...' : 'Add Location'}
                    </Button>
                </Box>
            </Paper>

            {/* Map Dialog */}
            <Dialog 
                open={showMapDialog} 
                onClose={() => setShowMapDialog(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle className="bg-gray-800 text-white">
                    Edit Location Area on {currentRegion} Map
                </DialogTitle>
                <DialogContent className="bg-gray-800 p-0">
                    <Box className="p-4 relative">
                        <Typography variant="body2" className="mb-4 text-gray-300">
                            Click on the map to add coordinate points for the location area.
                            {regionLocationsData && regionLocationsData.length > 0 && (
                                <span className="block mt-1 text-gray-400 text-sm">
                                    Red polygons show other locations in this region for context.
                                </span>
                            )}
                        </Typography>
                        {currentRegion ? (
                            <Box 
                                className="relative cursor-crosshair map-container"
                                onClick={handleMapClick}
                            >
                                <img 
                                    src={`/regions/${currentRegion.toLowerCase()}.png`}
                                    alt={`${currentRegion} map`}
                                    className="w-full"
                                    onLoad={handleImageLoad}
                                />
                                
                                {/* Render other locations in the region as static polygons */}
                                {regionLocationsData && imageDimensions && (
                                    <svg 
                                        className="absolute top-0 left-0 pointer-events-none"
                                        style={{ zIndex: 0 }}
                                        width={imageDimensions.width}
                                        height={imageDimensions.height}
                                    >
                                        {regionLocationsData.map((location) => {
                                            const locationCoords = safeJsonParse(location.area_coordinates, []);
                                            if (locationCoords.length < 3) return null;
                                            
                                            const points = locationCoords.map(([y, x]: [number, number]) => 
                                                `${x * imageDimensions.width},${(1 - y) * imageDimensions.height}`
                                            ).join(' ');
                                            
                                            return (
                                                <polygon
                                                    key={`context-${location.id}`}
                                                    points={points}
                                                    fill="rgba(239, 68, 68, 0.3)"
                                                    stroke="rgba(239, 68, 68, 0.6)"
                                                    strokeWidth="1"
                                                />
                                            );
                                        })}
                                    </svg>
                                )}
                                
                                {/* Render coordinate points */}
                                {imageDimensions && coordinates.map((coord: [number, number], index: number) => (
                                    <Box
                                        key={index}
                                        className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:bg-blue-600"
                                        style={{
                                            left: `${coord[1] * imageDimensions.width}px`,
                                            top: `${(1 - coord[0]) * imageDimensions.height}px`
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemovePoint(index);
                                        }}
                                        title={`Point ${index + 1} - Click to remove`}
                                    />
                                ))}
                                
                                {/* Draw lines between points if we have more than 1 */}
                                {coordinates.length > 1 && imageDimensions && (
                                    <svg 
                                        className="absolute inset-0 w-full h-full pointer-events-none"
                                        style={{ zIndex: 2 }}
                                        width={imageDimensions.width}
                                        height={imageDimensions.height}
                                    >
                                        {coordinates.map((coord: [number, number], index: number) => {
                                            if (index === coordinates.length - 1) return null;
                                            const nextCoord = coordinates[index + 1];
                                            return (
                                                <line
                                                    key={index}
                                                    x1={coord[1] * imageDimensions.width}
                                                    y1={(1 - coord[0]) * imageDimensions.height}
                                                    x2={nextCoord[1] * imageDimensions.width}
                                                    y2={(1 - nextCoord[0]) * imageDimensions.height}
                                                    stroke="rgba(59, 130, 246, 0.8)"
                                                    strokeWidth="2"
                                                />
                                            );
                                        })}
                                        {/* Close the polygon if we have 3+ points */}
                                        {coordinates.length >= 3 && (
                                            <line
                                                x1={coordinates[coordinates.length - 1][1] * imageDimensions.width}
                                                y1={(1 - coordinates[coordinates.length - 1][0]) * imageDimensions.height}
                                                x2={coordinates[0][1] * imageDimensions.width}
                                                y2={(1 - coordinates[0][0]) * imageDimensions.height}
                                                stroke="rgba(59, 130, 246, 0.8)"
                                                strokeWidth="2"
                                            />
                                        )}
                                    </svg>
                                )}
                            </Box>
                        ) : (
                            <Box className="flex items-center justify-center h-96 bg-gray-700 border border-gray-600 rounded">
                                <Typography className="text-gray-400">
                                    Please select a region first
                                </Typography>
                            </Box>
                        )}
                        
                        <Box className="mt-4 text-sm text-gray-400">
                            <p>Points: {coordinates.length}</p>
                            <p>Click on the map to add points, click on existing points to remove them</p>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions className="bg-gray-800">
                    <Button 
                        onClick={handleClearPoints}
                        className="!text-red-400"
                        disabled={coordinates.length === 0}
                    >
                        Clear All
                    </Button>
                    <Button 
                        onClick={() => setShowMapDialog(false)}
                        color="primary"
                    >
                        Done
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AddLocation;
