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
import { QualificationRule } from '../../types/tournament';

interface TournamentQualificationsProps {
    qualifications: QualificationRule[];
}

const TournamentQualifications: React.FC<TournamentQualificationsProps> = ({ qualifications }) => {
    if (!qualifications || qualifications.length === 0) {
        return (
            <Paper className="p-6">
                <Typography className="text-gray-400">
                    No qualification requirements for this tournament.
                </Typography>
            </Paper>
        );
    }

    const getCriterionTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'badge_count':
                return '!bg-yellow-900 !text-yellow-200';
            case 'rating':
                return '!bg-blue-900 !text-blue-200';
            case 'age':
                return '!bg-green-900 !text-green-200';
            case 'region':
                return '!bg-purple-900 !text-purple-200';
            default:
                return '!bg-gray-700 !text-gray-200';
        }
    };

    const formatCriterionType = (type: string) => {
        return type
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <Paper>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell className="!text-white !font-semibold">Criterion</TableCell>
                            <TableCell className="!text-white !font-semibold">Value</TableCell>
                            <TableCell className="!text-white !font-semibold">Notes</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {qualifications.map((qual) => (
                            <TableRow key={qual.id} hover className="hover:!bg-gray-700">
                                <TableCell className="!text-white">
                                    <Chip
                                        label={formatCriterionType(qual.criterion_type)}
                                        size="small"
                                        className={getCriterionTypeColor(qual.criterion_type)}
                                    />
                                </TableCell>
                                <TableCell className="!text-white">
                                    <Typography variant="body2" className="font-semibold">
                                        {qual.value}
                                    </Typography>
                                </TableCell>
                                <TableCell className="!text-white">
                                    {qual.notes || <span className="text-gray-500">—</span>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default TournamentQualifications;
