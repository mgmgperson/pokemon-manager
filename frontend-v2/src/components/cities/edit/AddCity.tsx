import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Typography, Paper, CircularProgress, TextField, Button, MenuItem, FormControl, InputLabel, Select, SelectChangeEvent, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import axios from 'axios';

interface Region {
    id: number;
    name: string;
}

const fetchRegions = async (): Promise<Region[]> => {
    const { data } = await axios.get('http://localhost:5000/regions');
    return data.data;
};

const addCity = async (newCity: any) => {
    const { data } = await axios.post('http://localhost:5000/cities', newCity);
    return data;
};

const AddCity: React.FC = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        region_id: '',
        population: '',
        description: '',
        x_coordinate: 0.5,
        y_coordinate: 0.5,
    });

    const [showMapDialog, setShowMapDialog] = useState(false);
    const [currentRegion, setCurrentRegion] = useState<string>('');

    // Query for regions
    const { data: regionsData, isLoading: isRegionsLoading } = useQuery({
        queryKey: ['regions'],
        queryFn: fetchRegions,
    });

    // Mutation for adding city
    const mutation = useMutation({
        mutationFn: addCity,
        onSuccess: () => {
            console.log('City added successfully, navigating to region page');
            const regionId = formData.region_id;
            if (regionId) {
                navigate(`/regions/${regionId}`);
            } else {
                navigate('/cities'); // Fallback in case region_id is somehow missing
            }
        },
        onError: (error) => {
            console.error('Error adding city:', error);
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

    // Map dialog handlers
    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1 - (e.clientY - rect.top) / rect.height; // Invert Y coordinate for proper positioning
        setFormData(prev => ({
            ...prev,
            x_coordinate: parseFloat(x.toFixed(4)), 
            y_coordinate: parseFloat(y.toFixed(4))
        }));
    };

    // Form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting form...');
        
        const newCity = {
            ...formData,
            region_id: formData.region_id ? Number(formData.region_id) : null,
            population: formData.population ? Number(formData.population) : null,
        };
        
        console.log('New city data:', newCity);
        mutation.mutate(newCity);
    };

    if (isRegionsLoading) {
        return (
            <Box className="flex justify-center items-center h-full">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box className="p-6">
            <Paper className="p-6 bg-gray-800">
                <Typography variant="h4" className="text-white mb-6">
                    Add New City
                </Typography>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField
                            name="name"
                            label="City Name"
                            value={formData.name}
                            onChange={handleTextChange}
                            fullWidth
                            required
                            className="!bg-gray-700"
                            slotProps={{
                                inputLabel: { className: '!text-gray-400' },
                                input: { className: '!text-white' }
                            }}
                        />
                        
                        <FormControl fullWidth className="!bg-gray-700" required>
                            <InputLabel className="!text-gray-400">Region</InputLabel>
                            <Select
                                name="region_id"
                                value={formData.region_id}
                                onChange={handleSelectChange}
                                label="Region"
                                className="!text-white"
                            >
                                {regionsData?.map((region) => (
                                    <MenuItem key={region.id} value={region.id}>
                                        {region.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            name="population"
                            label="Population"
                            type="number"
                            value={formData.population}
                            onChange={handleTextChange}
                            fullWidth
                            className="!bg-gray-700"
                            slotProps={{
                                inputLabel: { className: '!text-gray-400' },
                                input: { className: '!text-white' }
                            }}
                        />

                        <Box className="flex items-center">
                            <Box className="flex-1 mr-2">
                                <TextField
                                    label="X Coordinate"
                                    type="number"
                                    inputProps={{ step: 0.0001, min: 0, max: 1 }}
                                    value={formData.x_coordinate}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        x_coordinate: parseFloat(e.target.value) || 0
                                    }))}
                                    fullWidth
                                    className="!bg-gray-700"
                                    slotProps={{
                                        inputLabel: { className: '!text-gray-400' },
                                        input: { className: '!text-white' }
                                    }}
                                />
                            </Box>
                            <Box className="flex-1 mr-2">
                                <TextField
                                    label="Y Coordinate"
                                    type="number"
                                    inputProps={{ step: 0.0001, min: 0, max: 1 }}
                                    value={formData.y_coordinate}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        y_coordinate: parseFloat(e.target.value) || 0
                                    }))}
                                    fullWidth
                                    className="!bg-gray-700"
                                    slotProps={{
                                        inputLabel: { className: '!text-gray-400' },
                                        input: { className: '!text-white' }
                                    }}
                                />
                            </Box>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setShowMapDialog(true)}
                            >
                                <PlaceIcon />
                            </Button>
                        </Box>

                        <Box sx={{ gridColumn: '1 / -1' }}>
                            <TextField
                                name="description"
                                label="Description"
                                value={formData.description}
                                onChange={handleTextChange}
                                fullWidth
                                multiline
                                rows={3}
                                className="!bg-gray-700"
                                slotProps={{
                                    inputLabel: { className: '!text-gray-400' },
                                    input: { className: '!text-white' }
                                }}
                            />
                        </Box>
                    </Box>

                    <Box className="flex justify-end gap-2 mt-6">
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/cities')}
                            className="!text-white !border-white hover:!bg-gray-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            className="!bg-blue-600 hover:!bg-blue-700"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? 'Adding...' : 'Add City'}
                        </Button>
                    </Box>
                </form>
            </Paper>

            {/* Map Dialog */}
            <Dialog 
                open={showMapDialog} 
                onClose={() => setShowMapDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle className="bg-gray-800 text-white">
                    Place City on Map
                </DialogTitle>
                <DialogContent className="bg-gray-800 p-0">
                    <Box className="p-4 relative">
                        <Typography variant="body2" className="mb-4 text-gray-300">
                            Click on the map to set the city's coordinates.
                        </Typography>
                        {currentRegion ? (
                            <Box 
                                className="relative cursor-crosshair"
                                onClick={handleMapClick}
                            >
                                <img 
                                    src={`/regions/${currentRegion.toLowerCase()}.png`}
                                    alt={`${currentRegion} map`}
                                    className="w-full"
                                />
                                <Box
                                    className="absolute w-5 h-5 bg-red-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"
                                    style={{
                                        top: `${(1-formData.y_coordinate) * 100}%`,
                                        left: `${formData.x_coordinate * 100}%`
                                    }}
                                />
                            </Box>
                        ) : (
                            <Box className="flex items-center justify-center h-48 bg-gray-700 border border-gray-600 rounded">
                                <Typography className="text-gray-400">
                                    Please select a region first
                                </Typography>
                            </Box>
                        )}
                        <Box className="mt-3 flex gap-3 justify-center text-white">
                            <Typography>
                                X: {formData.x_coordinate.toFixed(4)}
                            </Typography>
                            <Typography>
                                Y: {formData.y_coordinate.toFixed(4)}
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions className="bg-gray-800">
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

export default AddCity;
