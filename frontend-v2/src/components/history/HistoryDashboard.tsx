import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Tabs, Tab, Paper, CircularProgress } from '@mui/material';
import axios from 'axios';
import RecentPokemon from './RecentPokemon';
import EventHistoryTab from './EventHistory';
import TravelLog from './TravelLog';

const HistoryDashboard: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = React.useState(0);

    // Fetch trainer name for header
    const { data: trainer, isLoading: trainerLoading } = useQuery({
        queryKey: ['trainer', id],
        queryFn: async () => {
            const { data } = await axios.get(`http://localhost:5000/trainers/${id}`);
            return data.data;
        },
        enabled: !!id,
    });

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    if (trainerLoading) {
        return (
            <Box className="flex justify-center items-center h-full">
                <CircularProgress />
            </Box>
        );
    }

    if (!id) {
        return (
            <Box className="flex justify-center items-center h-full">
                <Typography color="error">Trainer ID not found</Typography>
            </Box>
        );
    }

    return (
        <Box className="p-6">
            <Paper className="p-6 mb-6">
                <Typography variant="h4" className="mb-2 text-white">
                    {trainer ? `${trainer.fname} ${trainer.lname}` : 'Trainer'} - History
                </Typography>
                <Typography variant="subtitle1" className="text-gray-400">
                    View travel logs, event history, and recent Pokémon captures
                </Typography>
            </Paper>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }} className="mb-4">
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    textColor="primary"
                    indicatorColor="primary"
                    className="text-white"
                >
                    <Tab label="Recent Pokémon" className="text-white" />
                    <Tab label="Event History" className="text-white" />
                    <Tab label="Travel Log" className="text-white" />
                </Tabs>
            </Box>

            <Box className="mt-4">
                {activeTab === 0 && <RecentPokemon trainerId={id} />}
                {activeTab === 1 && <EventHistoryTab trainerId={id} />}
                {activeTab === 2 && <TravelLog trainerId={id} />}
            </Box>
        </Box>
    );
};

export default HistoryDashboard;
