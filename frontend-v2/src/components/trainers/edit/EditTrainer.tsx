import type { TrainerData } from '../../../types/trainer';
import { TrainerPeakEstimateFields } from '../TrainerPeakEstimates';
import type { Region } from '../../../types/region';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Typography, Paper, CircularProgress, Alert, TextField, Button, MenuItem, FormControl, InputLabel, Select, SelectChangeEvent } from '@mui/material';
import axios from 'axios';

const fetchTrainer = async (id: string): Promise<TrainerData> => {
    const { data } = await axios.get(`http://localhost:5000/trainers/${id}`);
    return data.data;
};

const fetchRegions = async (): Promise<Pick<Region, 'id' | 'name'>[]> => {
    const { data } = await axios.get('http://localhost:5000/regions');
    return data.data;
};

const updateTrainer = async ({ id, updatedTrainer }: { id: string, updatedTrainer: Record<string, string | number | null> }) => {
    const { data } = await axios.put(`http://localhost:5000/trainers/${id}`, updatedTrainer);
    return data;
};

const EditTrainer: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: trainerData, isLoading: isTrainerLoading } = useQuery({
        queryKey: ['trainer', id],
        queryFn: () => fetchTrainer(id!),
    });

    const { data: regionsData, isLoading: isRegionsLoading } = useQuery({
        queryKey: ['regions'],
        queryFn: fetchRegions,
    });

    const mutation = useMutation({
        mutationFn: updateTrainer,
        onSuccess: () => {
            navigate(`/trainers/${id}`);
        },
        onError: (error) => {
            console.error('Error updating trainer:', error);
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
        active_status: '1',
        estimated_peak_ability: '',
        estimated_peak_ability_year: '',
    });

    useEffect(() => {
        if (trainerData?.trainer) {
            const trainer = trainerData.trainer;
            setFormData({
                fname: trainer.fname || '',
                lname: trainer.lname || '',
                region_id: String(trainer.region_id ?? ''),
                birthdate: trainer.birthdate || '',
                pwtr_rating: String(trainer.pwtr_rating ?? ''),
                peak_rating: String(trainer.peak_rating ?? ''),
                peak_rank: String(trainer.peak_rank ?? ''),
                active_status: trainer.active_status == null ? '' : String(Number(trainer.active_status)),
                estimated_peak_ability: String(trainer.estimated_peak_ability ?? ''),
                estimated_peak_ability_year: String(trainer.estimated_peak_ability_year ?? ''),
            });
        }
    }, [trainerData]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: String(value)
        }));
    };

    const handleSelectChange = (e: SelectChangeEvent<string | number>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: String(value)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedTrainer = {
            ...formData,
            active_status: formData.active_status === '' ? null : Number(formData.active_status),
            estimated_peak_ability: formData.estimated_peak_ability === '' ? null : Number(formData.estimated_peak_ability),
            estimated_peak_ability_year: formData.estimated_peak_ability_year === '' ? null : Number(formData.estimated_peak_ability_year),
            region_id: formData.region_id ? Number(formData.region_id) : null,
            pwtr_rating: formData.pwtr_rating ? Number(formData.pwtr_rating) : null,
            peak_rating: formData.peak_rating ? Number(formData.peak_rating) : null,
            peak_rank: formData.peak_rank ? Number(formData.peak_rank) : null,
        };
        mutation.mutate({ id: id!, updatedTrainer });
    };

    if (isTrainerLoading || isRegionsLoading) {
        return (
            <Box className="!flex !justify-center !items-center !h-full">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box className="!p-6">
            <Paper className="!p-6 !bg-gray-800">
                <Box className="!flex !justify-between !items-center !mb-6">
                    <Typography variant="h4" className="!text-white">
                        Edit Trainer - {formData.fname} {formData.lname}
                    </Typography>
                    <Box className="!flex !gap-2">
                        <Button
                            component={Link}
                            to={`/trainers/${id}`}
                            variant="contained"
                            className="!bg-sky-300 hover:!bg-sky-400"
                        >
                            Overview
                        </Button>
                        <Button
                            component={Link}
                            to={`/trainers/${id}/pokemon`}
                            variant="contained"
                            className="!bg-sky-300 hover:!bg-sky-400"
                        >
                            Pokemon
                        </Button>
                        <Button
                            component={Link}
                            to={`/trainers/${id}/ratings`}
                            variant="contained"
                            className="!bg-sky-300 hover:!bg-sky-400"
                        >
                            Past Ratings
                        </Button>
                        <Button
                            component={Link}
                            to={`/edit_trainer/${id}`}
                            variant="contained"
                            className="!bg-sky-300 hover:!bg-sky-400"
                        >
                            Edit
                        </Button>
                    </Box>
                </Box>

                {mutation.isError && <Alert severity="error">{axios.isAxiosError(mutation.error)
                    ? mutation.error.response?.data?.error ?? mutation.error.message : 'Unable to save trainer'}</Alert>}
                <form onSubmit={handleSubmit} className="!space-y-4">
                    <Box className="!grid !grid-cols-1 md:!grid-cols-2 !gap-4">
                        <TextField
                            name="fname"
                            label="First Name"
                            value={formData.fname}
                            onChange={handleTextChange}
                            fullWidth
                            className="!bg-gray-700"
                            slotProps={{
                                inputLabel: { className: '!text-gray-400' },
                                input: { className: '!text-white' }
                            }}
                        />
                        <TextField
                            name="lname"
                            label="Last Name"
                            value={formData.lname}
                            onChange={handleTextChange}
                            fullWidth
                            className="!bg-gray-700"
                            slotProps={{
                                inputLabel: { className: '!text-gray-400' },
                                input: { className: '!text-white' }
                            }}
                        />
                        <TextField
                            name="birthdate"
                            label="Birthdate"
                            type="date"
                            value={formData.birthdate}
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
                            name="pwtr_rating"
                            label="PWTR Rating"
                            type="number"
                            value={formData.pwtr_rating}
                            onChange={handleTextChange}
                            fullWidth
                            className="!bg-gray-700"
                            slotProps={{
                                inputLabel: { className: '!text-gray-400' },
                                input: { className: '!text-white' }
                            }}
                        />
                        <TextField
                            name="peak_rating"
                            label="Peak Rating"
                            type="number"
                            value={formData.peak_rating}
                            onChange={handleTextChange}
                            fullWidth
                            className="!bg-gray-700"
                            slotProps={{
                                inputLabel: { className: '!text-gray-400' },
                                input: { className: '!text-white' }
                            }}
                        />
                        <TextField
                            name="peak_rank"
                            label="Peak Rank"
                            type="number"
                            value={formData.peak_rank}
                            onChange={handleTextChange}
                            fullWidth
                            className="!bg-gray-700"
                            slotProps={{
                                inputLabel: { className: '!text-gray-400' },
                                input: { className: '!text-white' }
                            }}
                        />
                        <TrainerPeakEstimateFields
                            ability={formData.estimated_peak_ability === '' ? null : Number(formData.estimated_peak_ability)}
                            year={formData.estimated_peak_ability_year === '' ? null : Number(formData.estimated_peak_ability_year)}
                            onAbility={(value) => setFormData(previous => ({ ...previous, estimated_peak_ability: value === null ? '' : String(value) }))}
                            onYear={(value) => setFormData(previous => ({ ...previous, estimated_peak_ability_year: value === null ? '' : String(value) }))}
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
                    <Box className="!flex !justify-between !mt-6">
                        <Box className="!flex !gap-2">
                            <Button
                                component={Link}
                                to={`/edit_trainer/${id}/field_ratings`}
                                variant="contained"
                                className="!bg-sky-300 hover:!bg-sky-400"
                            >
                                Edit Field Ratings
                            </Button>
                            <Button
                                component={Link}
                                to={`/edit_trainer/${id}/mental_ratings`}
                                variant="contained"
                                className="!bg-sky-300 hover:!bg-sky-400"
                            >
                                Edit Mental Ratings
                            </Button>
                            <Button
                                component={Link}
                                to={`/edit_trainer/${id}/format_ratings`}
                                variant="contained"
                                className="!bg-sky-300 hover:!bg-sky-400"
                            >
                                Edit Format Ratings
                            </Button>
                        </Box>
                        <Box className="!flex !gap-2">
                            <Button
                                type="submit"
                                variant="contained"
                                className="!bg-sky-300 hover:!bg-sky-400"
                            >
                                Save Changes
                            </Button>
                        </Box>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default EditTrainer; 