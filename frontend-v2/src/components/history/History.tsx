import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, CircularProgress, Typography } from '@mui/material';
import axios from 'axios';
import RecentPokemon from './RecentPokemon';
import EventHistoryTab from './EventHistory';
import TravelLog from './TravelLog';
import { Paper, Tabs, Tab } from '@mui/material';
import { GameState } from '../../types/gamestate';

const fetchGameState = async (): Promise<GameState> => {
    const { data } = await axios.get('http://localhost:5000/game_state/home');
    return data.data;
};

const History: React.FC = () => {
    const [activeTab, setActiveTab] = React.useState(0);

    const { data: gameState, isLoading, error } = useQuery<GameState>({
        queryKey: ['gameState'],
        queryFn: fetchGameState,
    });

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    if (isLoading) {
        return (
            <Box className="flex justify-center items-center h-full">
                <CircularProgress />
            </Box>
        );
    }

    if (error || !gameState) {
        return (
            <Box className="flex justify-center items-center h-full">
                <Typography color="error">Error loading game state</Typography>
            </Box>
        );
    }

    const trainerId = gameState.active_trainer_id?.toString();

    if (!trainerId) {
        return (
            <Box className="flex justify-center items-center h-full">
                <Typography color="error">No active trainer found</Typography>
            </Box>
        );
    }

    return (
        <Box className="p-6">
            <Paper className="p-6 mb-6">
                <Typography variant="h4" className="mb-2 text-white">
                    {gameState.trainer_fname} {gameState.trainer_lname}'s History
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
                {activeTab === 0 && <RecentPokemon trainerId={trainerId} />}
                {activeTab === 1 && <EventHistoryTab trainerId={trainerId} />}
                {activeTab === 2 && <TravelLog trainerId={trainerId} />}
            </Box>
        </Box>
    );
};

export default History;
