import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
    Box,
    Paper,
    Typography,
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
    DialogActions,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { EditableLocation } from '../../../types/location';
import { BasicRegion } from '../../../types/region';
import { Terrain, LocationTerrain } from '../../../types/terrain';

const fetchLocation = async (id: string): Promise<EditableLocation> => {
    const { data } = await axios.get(`http://localhost:5000/locations/${id}`);
    return data.data;
};

const fetchRegions = async (): Promise<BasicRegion[]> => {
    const { data } = await axios.get('http://localhost:5000/regions');
    return data.data;
};

const fetchTerrains = async (): Promise<Terrain[]> => {
    const { data } = await axios.get('http://localhost:5000/terrains');
    return data.data;
};

const updateLocation = async ({ id, updatedLocation }: { id: string, updatedLocation: any }) => {
    const { data } = await axios.put(`http://localhost:5000/locations/${id}`, updatedLocation);
    return data;
};

const EditLocation: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<Partial<EditableLocation>>({
        name: '',
        region_id: 0,
        population: 0,
        description: '',
        area_coordinates: '[]',
        travel_time: 1,
        accessibility: 1,
        parent_location_id: null,
        terrains: [],
    });

    const [showMapDialog, setShowMapDialog] = useState(false);
    const [showTerrainDialog, setShowTerrainDialog] = useState(false);
    const [currentTerrain, setCurrentTerrain] = useState<LocationTerrain>({
        terrain_id: 0,
        rate: 50,
        field_id: null,
    });
    const [editingTerrainIndex, setEditingTerrainIndex] = useState<number | null>(null);
    const [imageDimensions, setImageDimensions] = React.useState<{ width: number; height: number } | null>(null);
    const [dragInfo, setDragInfo] = useState<{
        isDragging: boolean;
        pointIndex: number | null;
    }>({
        isDragging: false,
        pointIndex: null
    });

    // Queries
    const { data: locationData, isLoading: isLocationLoading } = useQuery({
        queryKey: ['location', id],
        queryFn: () => fetchLocation(id!),
        enabled: !!id,
    });

    const { data: regionsData, isLoading: isRegionsLoading } = useQuery({
        queryKey: ['regions'],
        queryFn: fetchRegions,
    });

    const { data: terrainsData, isLoading: isTerrainsLoading } = useQuery({
        queryKey: ['terrains'],
        queryFn: fetchTerrains,
    });

    // Mutation for updating location
    const mutation = useMutation({
        mutationFn: updateLocation,
        onSuccess: () => {
            navigate(`/locations/${id}`, { replace: true });
        },
    });

    // Load location data into form
    useEffect(() => {
        if (locationData) {
            setFormData(locationData);
        }
    }, [locationData]);

    // Form handlers
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (e: SelectChangeEvent<any>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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

    // Terrain dialog handlers
    const handleTerrainChange = (e: SelectChangeEvent<number>) => {
        setCurrentTerrain(prev => ({
            ...prev,
            terrain_id: e.target.value as number
        }));
    };

    const handleTerrainRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentTerrain(prev => ({
            ...prev,
            rate: parseInt(e.target.value, 10)
        }));
    };

    const handleTerrainSubmit = () => {
        if (editingTerrainIndex !== null) {
            const updatedTerrains = [...(formData.terrains || [])];
            updatedTerrains[editingTerrainIndex] = currentTerrain;
            setFormData(prev => ({ ...prev, terrains: updatedTerrains }));
        } else {
            setFormData(prev => ({
                ...prev,
                terrains: [...(prev.terrains || []), currentTerrain]
            }));
        }
        
        setShowTerrainDialog(false);
        setEditingTerrainIndex(null);
        setCurrentTerrain({ terrain_id: 0, rate: 50, field_id: null });
    };

    const handleEditTerrain = (index: number) => {
        setCurrentTerrain(formData.terrains![index]);
        setEditingTerrainIndex(index);
        setShowTerrainDialog(true);
    };

    const handleDeleteTerrain = (index: number) => {
        const updatedTerrains = [...(formData.terrains || [])];
        updatedTerrains.splice(index, 1);
        setFormData(prev => ({ ...prev, terrains: updatedTerrains }));
    };

    // Handle starting to drag a point
    //TODO: FIX DRAGGING pOINTS
    const handlePointDragStart = (e: React.MouseEvent, index: number) => {
        e.stopPropagation(); // Prevent new point creation
        setDragInfo({
            isDragging: true,
            pointIndex: index
        });

        // Add window-level event listeners
        window.addEventListener('mousemove', handlePointDrag);
        window.addEventListener('mouseup', handlePointDragEnd);
    };

    // Handle point dragging
    const handlePointDrag = (e: MouseEvent) => {
        if (!dragInfo.isDragging || dragInfo.pointIndex === null || !imageDimensions) return;

        const rect = document.querySelector('.map-container')?.getBoundingClientRect();
        if (!rect) return;

        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, 1 - ((e.clientY - rect.top) / rect.height)));

        const currentCoords = safeJsonParse(formData.area_coordinates, []);
        currentCoords[dragInfo.pointIndex] = [y, x];

        setFormData(prev => ({
            ...prev,
            area_coordinates: JSON.stringify(currentCoords)
        }));
    };

    // Handle ending point drag
    const handlePointDragEnd = () => {
        setDragInfo({
            isDragging: false,
            pointIndex: null
        });

        // Remove window-level event listeners
        window.removeEventListener('mousemove', handlePointDrag);
        window.removeEventListener('mouseup', handlePointDragEnd);
    };

    // Cleanup event listeners on unmount
    useEffect(() => {
        return () => {
            window.removeEventListener('mousemove', handlePointDrag);
            window.removeEventListener('mouseup', handlePointDragEnd);
        };
    }, []); // Empty dependency array since we're just cleaning up

    // Form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (id) {
            mutation.mutate({
                id,
                updatedLocation: formData
            });
        }
    };

    if (isLocationLoading || isRegionsLoading || isTerrainsLoading) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <Box component="form" onSubmit={handleSubmit} className="p-6">
            <Paper className="p-6">
                <Typography variant="h4" className="mb-6 text-white">
                    {id ? 'Edit' : 'New'} Location
                </Typography>

                <Box className="grid grid-cols-2 !gap-6">
                    {/* Basic Information */}
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

                    {/* Travel and Accessibility */}
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
                                {/* Add parent location options here */}
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

                {/* Terrains Section */}
                <Box className="mt-6">
                    <Box className="flex justify-between items-center mb-4">
                        <Typography variant="h6">Terrains</Typography>
                        <Button
                            startIcon={<AddIcon />}
                            onClick={() => setShowTerrainDialog(true)}
                        >
                            Add Terrain
                        </Button>
                    </Box>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Terrain</TableCell>
                                    <TableCell>Rate</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {formData.terrains?.map((terrain, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {terrainsData?.find(t => t.id === terrain.terrain_id)?.name}
                                        </TableCell>
                                        <TableCell>{terrain.rate}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleEditTerrain(index)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDeleteTerrain(index)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
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
                        Save Changes
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
                <DialogTitle>Edit Area Coordinates</DialogTitle>
                <DialogContent>
                    <Box className="relative w-full map-container" onClick={handleMapClick}>
                        <img 
                            src={`/regions/${regionsData?.find(r => r.id === formData.region_id)?.name.toLowerCase()}.png`}
                            alt="Region Map"
                            className="w-full"
                            onLoad={handleImageLoad}
                        />
                        {imageDimensions && (
                            <svg
                                className="absolute top-0 left-0"
                                width={imageDimensions.width}
                                height={imageDimensions.height}
                                style={{ pointerEvents: 'none' }}
                            >
                                <polygon
                                    points={safeJsonParse(formData.area_coordinates, [])
                                        .map(([y, x]: [number, number]) => `${x * imageDimensions.width},${(1-y) * imageDimensions.height}`)
                                        .join(' ')}
                                    className="fill-blue-500/30 stroke-blue-500 stroke-2"
                                />
                                {safeJsonParse(formData.area_coordinates, []).map(([y, x]: [number, number], index: number) => (
                                    <circle
                                        key={index}
                                        cx={x * imageDimensions.width}
                                        cy={(1-y) * imageDimensions.height}
                                        r="6"
                                        className="fill-blue-500 cursor-move"
                                        style={{ pointerEvents: 'all' }}
                                        onMouseDown={(e) => handlePointDragStart(e, index)}
                                    />
                                ))}
                            </svg>
                        )}
                    </Box>
                    <Box className="mt-4 flex justify-between">
                        <Button 
                            onClick={() => setFormData(prev => ({ ...prev, area_coordinates: '[]' }))}
                            color="error"
                        >
                            Clear Points
                        </Button>
                        <Typography className="text-gray-400">
                            Click on the map to add points. Points will be connected in the order they are added.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowMapDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Terrain Dialog */}
            <Dialog
                open={showTerrainDialog}
                onClose={() => setShowTerrainDialog(false)}
            >
                <DialogTitle>
                    {editingTerrainIndex !== null ? 'Edit' : 'Add'} Terrain
                </DialogTitle>
                <DialogContent>
                    <Box className="space-y-4 pt-4">
                        <FormControl fullWidth>
                            <InputLabel>Terrain</InputLabel>
                            <Select
                                value={currentTerrain.terrain_id}
                                onChange={handleTerrainChange}
                                required
                            >
                                {terrainsData?.map(terrain => (
                                    <MenuItem key={terrain.id} value={terrain.id}>
                                        {terrain.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Rate"
                            type="number"
                            value={currentTerrain.rate}
                            onChange={handleTerrainRateChange}
                            inputProps={{ min: 0, max: 100 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowTerrainDialog(false)}>Cancel</Button>
                    <Button onClick={handleTerrainSubmit} variant="contained">
                        {editingTerrainIndex !== null ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EditLocation;
