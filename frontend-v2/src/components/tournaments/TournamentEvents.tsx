import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    CircularProgress,
    Box,
    Chip,
} from '@mui/material';
import axios from 'axios';
import { TournamentEvent } from '../../types/tournament';

interface TournamentEventsProps {
    tournamentId: string;
}

const fetchTournamentEvents = async (tournamentId: string): Promise<TournamentEvent[]> => {
    const { data } = await axios.get(`http://localhost:5000/tournaments/${tournamentId}/events`);
    return data.data;
};

const TournamentEvents: React.FC<TournamentEventsProps> = ({ tournamentId }) => {
    const { data: events, isLoading, error } = useQuery({
        queryKey: ['tournament-events', tournamentId],
        queryFn: () => fetchTournamentEvents(tournamentId),
    });

    if (isLoading) {
        return (
            <Box className="flex justify-center items-center p-6">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Paper className="p-6">
                <Typography color="error">Error loading tournament events.</Typography>
            </Paper>
        );
    }

    if (!events || events.length === 0) {
        return (
            <Paper className="p-6">
                <Typography className="text-gray-400">
                    No events scheduled for this tournament yet.
                </Typography>
            </Paper>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return '!bg-green-900 !text-green-200';
            case 'ongoing':
                return '!bg-blue-900 !text-blue-200';
            case 'scheduled':
                return '!bg-yellow-900 !text-yellow-200';
            case 'cancelled':
                return '!bg-red-900 !text-red-200';
            default:
                return '!bg-gray-700 !text-gray-200';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <Paper>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell className="!text-white !font-semibold">Edition</TableCell>
                            <TableCell className="!text-white !font-semibold">Start Date</TableCell>
                            <TableCell className="!text-white !font-semibold">End Date</TableCell>
                            <TableCell className="!text-white !font-semibold">Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {events.map((event) => (
                            <TableRow key={event.id} hover className="hover:!bg-gray-700">
                                <TableCell className="!text-white">
                                    <Typography variant="body2" className="font-semibold">
                                        {event.edition_label}
                                    </Typography>
                                </TableCell>
                                <TableCell className="!text-white">{formatDate(event.start_date)}</TableCell>
                                <TableCell className="!text-white">
                                    {event.end_date ? formatDate(event.end_date) : (
                                        <span className="text-gray-500">TBD</span>
                                    )}
                                </TableCell>
                                <TableCell className="!text-white">
                                    <Chip
                                        label={event.status}
                                        size="small"
                                        className={getStatusColor(event.status)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default TournamentEvents;
