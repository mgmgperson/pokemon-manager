import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Typography, Paper, CircularProgress, TextField, Button } from '@mui/material';
import axios from 'axios';

const fetchTrainer = async (id: string) => {
    const { data } = await axios.get(`http://localhost:5000/trainers/${id}`);
    return data.data;
};

const updateMentalRating = async ({ id, updatedMentalRatings }: { id: string; updatedMentalRatings: any }) => {
    const { data } = await axios.put(`http://localhost:5000/trainers/${id}/mental_ratings`, updatedMentalRatings);
    return data;
};

const generateMentalRatings = async (id: number) => {
    const { data } = await axios.get(`http://localhost:5000/randomize/generate-mental-ratings/${id}`);
    return data;
};

const EditMentalRating: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: trainerData, isLoading } = useQuery({
        queryKey: ['trainer', id],
        queryFn: () => fetchTrainer(id!),
    });

    const [updatedRatings, setUpdatedRatings] = useState<any>(null);

    useEffect(() => {
        if (trainerData?.mental_rating) {
            setUpdatedRatings(trainerData.mental_rating);
        }
    }, [trainerData]);

    const mutation = useMutation({
        mutationFn: updateMentalRating,
        onSuccess: () => {
            navigate(`/trainers/${id}`);
        },
        onError: (error) => {
            console.error('Failed to update mental ratings', error);
        },
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUpdatedRatings({ ...updatedRatings, [name]: Number(value) });
    };

    const handleRandomize = async () => {
        try {
            const generatedRatings = await generateMentalRatings(parseInt(id!, 10));
            setUpdatedRatings(generatedRatings);
        } catch (error) {
            console.error('Failed to generate mental ratings', error);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (updatedRatings) {
            mutation.mutate({ id: id!, updatedMentalRatings: updatedRatings });
        }
    };

    if (isLoading) {
        return (
            <Box className="!flex !justify-center !items-center !h-full">
                <CircularProgress />
            </Box>
        );
    }

    const trainer = trainerData?.trainer;
    const trainerName = trainer ? `${trainer.fname} ${trainer.lname}` : '';

    return (
        <Box className="!p-6">
            <Paper className="!p-6 !bg-gray-800">
                <Box className="!flex !justify-between !items-center !mb-6">
                    <Typography variant="h4" className="!text-white">
                        Edit Mental Ratings - {trainerName}
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

                <form onSubmit={handleSubmit}>
                    <Box className="!grid !grid-cols-1 md:!grid-cols-3 !gap-4">
                        {updatedRatings &&
                            Object.entries(updatedRatings).map(([key, value]) => {
                                if (key !== 'id' && key !== 'rating_id') {
                                    return (
                                        <TextField
                                            key={key}
                                            name={key}
                                            label={key.replace(/_/g, ' ').replace('mental rating', '').trim()}
                                            type="number"
                                            value={value || ''}
                                            onChange={handleInputChange}
                                            fullWidth
                                            className="!bg-gray-700"
                                            slotProps={{
                                                inputLabel: { className: '!text-gray-400' },
                                                input: { className: '!text-white' }
                                            }}
                                        />
                                    );
                                }
                                return null;
                            })}
                    </Box>
                    <Box className="!flex !justify-between !mt-6">
                        <Box className="!flex !gap-2">
                            <Button
                                component={Link}
                                to={`/edit_trainer/${id}`}
                                variant="contained"
                                className="!bg-sky-300 hover:!bg-sky-400"
                            >
                                Edit Trainer
                            </Button>
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
                                to={`/edit_trainer/${id}/format_ratings`}
                                variant="contained"
                                className="!bg-sky-300 hover:!bg-sky-400"
                            >
                                Edit Format Ratings
                            </Button>
                        </Box>
                        <Box className="!flex !gap-2">
                            <Button
                                type="button"
                                variant="contained"
                                onClick={handleRandomize}
                                className="!bg-sky-300 hover:!bg-sky-400"
                            >
                                Randomize Ratings
                            </Button>
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

export default EditMentalRating; 