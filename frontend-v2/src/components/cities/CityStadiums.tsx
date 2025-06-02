import React from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Typography } from '@mui/material';
import { Stadium } from '../../types/city';

type Order = 'asc' | 'desc';

interface HeadCell {
    id: keyof Stadium;
    label: string;
    numeric: boolean;
}

const headCells: HeadCell[] = [
    { id: 'name', numeric: false, label: 'Stadium Name' },
    { id: 'type', numeric: false, label: 'Type' },
    { id: 'capacity', numeric: true, label: 'Capacity' },
];

interface CityStadiumsProps {
    stadiums: Stadium[];
}

const CityStadiums: React.FC<CityStadiumsProps> = ({ stadiums }) => {
    const [order, setOrder] = React.useState<Order>('asc');
    const [orderBy, setOrderBy] = React.useState<keyof Stadium | null>('name');

    const handleRequestSort = (property: keyof Stadium) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedStadiums = React.useMemo(() => {
        if (!orderBy) return stadiums;
        return [...stadiums].sort((a, b) => {
            const aValue = a[orderBy];
            const bValue = b[orderBy];
            
            // Handle null values for sorting
            if (aValue === null && bValue === null) return 0;
            if (aValue === null) return order === 'asc' ? 1 : -1;
            if (bValue === null) return order === 'asc' ? -1 : 1;
            
            if (order === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
            }
        });
    }, [stadiums, order, orderBy]);

    if (stadiums.length === 0) {
        return (
            <Paper className="p-6">
                <Typography variant="h5" className="mb-4 text-white">Stadiums</Typography>
                <Typography className="text-gray-400">No stadiums in this city.</Typography>
            </Paper>
        );
    }

    return (
        <Paper className="p-6">
            <Typography variant="h5" className="mb-4 text-white">Stadiums</Typography>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            {headCells.map((headCell) => (
                                <TableCell
                                    key={headCell.id}
                                    className="!text-white"
                                >
                                    <TableSortLabel
                                        active={orderBy === headCell.id}
                                        direction={orderBy === headCell.id ? order : 'asc'}
                                        onClick={() => handleRequestSort(headCell.id)}
                                        className="!text-white"
                                    >
                                        {headCell.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedStadiums.map((stadium) => (
                            <TableRow
                                key={stadium.id}
                                hover
                                className="hover:!bg-gray-700"
                            >
                                <TableCell className="!text-white">
                                    {stadium.name}
                                </TableCell>
                                <TableCell className="!text-white">
                                    {stadium.type || '-'}
                                </TableCell>
                                <TableCell className="!text-white">
                                    {stadium.capacity ? stadium.capacity.toLocaleString() : '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default CityStadiums;
