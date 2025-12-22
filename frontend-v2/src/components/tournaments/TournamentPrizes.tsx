import React from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
} from '@mui/material';
import { Prize } from '../../types/tournament';

interface TournamentPrizesProps {
    prizes: Prize[];
}

const TournamentPrizes: React.FC<TournamentPrizesProps> = ({ prizes }) => {
    if (!prizes || prizes.length === 0) {
        return (
            <Paper className="p-6">
                <Typography className="text-gray-400">No prizes configured for this tournament.</Typography>
            </Paper>
        );
    }

    const getPrizeTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'cash':
                return '!bg-green-900 !text-green-200';
            case 'points':
                return '!bg-blue-900 !text-blue-200';
            case 'item':
                return '!bg-purple-900 !text-purple-200';
            default:
                return '!bg-gray-700 !text-gray-200';
        }
    };

    const formatPrizeValue = (type: string, value: number) => {
        switch (type.toLowerCase()) {
            case 'cash':
                return `₽${value.toLocaleString()}`;
            case 'points':
                return `${value.toLocaleString()} pts`;
            default:
                return value.toString();
        }
    };

    const getPositionLabel = (position: number) => {
        if (position === 1) return '🥇 1st Place';
        if (position === 2) return '🥈 2nd Place';
        if (position === 3) return '🥉 3rd Place';
        return `${position}th Place`;
    };

    return (
        <Paper>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell className="!text-white !font-semibold">Position</TableCell>
                            <TableCell className="!text-white !font-semibold">Prize Type</TableCell>
                            <TableCell className="!text-white !font-semibold">Value</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {prizes.map((prize) => (
                            <TableRow key={prize.id} hover className="hover:!bg-gray-700">
                                <TableCell className="!text-white">
                                    <Typography variant="body2" className="font-semibold">
                                        {getPositionLabel(prize.position)}
                                    </Typography>
                                </TableCell>
                                <TableCell className="!text-white">
                                    <Chip
                                        label={prize.prize_type}
                                        size="small"
                                        className={getPrizeTypeColor(prize.prize_type)}
                                    />
                                </TableCell>
                                <TableCell className="!text-white">
                                    <Typography variant="body2" className="font-semibold text-green-400">
                                        {formatPrizeValue(prize.prize_type, prize.value)}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default TournamentPrizes;
