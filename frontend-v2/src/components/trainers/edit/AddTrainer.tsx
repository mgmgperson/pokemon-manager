import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Typography, Paper, CircularProgress, TextField, Button, MenuItem, FormControl, InputLabel, Select, SelectChangeEvent } from '@mui/material';
import axios from 'axios';

const fetchRegions = async () => {
    const { data } = await axios.get('http://localhost:5000/regions');
    return data.data;
};

const addTrainer = async (newTrainer: any) => {
    const { data } = await axios.post('http://localhost:5000/trainers', newTrainer);
    return data;
};

const AddTrainer: React.FC = () => {
    const navigate = useNavigate();
    const { data: regionsData, isLoading: isRegionsLoading } = useQuery({
        queryKey: ['regions'],
        queryFn: fetchRegions,
    });

    const mutation = useMutation({
        mutationFn: addTrainer,
        onSuccess: () => {
            navigate('/trainers');
        },
        onError: (error) => {
            console.error('Error adding trainer:', error);
        },
    });

    const [formData, setFormData] = useState({
        fname: '',
        lname: '',
        region_id: '',
        birthdate: '',
        pwtr_rating: '',
        peak_rating: '',
        peak_rank: '',
        active_status: 1,
    });

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (e: SelectChangeEvent<string | number>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newTrainer = {
            ...formData,
            region_id: formData.region_id ? Number(formData.region_id) : null,
            pwtr_rating: formData.pwtr_rating ? Number(formData.pwtr_rating) : null,
            peak_rating: formData.peak_rating ? Number(formData.peak_rating) : null,
            peak_rank: formData.peak_rank ? Number(formData.peak_rank) : null,
        };
        mutation.mutate(newTrainer);
    };

    if (isRegionsLoading) {
        return (
            <Box className="!flex !justify-center !items-center !h-full">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box className="!p-6">
            <Paper className="!p-6 !bg-gray-800">
                <Typography variant="h4" className="!text-white !mb-6">
                    Add New Trainer
                </Typography>
                <form onSubmit={handleSubmit} className="!space-y-4">
                    <Box className="!grid !grid-cols-1 md:!grid-cols-2 !gap-4">
                        <TextField
                            name="fname"
                            label="First Name"
                            value={formData.fname}
                            onChange={handleTextChange}
                            fullWidth
                            className="!bg-gray-700"
                            InputLabelProps={{ className: '!text-gray-400' }}
                            InputProps={{ className: '!text-white' }}
                        />
                        <TextField
                            name="lname"
                            label="Last Name"
                            value={formData.lname}
                            onChange={handleTextChange}
                            fullWidth
                            className="!bg-gray-700"
                            InputLabelProps={{ className: '!text-gray-400' }}
                            InputProps={{ className: '!text-white' }}
                        />
                        <TextField
                            name="birthdate"
                            label="Birthdate"
                            type="date"
                            value={formData.birthdate}
                            onChange={handleTextChange}
                            fullWidth
                            className="!bg-gray-700"
                            InputLabelProps={{ className: '!text-gray-400' }}
                            InputProps={{ className: '!text-white' }}
                        />
                        <FormControl fullWidth className="!bg-gray-700">
                            <InputLabel className="!text-gray-400">Region</InputLabel>
                            <Select
                                name="region_id"
                                value={formData.region_id}
                                onChange={handleSelectChange}
                                label="Region"
                                className="!text-white"
                            >
                                {regionsData?.map((region: any) => (
                                    <MenuItem key={region.id} value={region.id}>
                                        {region.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            name="pwtr_rating"
                            label="PWTR Rating"
                            type="number"
                            value={formData.pwtr_rating}
                            onChange={handleTextChange}
                            fullWidth
                            className="!bg-gray-700"
                            InputLabelProps={{ className: '!text-gray-400' }}
                            InputProps={{ className: '!text-white' }}
                        />
                        <TextField
                            name="peak_rating"
                            label="Peak Rating"
                            type="number"
                            value={formData.peak_rating}
                            onChange={handleTextChange}
                            fullWidth
                            className="!bg-gray-700"
                            InputLabelProps={{ className: '!text-gray-400' }}
                            InputProps={{ className: '!text-white' }}
                        />
                        <TextField
                            name="peak_rank"
                            label="Peak Rank"
                            type="number"
                            value={formData.peak_rank}
                            onChange={handleTextChange}
                            fullWidth
                            className="!bg-gray-700"
                            InputLabelProps={{ className: '!text-gray-400' }}
                            InputProps={{ className: '!text-white' }}
                        />
                        <FormControl fullWidth className="!bg-gray-700">
                            <InputLabel className="!text-gray-400">Active Status</InputLabel>
                            <Select
                                name="active_status"
                                value={formData.active_status}
                                onChange={handleSelectChange}
                                label="Active Status"
                                className="!text-white"
                            >
                                <MenuItem value={1}>Active</MenuItem>
                                <MenuItem value={0}>Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box className="!flex !justify-end !mt-6">
                        <Button
                            type="submit"
                            variant="contained"
                            className="!bg-blue-600 hover:!bg-blue-700"
                        >
                            Add Trainer
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default AddTrainer; 