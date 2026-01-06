import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Paper, CircularProgress, Card, CardContent, Chip } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import axios from 'axios';
import { MatchHistory } from '../../types/history';

interface EventHistoryProps {
    trainerId: string;
}

const fetchMatchHistory = async (trainerId: string): Promise<MatchHistory[]> => {
    const { data } = await axios.get(`http://localhost:5000/history/matches/${trainerId}`);
    return data.data;
};

const EventHistoryTab: React.FC<EventHistoryProps> = ({ trainerId }) => {
    const { data: matches, isLoading, error } = useQuery({
        queryKey: ['history-matches', trainerId],
        queryFn: () => fetchMatchHistory(trainerId),
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
                <Typography color="error">Error loading match history.</Typography>
            </Paper>
        );
    }

    if (!matches || matches.length === 0) {
        return (
            <Paper className="p-6">
                <Typography className="text-gray-400 text-center">
                    No match history found.
                </Typography>
            </Paper>
        );
    }

    return (
        <Box className="space-y-4">
            {matches.map((match) => {
                // Determine if this trainer won
                const isWinner = match.winner_id && (
                    (match.winner_fname === match.trainer_a_fname && match.winner_lname === match.trainer_a_lname) ||
                    (match.winner_fname === match.trainer_b_fname && match.winner_lname === match.trainer_b_lname)
                );

                return (
                    <Card key={match.match_id} className="bg-gray-800">
                        <CardContent>
                            <Box className="flex items-start justify-between mb-3">
                                <Box className="flex-1">
                                    <Box className="flex items-center gap-2 mb-2">
                                        <Typography variant="h6" className="text-white">
                                            {match.tournament_name} - {match.tournament_edition}
                                        </Typography>
                                        {isWinner && (
                                            <Chip
                                                icon={<EmojiEventsIcon className="!text-white" />}
                                                label="Victory"
                                                size="small"
                                                className="!bg-green-700 !text-white"
                                            />
                                        )}
                                        {match.winner_id && !isWinner && (
                                            <Chip
                                                label="Defeat"
                                                size="small"
                                                className="!bg-red-700 !text-white"
                                            />
                                        )}
                                        {!match.winner_id && (
                                            <Chip
                                                label="Scheduled"
                                                size="small"
                                                className="!bg-gray-600 !text-white"
                                            />
                                        )}
                                    </Box>
                                    <Typography variant="body2" className="text-gray-400 mb-2">
                                        Round {match.round}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                <Box>
                                    <Typography variant="caption" className="text-gray-500">
                                        Participants
                                    </Typography>
                                    <Typography variant="body2" className="text-white">
                                        {match.trainer_a_fname} {match.trainer_a_lname}
                                    </Typography>
                                    <Typography variant="body2" className="text-gray-400">
                                        vs
                                    </Typography>
                                    <Typography variant="body2" className="text-white">
                                        {match.trainer_b_fname} {match.trainer_b_lname}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" className="text-gray-500">
                                        Venue
                                    </Typography>
                                    <Typography variant="body2" className="text-white">
                                        {match.stadium_name}
                                    </Typography>
                                    <Typography variant="caption" className="text-gray-400">
                                        {match.stadium_type}
                                    </Typography>
                                    <Typography variant="caption" className="text-gray-400">
                                        {match.city_name}, {match.region_name}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" className="text-gray-500">
                                        Scheduled
                                    </Typography>
                                    <Typography variant="body2" className="text-white">
                                        {new Date(match.scheduled_at).toLocaleString()}
                                    </Typography>
                                </Box>
                            </Box>

                            {match.winner_fname && match.winner_lname && (
                                <Box className="p-3 bg-gray-900 rounded">
                                    <Typography variant="caption" className="text-gray-500">
                                        Winner
                                    </Typography>
                                    <Typography variant="body2" className="text-white">
                                        {match.winner_fname} {match.winner_lname}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </Box>
    );
};

export default EventHistoryTab;
