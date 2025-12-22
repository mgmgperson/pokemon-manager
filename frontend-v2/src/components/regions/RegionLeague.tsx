import React from 'react';
import { Link } from 'react-router-dom';
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Grid } from '@mui/material';
import { GymLeader, ChampionInfo, EliteFourMember } from '../../types/region';

interface RegionLeagueProps {
    champion: ChampionInfo | null;
    eliteFour: EliteFourMember[];
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
                    <Link to={`/trainers/${champion.id}`} className="no-underline">
                        <Typography variant="h6" className="text-center text-yellow-400 hover:text-yellow-300 transition-colors">
                            {champion.name}
                        </Typography>
                    </Link>
                </Paper>
            )}

            {/* Elite Four Section */}
            {eliteFour.length > 0 && (
                <Paper className="p-6">
                    <Typography variant="h5" className="text-center mb-4 text-white">
                        Elite Four
                    </Typography>
                    <Grid container spacing={2} className="justify-center">
                        {eliteFour.map((member) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={member.id}>
                                <Link to={`/trainers/${member.id}`} className="no-underline">
                                    <Box className="text-center p-4 rounded hover:bg-gray-700 transition-colors">
                                        <Typography className="text-white">
                                            {member.name}
                                        </Typography>
                                    </Box>
                                </Link>
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
                                    <TableRow key={leader.id} hover>
                                        <TableCell className="text-white">
                                            <Link to={`/trainers/${leader.id}`} className="no-underline text-white hover:text-blue-400 transition-colors">
                                                {leader.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-white">{leader.type}</TableCell>
                                        <TableCell className="text-white">
                                            <Link to={`/cities/${leader.city_id}`} className="no-underline text-white hover:text-blue-400 transition-colors">
                                                {leader.city_name}
                                            </Link>
                                        </TableCell>
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