import React from 'react';
import { Paper, Card, CardContent, Typography, Chip, Box } from '@mui/material';
import { Badge } from '../../types/tournament';

interface TournamentBadgesProps {
    badges: Badge[];
}

const TournamentBadges: React.FC<TournamentBadgesProps> = ({ badges }) => {
    if (!badges || badges.length === 0) {
        return (
            <Paper className="p-6">
                <Typography className="text-gray-400">No badges awarded by this tournament.</Typography>
            </Paper>
        );
    }

    const getCategoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'gym':
                return '!bg-blue-900 !text-blue-200';
            case 'tournament':
                return '!bg-purple-900 !text-purple-200';
            case 'conference':
                return '!bg-orange-900 !text-orange-200';
            case 'league':
                return '!bg-red-900 !text-red-200';
            case 'honor':
                return '!bg-yellow-900 !text-yellow-200';
            default:
                return '!bg-gray-700 !text-gray-200';
        }
    };

    return (
        <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {badges.map((badge) => (
                <Card key={badge.id} className="!bg-gray-800 hover:!bg-gray-750 transition-colors h-full">
                        <CardContent>
                            <Box className="flex justify-between items-start mb-3">
                                <Typography variant="h6" className="text-white font-bold">
                                    {badge.name}
                                </Typography>
                                <Chip
                                    label={badge.category}
                                    size="small"
                                    className={getCategoryColor(badge.category)}
                                />
                            </Box>
                            <Typography variant="caption" className="text-gray-500 block mb-2">
                                Code: {badge.code}
                            </Typography>
                            {badge.description && (
                                <Typography variant="body2" className="text-gray-300 mb-3">
                                    {badge.description}
                                </Typography>
                            )}
                            {badge.region_name && (
                                <Box className="mt-2">
                                    <Typography variant="caption" className="text-gray-500">
                                        Region:
                                    </Typography>
                                    <Typography variant="body2" className="text-blue-400">
                                        {badge.region_name}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
            ))}
        </Box>
    );
};

export default TournamentBadges;
