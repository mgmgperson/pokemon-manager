// filepath: /Users/alin/Documents/Saves/idiot-2/idiot/Project-Pokemon/frontend-v2/src/components/cities/edit/EditCity.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
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
    Divider,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlaceIcon from '@mui/icons-material/Place';

interface Region {
    id: number;
    name: string;
}

interface Trainer {
    id: number;
    fname: string;
    lname: string;
}

import { City as CityType } from '../../../types/city';

interface Stadium {
    id?: number;
    name: string;
    type: string | null;
    capacity: number | null;
}

interface GymLeader {
    id?: number;
    trainer_id: number;
    name?: string;
    badge: string | null;
    type: string;
}

// Using the imported CityType for our type references
type City = CityType;

// Pokemon types for dropdown
const pokemonTypes = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
    'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
    'Steel', 'Fairy'
];

const fetchCity = async (id: string): Promise<City> => {
    const { data } = await axios.get(`http://localhost:5000/cities/${id}`);
    return data.data;
};

const fetchRegions = async (): Promise<Region[]> => {
    const { data } = await axios.get('http://localhost:5000/regions');
    return data.data;
};

const fetchTrainers = async (): Promise<Trainer[]> => {
    const { data } = await axios.get('http://localhost:5000/trainers');
    return data.data;
};

const updateCity = async ({ id, updatedCity }: { id: string, updatedCity: any }) => {
    console.log('Sending update request to server with data:', updatedCity);
    try {
        const { data } = await axios.put(`http://localhost:5000/cities/${id}`, updatedCity);
        console.log('Server response:', data);
        return data;
    } catch (error) {
        console.error('Error in updateCity:', error);
        throw error;
    }
};

const EditCity: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        region_id: '',
        population: '',
        description: '',
        x_coordinate: 0.5,
        y_coordinate: 0.5,
    });

    const [stadiums, setStadiums] = useState<Stadium[]>([]);
    const [gymLeaders, setGymLeaders] = useState<GymLeader[]>([]);
    
    const [showMapDialog, setShowMapDialog] = useState(false);
    const [showStadiumDialog, setShowStadiumDialog] = useState(false);
    const [showGymLeaderDialog, setShowGymLeaderDialog] = useState(false);

    const [currentStadium, setCurrentStadium] = useState<Stadium>({
        name: '',
        type: null,
        capacity: null,
    });

    const [currentGymLeader, setCurrentGymLeader] = useState<GymLeader>({
        trainer_id: 0,
        badge: '',
        type: '',
    });

    const [editingStadiumIndex, setEditingStadiumIndex] = useState<number | null>(null);
    const [editingGymLeaderIndex, setEditingGymLeaderIndex] = useState<number | null>(null);
    const [currentRegion, setCurrentRegion] = useState<string>('');
    const [trainerSearch, setTrainerSearch] = useState<string>('');

    // Queries
    const { data: cityData, isLoading: isCityLoading } = useQuery({
        queryKey: ['city', id],
        queryFn: () => fetchCity(id!),
        enabled: !!id,
    });

    const { data: regionsData, isLoading: isRegionsLoading } = useQuery({
        queryKey: ['regions'],
        queryFn: fetchRegions,
    });

    const { data: trainersData, isLoading: isTrainersLoading } = useQuery({
        queryKey: ['trainers'],
        queryFn: fetchTrainers
    });

    // Log trainers data when it changes
    useEffect(() => {
        if (trainersData) {
            console.log('Trainers data loaded:', trainersData);
        }
    }, [trainersData]);

    // Mutation for updating city
    const mutation = useMutation({
        mutationFn: updateCity,
        onSuccess: () => {
            console.log('City updated successfully, navigating to city detail page');
            // Use navigate with replace option to prevent going back to edit form with browser back button
            navigate(`/cities/${id}`, { replace: true });
        },
        onError: (error) => {
            console.error('Error updating city:', error);
        },
    });

    // Load city data into form
    useEffect(() => {
        if (cityData) {
            console.log('City data loaded:', cityData);
            setFormData({
                name: cityData.name || '',
                region_id: cityData.region.id.toString() || '',
                population: cityData.population?.toString() || '',
                description: cityData.description || '',
                x_coordinate: cityData.x_coordinate || 0.5,
                y_coordinate: cityData.y_coordinate || 0.5,
            });
            setStadiums(cityData.stadiums || []);
            
            // Map gym leaders, ensuring trainer_id is a number
            setGymLeaders(cityData.gymLeaders?.map((leader: any) => ({
                id: leader.id,
                trainer_id: Number(leader.trainer_id),
                badge: leader.badge,
                type: leader.type
            })) || []);
            console.log('Parsed gym leaders:', cityData.gymLeaders);
            
            setCurrentRegion(cityData.region.name);
        }
    }, [cityData]);

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
            const selectedRegion = regionsData.find(region => region.id.toString() === value);
            if (selectedRegion) {
                setCurrentRegion(selectedRegion.name);
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

    // Stadium dialog handlers
    const handleStadiumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentStadium(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleStadiumTypeChange = (e: SelectChangeEvent<string | null>) => {
        setCurrentStadium(prev => ({
            ...prev,
            type: e.target.value
        }));
    };

    const handleStadiumSubmit = () => {
        if (editingStadiumIndex !== null) {
            // Edit existing stadium
            const updatedStadiums = [...stadiums];
            updatedStadiums[editingStadiumIndex] = {
                ...currentStadium,
                capacity: currentStadium.capacity ? Number(currentStadium.capacity) : null
            };
            setStadiums(updatedStadiums);
        } else {
            // Add new stadium
            setStadiums([...stadiums, {
                ...currentStadium,
                capacity: currentStadium.capacity ? Number(currentStadium.capacity) : null
            }]);
        }
        
        setEditingStadiumIndex(null);
        setCurrentStadium({ name: '', type: null, capacity: null });
        setShowStadiumDialog(false);
    };

    const handleEditStadium = (index: number) => {
        setCurrentStadium(stadiums[index]);
        setEditingStadiumIndex(index);
        setShowStadiumDialog(true);
    };

    const handleDeleteStadium = (index: number) => {
        const updatedStadiums = [...stadiums];
        updatedStadiums.splice(index, 1);
        setStadiums(updatedStadiums);
    };

    // Gym Leader dialog handlers
    const handleGymLeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentGymLeader(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleGymLeaderSelectChange = (e: SelectChangeEvent<string | number>) => {
        const { name, value } = e.target;
        setCurrentGymLeader(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleGymLeaderSubmit = () => {
        if (editingGymLeaderIndex !== null) {
            // Edit existing gym leader
            const updatedGymLeaders = [...gymLeaders];
            updatedGymLeaders[editingGymLeaderIndex] = {
                ...currentGymLeader,
                trainer_id: Number(currentGymLeader.trainer_id)
            };
            setGymLeaders(updatedGymLeaders);
        } else {
            // Add new gym leader
            setGymLeaders([...gymLeaders, {
                ...currentGymLeader,
                trainer_id: Number(currentGymLeader.trainer_id)
            }]);
        }
        
        setEditingGymLeaderIndex(null);
        setCurrentGymLeader({ trainer_id: 0, badge: '', type: '' });
        setTrainerSearch(''); // Clear search when submitting
        setShowGymLeaderDialog(false);
    };

    const handleEditGymLeader = (index: number) => {
        // Ensure trainer_id is a number when editing
        setCurrentGymLeader({
            ...gymLeaders[index],
            trainer_id: Number(gymLeaders[index].trainer_id)
        });
        setEditingGymLeaderIndex(index);
        setShowGymLeaderDialog(true);
    };

    const handleDeleteGymLeader = (index: number) => {
        const updatedGymLeaders = [...gymLeaders];
        updatedGymLeaders.splice(index, 1);
        setGymLeaders(updatedGymLeaders);
    };

    // Form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting form...');
        
        // Ensure all trainer IDs are numbers
        const processedGymLeaders = gymLeaders.map(leader => ({
            ...leader,
            trainer_id: Number(leader.trainer_id)
        }));

        const updatedCity = {
            ...formData,
            region_id: formData.region_id ? Number(formData.region_id) : null,
            population: formData.population ? Number(formData.population) : null,
            stadiums: stadiums,
            gymLeaders: processedGymLeaders
        };
        
        console.log('Updated city data:', updatedCity);
        mutation.mutate({ id: id!, updatedCity });
    };

    if (isCityLoading || isRegionsLoading || isTrainersLoading) {
        return (
            <Box className="flex justify-center items-center h-full">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box className="p-6">
            <Paper className="p-6 bg-gray-800">
                <Box className="flex justify-between items-center mb-6">
                    <Typography variant="h4" className="text-white">
                        Edit City - {formData.name}
                    </Typography>
                </Box>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField
                            name="name"
                            label="City Name"
                            value={formData.name}
                            onChange={handleTextChange}
                            fullWidth
                            className="!bg-gray-700"
                            slotProps={{
                                inputLabel: { className: '!text-gray-400' },
                                input: { className: '!text-white' }
                            }}
                        />
                        <FormControl fullWidth className="!bg-gray-700">
                            <InputLabel className="!text-gray-400">Region</InputLabel>
                            <Select
                                name="region_id"
                                value={formData.region_id}
                                onChange={handleSelectChange}
                                label="Region"
                                className="text-white"
                            >
                                {regionsData?.map((region: Region) => (
                                    <MenuItem key={region.id} value={region.id.toString()}>
                                        {region.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            name="population"
                            label="Population"
                            value={formData.population}
                            onChange={handleTextChange}
                            type="number"
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
                                    value={formData.x_coordinate}
                                    fullWidth
                                    className="!bg-gray-700"
                                    slotProps={{
                                        inputLabel: { className: '!text-gray-400' },
                                        input: { 
                                            className: '!text-white',
                                            readOnly: true
                                        }
                                    }}
                                />
                            </Box>
                            <Box className="flex-1 mr-2">
                                <TextField
                                    label="Y Coordinate"
                                    value={formData.y_coordinate}
                                    fullWidth
                                    className="!bg-gray-700"
                                    slotProps={{
                                        inputLabel: { className: '!text-gray-400' },
                                        input: { 
                                            className: '!text-white',
                                            readOnly: true
                                        }
                                    }}
                                />
                            </Box>
                            <Tooltip title="Set Map Location">
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => setShowMapDialog(true)}
                                >
                                    <PlaceIcon />
                                </Button>
                            </Tooltip>
                        </Box>
                        <Box sx={{ gridColumn: '1 / -1' }}>
                            <TextField
                                name="description"
                                label="Description"
                                value={formData.description || ''}
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

                    <Divider className="my-6 bg-gray-600" />

                    {/* Stadiums Section */}
                    <Box className="mb-4">
                        <Box className="flex justify-between items-center mb-2">
                            <Typography variant="h6" className="text-white">
                                Stadiums
                            </Typography>
                            <Button
                                startIcon={<AddIcon />}
                                variant="contained"
                                color="primary"
                                onClick={() => {
                                    setCurrentStadium({ name: '', type: null, capacity: null });
                                    setShowStadiumDialog(true);
                                }}
                            >
                                Add Stadium
                            </Button>
                        </Box>
                        {stadiums.length > 0 ? (
                            <Paper className="bg-gray-700 p-3">
                                {stadiums.map((stadium, index) => (
                                    <Box key={index} className="bg-gray-800 p-3 rounded-lg flex justify-between items-center mb-2">
                                        <Box>
                                            <Typography variant="subtitle1" className="text-white">
                                                {stadium.name}
                                            </Typography>
                                            <Typography variant="body2" className="text-gray-400">
                                                Type: {stadium.type || 'Not specified'} | 
                                                Capacity: {stadium.capacity?.toLocaleString() || 'Not specified'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <IconButton 
                                                onClick={() => handleEditStadium(index)}
                                                className="text-blue-400"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton 
                                                onClick={() => handleDeleteStadium(index)}
                                                className="text-red-400"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                ))}
                            </Paper>
                        ) : (
                            <Typography className="text-gray-400">No stadiums added.</Typography>
                        )}
                    </Box>

                    <Divider className="my-6 bg-gray-600" />

                    {/* Gym Leaders Section */}
                    <Box className="mb-4">
                        <Box className="flex justify-between items-center mb-2">
                            <Typography variant="h6" className="text-white">
                                Gym Leaders
                            </Typography>
                            <Button
                                startIcon={<AddIcon />}
                                variant="contained"
                                color="primary"
                                onClick={() => {
                                    setCurrentGymLeader({ trainer_id: 0, badge: '', type: '' });
                                    setTrainerSearch(''); // Clear search when opening dialog
                                    setShowGymLeaderDialog(true);
                                }}
                            >
                                Add Gym Leader
                            </Button>
                        </Box>
                        {gymLeaders.length > 0 ? (
                            <Paper className="bg-gray-700 p-3">
                                {gymLeaders.map((leader, index) => {
                                    // Convert both IDs to numbers for consistent comparison
                                    const numericTrainerId = Number(leader.trainer_id);
                                    const trainer = trainersData?.find((t: Trainer) => Number(t.id) === numericTrainerId);
                                    console.log('Trainer lookup:', 'Trainer ID:', numericTrainerId, 'Type:', typeof numericTrainerId, 'Found trainer:', trainer); 
                                    const trainerName = trainer 
                                        ? `${trainer.fname || ''} ${trainer.lname || ''}`.trim() 
                                        : `Unknown Trainer (ID: ${numericTrainerId})`;
                                    
                                    return (
                                        <Box key={index} className="bg-gray-800 p-3 rounded-lg flex justify-between items-center mb-2">
                                            <Box>
                                                <Typography variant="subtitle1" className="text-white">
                                                    {trainerName}
                                                </Typography>
                                                <Typography variant="body2" className="text-gray-400">
                                                    Type: {leader.type} | 
                                                    Badge: {leader.badge || 'None'}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <IconButton 
                                                    onClick={() => handleEditGymLeader(index)}
                                                    className="text-blue-400"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton 
                                                    onClick={() => handleDeleteGymLeader(index)}
                                                    className="text-red-400"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Paper>
                        ) : (
                            <Typography className="text-gray-400">No gym leaders assigned.</Typography>
                        )}
                    </Box>

                    <Box className="flex justify-end gap-2 mt-6">
                        <Button 
                            onClick={() => navigate(`/cities/${id}`)}
                            variant="outlined"
                            className="text-white border-gray-500"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? <CircularProgress size={24} /> : 'Save Changes'}
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
                                className="absolute w-5 h-5 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    top: `${(1-formData.y_coordinate) * 100}%`,
                                    left: `${formData.x_coordinate * 100}%`
                                }}
                            />
                        </Box>
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

            {/* Stadium Dialog */}
            <Dialog
                open={showStadiumDialog}
                onClose={() => {
                    setShowStadiumDialog(false);
                    setEditingStadiumIndex(null);
                    setCurrentStadium({ name: '', type: null, capacity: null });
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle className="bg-gray-800 text-white">
                    {editingStadiumIndex !== null ? 'Edit Stadium' : 'Add Stadium'}
                </DialogTitle>
                <DialogContent className="bg-gray-800">
                    <Box className="pt-2 space-y-3">
                        <TextField
                            fullWidth
                            label="Stadium Name"
                            name="name"
                            value={currentStadium.name}
                            onChange={handleStadiumChange}
                            variant="outlined"
                            className="!bg-gray-700 mb-3"
                            slotProps={{
                                inputLabel: { className: '!text-gray-300' },
                                input: { className: '!text-white' }
                            }}
                        />
                        <FormControl fullWidth className="!bg-gray-700 mb-3">
                            <InputLabel id="stadium-type-label" className="!text-gray-300">Stadium Type</InputLabel>
                            <Select
                                labelId="stadium-type-label"
                                value={currentStadium.type || ''}
                                onChange={handleStadiumTypeChange}
                                label="Stadium Type"
                                className="text-white"
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {pokemonTypes.map(type => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Capacity"
                            name="capacity"
                            value={currentStadium.capacity || ''}
                            onChange={handleStadiumChange}
                            type="number"
                            variant="outlined"
                            className="!bg-gray-700"
                            slotProps={{
                                inputLabel: { className: '!text-gray-300' },
                                input: { className: '!text-white' }
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions className="bg-gray-800">
                    <Button 
                        onClick={() => {
                            setShowStadiumDialog(false);
                            setEditingStadiumIndex(null);
                            setCurrentStadium({ name: '', type: null, capacity: null });
                        }}
                        className="text-white"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleStadiumSubmit}
                        color="primary"
                        disabled={!currentStadium.name}
                    >
                        {editingStadiumIndex !== null ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Gym Leader Dialog */}
            <Dialog
                open={showGymLeaderDialog}
                onClose={() => {
                    setShowGymLeaderDialog(false);
                    setEditingGymLeaderIndex(null);
                    setCurrentGymLeader({ trainer_id: 0, badge: '', type: '' });
                    setTrainerSearch(''); // Clear search when closing dialog
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle className="bg-gray-800 text-white">
                    {editingGymLeaderIndex !== null ? 'Edit Gym Leader' : 'Add Gym Leader'}
                </DialogTitle>
                <DialogContent className="bg-gray-800">
                    <Box className="pt-2 space-y-3">
                        <FormControl fullWidth className="!bg-gray-700 mb-3">
                            <InputLabel id="trainer-label" className="!text-gray-300">Trainer</InputLabel>
                            <Select
                                labelId="trainer-label"
                                name="trainer_id"
                                value={currentGymLeader.trainer_id || ''}
                                onChange={handleGymLeaderSelectChange}
                                label="Trainer"
                                className="text-white"
                                renderValue={(selected) => {
                                    if (!trainersData) return 'Select a trainer';
                                    const selectedTrainer = trainersData.find((t: Trainer) => Number(t.id) === Number(selected));
                                    return selectedTrainer ? 
                                        `${selectedTrainer.fname || ''} ${selectedTrainer.lname || ''}`.trim() : 
                                        'Select a trainer';
                                }}
                            >
                                <MenuItem disabled value="">
                                    <Box sx={{ width: '100%' }}>
                                        <TextField
                                            placeholder="Search trainers..."
                                            size="small"
                                            fullWidth
                                            variant="outlined"
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => {
                                                setTrainerSearch(e.target.value.toLowerCase());
                                                e.stopPropagation();
                                            }}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            autoFocus
                                            InputProps={{
                                                className: 'text-white',
                                            }}
                                        />
                                    </Box>
                                </MenuItem>
                                <Divider />
                                {trainersData && trainersData.filter((trainer: Trainer) => {
                                    if (!trainerSearch) return true;
                                    
                                    // Filter trainers based on search term
                                    const trainerFullName = `${trainer.fname || ''} ${trainer.lname || ''}`.trim().toLowerCase();
                                    return trainerFullName.includes(trainerSearch);
                                }).map((trainer: Trainer) => (
                                    <MenuItem key={trainer.id} value={trainer.id}>
                                        {`${trainer.fname || ''} ${trainer.lname || ''}`.trim()}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth className="!bg-gray-700 mb-3">
                            <InputLabel id="gym-type-label" className="!text-gray-300">Type</InputLabel>
                            <Select
                                labelId="gym-type-label"
                                name="type"
                                value={currentGymLeader.type || ''}
                                onChange={handleGymLeaderSelectChange}
                                label="Type"
                                className="text-white"
                            >
                                {pokemonTypes.map(type => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Badge Name"
                            name="badge"
                            value={currentGymLeader.badge || ''}
                            onChange={handleGymLeaderChange}
                            variant="outlined"
                            className="!bg-gray-700"
                            slotProps={{
                                inputLabel: { className: '!text-gray-300' },
                                input: { className: '!text-white' }
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions className="bg-gray-800">
                    <Button 
                        onClick={() => {
                            setShowGymLeaderDialog(false);
                            setEditingGymLeaderIndex(null);
                            setCurrentGymLeader({ trainer_id: 0, badge: '', type: '' });
                        }}
                        className="text-white"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleGymLeaderSubmit}
                        color="primary"
                        disabled={!currentGymLeader.trainer_id || !currentGymLeader.type}
                    >
                        {editingGymLeaderIndex !== null ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EditCity;