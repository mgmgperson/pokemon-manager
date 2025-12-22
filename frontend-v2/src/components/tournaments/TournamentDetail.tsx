import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Tabs, Tab, Paper, CircularProgress, Chip } from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { type TournamentDetail } from '../../types/tournament';
import TournamentStages from './TournamentStages';
import TournamentQualifications from './TournamentQualifications';
import TournamentPrizes from './TournamentPrizes';
import TournamentBadges from './TournamentBadges';
import TournamentEvents from './TournamentEvents';

const fetchTournament = async (id: string): Promise<TournamentDetail> => {
    const { data } = await axios.get(`http://localhost:5000/tournaments/${id}`);
    return data.data;
};

const TournamentDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = React.useState(0);

    const { data: tournament, isLoading, error } = useQuery({
        queryKey: ['tournament', id],
        queryFn: () => fetchTournament(id!),
        enabled: !!id,
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
                <Typography color="error">Error loading tournament data.</Typography>
            </Box>
        );
    }

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Box className="p-6">
            <Paper className="p-6 mb-6">
                <Typography variant="h4" className="mb-2 text-white">
                    {tournament?.name}
                </Typography>
                <Typography variant="body1" className="text-gray-400 mb-4">
                    {tournament?.description}
                </Typography>
                <Box className="flex gap-4 flex-wrap">
                    {tournament?.region_name && (
                        <Box>
                            <Typography variant="caption" className="text-gray-500">
                                Region
                            </Typography>
                            <Typography variant="body2" className="text-white">
                                <Link
                                    to={`/regions/${tournament.region_id}`}
                                    className="text-blue-400 hover:text-blue-300 no-underline transition-colors"
                                >
                                    {tournament.region_name}
                                </Link>
                            </Typography>
                        </Box>
                    )}
                    <Box>
                        <Typography variant="caption" className="text-gray-500">
                            Frequency
                        </Typography>
                        <Typography variant="body2" className="text-white">
                            <Chip
                                label={tournament?.frequency}
                                size="small"
                                className="!bg-blue-900 !text-blue-200"
                            />
                        </Typography>
                    </Box>
                    {tournament?.start_month && (
                        <Box>
                            <Typography variant="caption" className="text-gray-500">
                                Start Month
                            </Typography>
                            <Typography variant="body2" className="text-white">
                                {new Date(0, tournament.start_month - 1).toLocaleString('default', {
                                    month: 'long',
                                })}
                            </Typography>
                        </Box>
                    )}
                    <Box>
                        <Typography variant="caption" className="text-gray-500">
                            Team Type
                        </Typography>
                        <Typography variant="body2" className="text-white">
                            <Chip
                                label={tournament?.team_type}
                                size="small"
                                className="!bg-purple-900 !text-purple-200"
                            />
                        </Typography>
                    </Box>
                    {tournament?.default_rule_set_name && (
                        <Box>
                            <Typography variant="caption" className="text-gray-500">
                                Default Rule Set
                            </Typography>
                            <Typography variant="body2" className="text-white">
                                {tournament.default_rule_set_name}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Paper>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }} className="mb-4">
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    textColor="primary"
                    indicatorColor="primary"
                    className="text-white"
                >
                    <Tab label="Stages" className="text-white" />
                    <Tab label="Qualifications" className="text-white" />
                    <Tab label="Prizes" className="text-white" />
                    <Tab label="Badges" className="text-white" />
                    <Tab label="Events" className="text-white" />
                </Tabs>
            </Box>

            <Box className="mt-4">
                {activeTab === 0 && tournament && <TournamentStages stages={tournament.stages} />}
                {activeTab === 1 && tournament && (
                    <TournamentQualifications qualifications={tournament.qualifications} />
                )}
                {activeTab === 2 && tournament && <TournamentPrizes prizes={tournament.prizes} />}
                {activeTab === 3 && tournament && <TournamentBadges badges={tournament.badges} />}
                {activeTab === 4 && id && <TournamentEvents tournamentId={id} />}
            </Box>
        </Box>
    );
};

export default TournamentDetailPage;
