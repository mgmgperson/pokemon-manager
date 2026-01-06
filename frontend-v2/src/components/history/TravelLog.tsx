import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Paper, CircularProgress, Card, CardContent } from '@mui/material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import axios from 'axios';
import { TravelLog as TravelLogType } from '../../types/history';

interface TravelLogProps {
    trainerId: string;
}

const fetchTravelLog = async (trainerId: string): Promise<TravelLogType[]> => {
    const { data } = await axios.get(`http://localhost:5000/history/travel/${trainerId}`);
    return data.data;
};

const TravelLog: React.FC<TravelLogProps> = ({ trainerId }) => {
    const { data: travelLog, isLoading, error } = useQuery({
        queryKey: ['history-travel', trainerId],
        queryFn: () => fetchTravelLog(trainerId),
    });

    if (isLoading) {
        return (
            <Box className="flex justify-center items-center p-8">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Paper className="p-6">
                <Typography color="error">Error loading travel history.</Typography>
            </Paper>
        );
    }

    if (!travelLog || travelLog.length === 0) {
        return (
            <Paper className="p-6">
                <Typography className="text-gray-400 text-center">
                    No travel history found.
                </Typography>
            </Paper>
        );
    }

    return (
        <Box className="space-y-4">
            {travelLog.map((travel) => (
                <Card key={travel.id} className="bg-gray-800 hover:bg-gray-700 transition-colors">
                    <CardContent>
                        <Box className="flex items-center justify-between mb-4">
                            <Typography variant="h6" className="text-white">
                                Journey
                            </Typography>
                            <Typography variant="caption" className="text-gray-500">
                                {new Date(travel.departure_time).toLocaleDateString()}
                            </Typography>
                        </Box>

                        <Box className="space-y-4">
                            {/* Departure */}
                            <Box className="flex items-start gap-3">
                                <FlightTakeoffIcon className="text-green-500 mt-1" />
                                <Box className="flex-1">
                                    <Typography variant="subtitle2" className="text-green-400 mb-1">
                                        Departure
                                    </Typography>
                                    <Typography variant="body1" className="text-white font-semibold">
                                        {travel.from_location_name}
                                    </Typography>
                                    <Typography variant="body2" className="text-gray-400">
                                        {travel.from_region_name}
                                    </Typography>
                                    <Typography variant="caption" className="text-gray-500 block mt-1">
                                        {new Date(travel.departure_time).toLocaleString()}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Arrow/Divider */}
                            <Box className="flex items-center justify-center">
                                <Box className="w-full h-px bg-gray-700 relative">
                                    <Box className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 px-2">
                                        <Typography className="text-gray-500">↓</Typography>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Arrival */}
                            <Box className="flex items-start gap-3">
                                <FlightLandIcon className="text-blue-500 mt-1" />
                                <Box className="flex-1">
                                    <Typography variant="subtitle2" className="text-blue-400 mb-1">
                                        Arrival
                                    </Typography>
                                    <Typography variant="body1" className="text-white font-semibold">
                                        {travel.to_location_name}
                                    </Typography>
                                    <Typography variant="body2" className="text-gray-400">
                                        {travel.to_region_name}
                                    </Typography>
                                    <Typography variant="caption" className="text-gray-500 block mt-1">
                                        {new Date(travel.arrival_time).toLocaleString()}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Notes */}
                            {travel.notes && (
                                <Box className="mt-3 p-3 bg-gray-900 rounded">
                                    <Typography variant="caption" className="text-gray-500">
                                        Notes
                                    </Typography>
                                    <Typography variant="body2" className="text-white">
                                        {travel.notes}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            ))}
        </Box>
    );
};

export default TravelLog;
