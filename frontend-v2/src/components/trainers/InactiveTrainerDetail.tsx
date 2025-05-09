import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Paper, Button } from '@mui/material';
import { TrainerData } from '../../types/trainer';

interface InactiveTrainerDetailProps {
    trainerData: TrainerData;
}

const InactiveTrainerDetail: React.FC<InactiveTrainerDetailProps> = ({ trainerData }) => {
    const { id } = useParams<{ id: string }>();
    const { trainer, hometowns } = trainerData;

    return (
        <Box className="!p-6">
            <Paper className="!p-6 !bg-gray-800">
                <Box className="!flex !justify-between !items-center !mb-6">
                    <Typography variant="h4" className="!text-white">
                        {trainer.fname} {trainer.lname}
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

                <Box className="!flex !flex-wrap">
                    <Box className="!w-full md:!w-1/3 !pr-4">
                        <Box className="!flex !flex-wrap">
                            {/* Profile Picture Placeholder */}
                            <Box className="!w-1/2 !pr-4">
                                <div 
                                    className="!w-full !aspect-square !bg-gray-700 !rounded-lg"
                                    style={{ minHeight: '200px' }}
                                />
                            </Box>
                            {/* Trainer Details */}
                            <Box className="!w-1/2">
                                <Typography variant="subtitle1" className="!text-gray-400">
                                    Title: {trainer.title || 'None'}
                                </Typography>
                                <Typography variant="subtitle1" className="!text-gray-400">
                                    Birthdate: {trainer.birthdate || 'Unknown'}
                                </Typography>
                                <Typography variant="subtitle1" className="!text-gray-400">
                                    Region:{' '}
                                    <Link 
                                        to={`/regions/${trainer.region_id}`}
                                        className="!text-blue-400 hover:!text-blue-300 !no-underline"
                                    >
                                        {trainer.region_name}
                                    </Link>
                                </Typography>
                                <Typography variant="subtitle1" className="!text-gray-400">
                                    Hometowns:
                                </Typography>
                                <ul className="!list-none !pl-0">
                                    {hometowns.map((hometown, index) => (
                                        <li key={index} className="!text-gray-400">
                                            <Link 
                                                to={`/regions/${hometown.region_id}`}
                                                className="!text-blue-400 hover:!text-blue-300 !no-underline"
                                            >
                                                {hometown.region_name}
                                            </Link>
                                            {' - '}
                                            <Link 
                                                to={`/cities/${hometown.city_id}`}
                                                className="!text-blue-400 hover:!text-blue-300 !no-underline"
                                            >
                                                {hometown.city_name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </Box>
                        </Box>
                    </Box>

                    <Box className="!w-full md:!w-1/3 !flex !flex-col !items-start">
                        <Typography variant="subtitle1" className="!text-gray-400">
                            Peak Rank
                        </Typography>
                        <Typography variant="h4" className="!text-white">
                            {trainer.peak_rank || 'N/A'}
                        </Typography>
                        <Typography variant="subtitle1" className="!text-gray-400 !mt-4">
                            Peak Rating
                        </Typography>
                        <Typography variant="h4" className="!text-white">
                            {trainer.peak_rating ? trainer.peak_rating.toFixed(2) : 'N/A'}
                        </Typography>
                    </Box>

                    <Box className="!w-full md:!w-1/3">
                        
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default InactiveTrainerDetail; 