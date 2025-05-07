import React from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Grid } from '@mui/material';
import { GymLeader } from '../../types/region';

interface RegionLeagueProps {
    champion: string | null;
    eliteFour: string[];
    gymLeaders: GymLeader[];
}

const RegionLeague: React.FC<RegionLeagueProps> = ({ champion, eliteFour, gymLeaders }) => {
    return (
        <Box className="space-y-8">
            {/* Champion Section */}
            {champion && (
                <Paper className="p-6 bg-gray-800">
                    <Typography variant="h5" className="text-center mb-4 text-white">
                        Champion
                    </Typography>
                    <Typography variant="h6" className="text-center text-yellow-400">
                        {champion}
                    </Typography>
                </Paper>
            )}

            {/* Elite Four Section */}
            {eliteFour.length > 0 && (
                <Paper className="p-6">
                    <Typography variant="h5" className="text-center mb-4 text-white">
                        Elite Four
                    </Typography>
                    <Grid container spacing={2} className="justify-center">
                        {eliteFour.map((member, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                                <Box className="text-center p-4 rounded">
                                    <Typography className="text-white">
                                        {member}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}

            {/* Gym Leaders Section */}
            {gymLeaders.length > 0 && (
                <Paper className="p-6">
                    <Typography variant="h5" className="mb-4 text-white">
                        Gym Leaders
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell className="text-white">Name</TableCell>
                                    <TableCell className="text-white">Type</TableCell>
                                    <TableCell className="text-white">City</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {gymLeaders.map((leader) => (
                                    <TableRow key={leader.name} hover>
                                        <TableCell className="text-white">{leader.name}</TableCell>
                                        <TableCell className="text-white">{leader.type}</TableCell>
                                        <TableCell className="text-white">{leader.city_name}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
        </Box>
    );
};

export default RegionLeague; 