import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Paper, Typography, Box, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel } from '@mui/material';
import { Region } from '../../types/region';
import axios from 'axios';
import { Link } from 'react-router-dom';

const fetchRegions = async (): Promise<Region[]> => {
    const { data } = await axios.get('http://localhost:5000/regions');
    return data.data;
};

type Order = 'asc' | 'desc';

interface HeadCell {
    id: keyof Region;
    label: string;
    numeric: boolean;
}

const headCells: HeadCell[] = [
    { id: 'name', numeric: false, label: 'Name' },
    { id: 'population', numeric: true, label: 'Population' },
];

const RegionList: React.FC = () => {
    const { data: regions, isLoading, error } = useQuery({
        queryKey: ['regions'],
        queryFn: fetchRegions,
    });

    const [order, setOrder] = React.useState<Order>('asc');
    const [orderBy, setOrderBy] = React.useState<keyof Region | null>(null);

    const handleRequestSort = (property: keyof Region) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortedRegions = React.useMemo(() => {
        if (!regions || !orderBy) return regions || [];
        return [...regions].sort((a, b) => {
            const aValue = a[orderBy];
            const bValue = b[orderBy];
            if (aValue === null || bValue === null) return 0;
            if (order === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
            }
        });
    }, [regions, order, orderBy]);

    if (isLoading) {
        return (
            <Box className="!flex !justify-center !items-center !h-full">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box className="!flex !justify-center !items-center !h-full">
                <Typography color="error">Error fetching regions data.</Typography>
            </Box>
        );
    }

    return (
        <Box className="!p-6">
            <Typography variant="h4" className="!text-white !mb-6">
                Regions
            </Typography>
            <Paper>
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
                            {sortedRegions.map((region) => (
                                <TableRow
                                    key={region.id}
                                    hover
                                    className="hover:!bg-gray-700"
                                >
                                    <TableCell className="!text-white">
                                        <Link 
                                            to={`/regions/${region.id}`}
                                            className="!text-blue-400 hover:!text-blue-300 !no-underline"
                                        >
                                            {region.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="!text-white">
                                        {region.population?.toLocaleString() ?? '0'}
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

export default RegionList; 