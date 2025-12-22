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
import { StageTemplate } from '../../types/tournament';

interface TournamentStagesProps {
    stages: StageTemplate[];
}

const TournamentStages: React.FC<TournamentStagesProps> = ({ stages }) => {
    if (!stages || stages.length === 0) {
        return (
            <Paper className="p-6">
                <Typography className="text-gray-400">No stages configured for this tournament.</Typography>
            </Paper>
        );
    }

    const getStageTypeColor = (stageType: string) => {
        switch (stageType.toLowerCase()) {
            case 'group':
                return '!bg-green-900 !text-green-200';
            case 'single elimination':
                return '!bg-red-900 !text-red-200';
            case 'double elimination':
                return '!bg-orange-900 !text-orange-200';
            case 'swiss':
                return '!bg-blue-900 !text-blue-200';
            default:
                return '!bg-gray-700 !text-gray-200';
        }
    };

    return (
        <Paper>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell className="!text-white !font-semibold">Stage</TableCell>
                            <TableCell className="!text-white !font-semibold">Type</TableCell>
                            <TableCell className="!text-white !font-semibold">Participants</TableCell>
                            <TableCell className="!text-white !font-semibold">Groups</TableCell>
                            <TableCell className="!text-white !font-semibold">Best Of</TableCell>
                            <TableCell className="!text-white !font-semibold">Rule Set</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stages.map((stage) => (
                            <TableRow key={stage.id} hover className="hover:!bg-gray-700">
                                <TableCell className="!text-white">
                                    <Typography variant="body2" className="font-semibold">
                                        Stage {stage.seq}
                                    </Typography>
                                </TableCell>
                                <TableCell className="!text-white">
                                    <Chip
                                        label={stage.stage_type}
                                        size="small"
                                        className={getStageTypeColor(stage.stage_type)}
                                    />
                                </TableCell>
                                <TableCell className="!text-white">
                                    {stage.participants || <span className="text-gray-500">N/A</span>}
                                </TableCell>
                                <TableCell className="!text-white">
                                    {stage.groups || <span className="text-gray-500">N/A</span>}
                                </TableCell>
                                <TableCell className="!text-white">
                                    <Chip
                                        label={`Bo${stage.best_of}`}
                                        size="small"
                                        className="!bg-purple-900 !text-purple-200"
                                    />
                                </TableCell>
                                <TableCell className="!text-white">
                                    {stage.rule_set_name || <span className="text-gray-500">Default</span>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default TournamentStages;
