import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Box,
    Typography,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
} from '@mui/material';
import axios from 'axios';
import { TournamentTemplate } from '../../types/tournament';

const fetchTournaments = async (): Promise<TournamentTemplate[]> => {
    const { data } = await axios.get('http://localhost:5000/tournaments');
    return data.data;
};

const TournamentList: React.FC = () => {
    const { data: tournaments, isLoading, error } = useQuery({
        queryKey: ['tournaments'],
        queryFn: fetchTournaments,
    });

    if (isLoading) {
        return (
            <Box className="flex justify-center items-center h-full">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box className="flex justify-center items-center h-full">
                <Typography color="error">Error loading tournaments.</Typography>
            </Box>
        );
    }

    return (
        <Box className="p-6">
            <Typography variant="h4" className="text-white mb-6">
                Tournaments
            </Typography>
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell className="!text-white !font-semibold">Name</TableCell>
                                <TableCell className="!text-white !font-semibold">Region</TableCell>
                                <TableCell className="!text-white !font-semibold">Frequency</TableCell>
                                <TableCell className="!text-white !font-semibold">Team Type</TableCell>
                                <TableCell className="!text-white !font-semibold">Rule Set</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tournaments?.map((tournament) => (
                                <TableRow
                                    key={tournament.id}
                                    hover
                                    className="hover:!bg-gray-700"
                                >
                                    <TableCell className="!text-white">
                                        <Link
                                            to={`/tournaments/${tournament.id}`}
                                            className="text-blue-400 hover:text-blue-300 no-underline transition-colors"
                                        >
                                            {tournament.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="!text-white">
                                        {tournament.region_name ? (
                                            <Link
                                                to={`/regions/${tournament.region_id}`}
                                                className="text-blue-400 hover:text-blue-300 no-underline transition-colors"
                                            >
                                                {tournament.region_name}
                                            </Link>
                                        ) : (
                                            <span className="text-gray-500">Global</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="!text-white">
                                        <Chip
                                            label={tournament.frequency}
                                            size="small"
                                            className="!bg-blue-900 !text-blue-200"
                                        />
                                    </TableCell>
                                    <TableCell className="!text-white">
                                        <Chip
                                            label={tournament.team_type}
                                            size="small"
                                            className="!bg-purple-900 !text-purple-200"
                                        />
                                    </TableCell>
                                    <TableCell className="!text-white">
                                        {tournament.default_rule_set_name || (
                                            <span className="text-gray-500">N/A</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default TournamentList;
