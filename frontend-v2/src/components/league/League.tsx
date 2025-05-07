import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, CircularProgress } from '@mui/material';
import { LeagueData } from '../../types/league';
import axios from 'axios';

const fetchLeagueData = async (): Promise<LeagueData> => {
    const { data } = await axios.get('http://localhost:5000/league');
    return data.data;
};

const League: React.FC = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['leagueData'],
        queryFn: fetchLeagueData
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
                <Typography color="error">Error fetching league data</Typography>
            </Box>
        );
    }

    const leagueData = data as LeagueData;
    const getFirstName = (name: string) => name.split(' ')[0];

    return (
        <Box className="p-6">
            {/* Grand Champion Section */}
            <Paper className="p-6 mb-6 bg-gray-800">
                <Typography variant="h4" className="text-center mb-2 text-white">
                    Grand Champion
                </Typography>
                <Typography variant="h5" className="text-center text-blue-400">
                    {leagueData.grandChampion.name}
                </Typography>
            </Paper>

            {/* League Table */}
            <TableContainer component={Paper} className="bg-gray-800">
                <Table>
                    <TableHead>
                        <TableRow>
                            {leagueData.champions.map((champion) => (
                                <TableCell key={champion.region} className="text-center border-b border-gray-700">
                                    <Typography variant="h6" className="text-white">
                                        {champion.region}
                                    </Typography>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {/* Champions Row */}
                        <TableRow>
                            {leagueData.champions.map((champion) => (
                                <TableCell key={champion.id} className="text-center border-b border-gray-700">
                                    <Typography className="text-yellow-400 font-bold">
                                        {getFirstName(champion.name)}
                                    </Typography>
                                </TableCell>
                            ))}
                        </TableRow>

                        {/* Elite Four Row */}
                        <TableRow>
                            {leagueData.eliteFour.map((eliteGroup) => (
                                <TableCell key={eliteGroup.region} className="text-center">
                                    <Box className="space-y-1">
                                        {eliteGroup.eliteFour.map((member) => (
                                            <Typography key={member.id} className="text-white">
                                                {getFirstName(member.name)}
                                            </Typography>
                                        ))}
                                    </Box>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default League; 