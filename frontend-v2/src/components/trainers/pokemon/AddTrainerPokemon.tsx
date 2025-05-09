import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
    Box,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Paper,
    SelectChangeEvent,
} from '@mui/material';
import { Pokemon, PokemonSpecies, Nature } from '../../../types/pokemon';

const fetchPokemonSpecies = async (): Promise<PokemonSpecies[]> => {
    const { data } = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=151');
    const speciesPromises = data.results.map((result: any) => 
        axios.get(result.url).then((res: any) => res.data)
    );
    return Promise.all(speciesPromises);
};

const fetchNatures = async (): Promise<Nature[]> => {
    const { data } = await axios.get('https://pokeapi.co/api/v2/nature');
    const naturePromises = data.results.map((result: any) => 
        axios.get(result.url).then((res: any) => res.data)
    );
    return Promise.all(naturePromises);
};

const AddTrainerPokemon: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        species_id: '',
        pokemon_id: '',
        level: 1,
        ot_name: '',
        nature_id: '',
        hp_iv: 31,
        attack_iv: 31,
        defense_iv: 31,
        special_attack_iv: 31,
        special_defense_iv: 31,
        speed_iv: 31,
        hp_ev: 0,
        attack_ev: 0,
        defense_ev: 0,
        special_attack_ev: 0,
        special_defense_ev: 0,
        speed_ev: 0,
        level_met_at: 1,
        location_met_at: '',
        date_met_at: new Date().toISOString().split('T')[0],
    });

    const { data: species, isLoading: isLoadingSpecies } = useQuery({
        queryKey: ['pokemonSpecies'],
        queryFn: fetchPokemonSpecies,
    });

    const { data: natures, isLoading: isLoadingNatures } = useQuery({
        queryKey: ['natures'],
        queryFn: fetchNatures,
    });

    const addPokemonMutation = useMutation({
        mutationFn: (data: any) => axios.post(`/api/trainers/${id}/pokemon`, data),
        onSuccess: () => {
            navigate(`/trainers/${id}/pokemon`);
        },
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSelectChange = (e: SelectChangeEvent) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addPokemonMutation.mutate(formData);
    };

    if (isLoadingSpecies || isLoadingNatures) {
        return <div>Loading...</div>;
    }

    return (
        <Box className="!p-6">
            <Typography variant="h5" className="!mb-6">Add New Pokémon</Typography>
            <Paper className="!p-6">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <FormControl fullWidth>
                                <InputLabel>Species</InputLabel>
                                <Select
                                    name="species_id"
                                    value={formData.species_id}
                                    onChange={handleSelectChange}
                                    required
                                >
                                    {species?.map((s) => (
                                        <MenuItem key={s.id} value={s.id}>
                                            {s.name.charAt(0).toUpperCase() + s.name.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>
                        <div>
                            <TextField
                                fullWidth
                                label="Pokémon ID"
                                name="pokemon_id"
                                value={formData.pokemon_id}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div>
                            <TextField
                                fullWidth
                                type="number"
                                label="Level"
                                name="level"
                                value={formData.level}
                                onChange={handleInputChange}
                                inputProps={{ min: 1, max: 100 }}
                                required
                            />
                        </div>
                        <div>
                            <TextField
                                fullWidth
                                label="OT Name"
                                name="ot_name"
                                value={formData.ot_name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div>
                            <FormControl fullWidth>
                                <InputLabel>Nature</InputLabel>
                                <Select
                                    name="nature_id"
                                    value={formData.nature_id}
                                    onChange={handleSelectChange}
                                    required
                                >
                                    {natures?.map((n) => (
                                        <MenuItem key={n.id} value={n.id}>
                                            {n.name.charAt(0).toUpperCase() + n.name.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <Typography variant="h6" className="!mb-4">Individual Values (IVs)</Typography>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {['hp', 'attack', 'defense', 'special_attack', 'special_defense', 'speed'].map((stat) => (
                                    <div key={stat}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label={`${stat.charAt(0).toUpperCase() + stat.slice(1)} IV`}
                                            name={`${stat}_iv`}
                                            value={formData[`${stat}_iv` as keyof typeof formData]}
                                            onChange={handleInputChange}
                                            inputProps={{ min: 0, max: 31 }}
                                            required
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <Typography variant="h6" className="!mb-4">Effort Values (EVs)</Typography>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {['hp', 'attack', 'defense', 'special_attack', 'special_defense', 'speed'].map((stat) => (
                                    <div key={stat}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label={`${stat.charAt(0).toUpperCase() + stat.slice(1)} EV`}
                                            name={`${stat}_ev`}
                                            value={formData[`${stat}_ev` as keyof typeof formData]}
                                            onChange={handleInputChange}
                                            inputProps={{ min: 0, max: 252 }}
                                            required
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <Typography variant="h6" className="!mb-4">Met Information</Typography>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Level Met At"
                                        name="level_met_at"
                                        value={formData.level_met_at}
                                        onChange={handleInputChange}
                                        inputProps={{ min: 1, max: 100 }}
                                        required
                                    />
                                </div>
                                <div>
                                    <TextField
                                        fullWidth
                                        label="Location Met At"
                                        name="location_met_at"
                                        value={formData.location_met_at}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Date Met At"
                                        name="date_met_at"
                                        value={formData.date_met_at}
                                        onChange={handleInputChange}
                                        InputLabelProps={{ shrink: true }}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <Box className="!flex !justify-end !gap-4">
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate(`/trainers/${id}/pokemon`)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={addPokemonMutation.isPending}
                                >
                                    {addPokemonMutation.isPending ? 'Adding...' : 'Add Pokémon'}
                                </Button>
                            </Box>
                        </div>
                    </div>
                </form>
            </Paper>
        </Box>
    );
};

export default AddTrainerPokemon; 