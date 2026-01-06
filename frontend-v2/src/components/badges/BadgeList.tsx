import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TablePagination,
    TextField,
    Button,
    Chip,
} from '@mui/material';
import axios from 'axios';
import { Badge } from '../../types/badge';

const fetchBadges = async (): Promise<Badge[]> => {
    const { data } = await axios.get('http://localhost:5000/badges');
    return data.data;
};

type Order = 'asc' | 'desc';

interface HeadCell {
    id: keyof Badge;
    label: string;
    numeric: boolean;
}

const headCells: HeadCell[] = [
    { id: 'name', numeric: false, label: 'Badge Name' },
    { id: 'category', numeric: false, label: 'Category' },
    { id: 'region_name', numeric: false, label: 'Region' },
    { id: 'tournament_name', numeric: false, label: 'Tournament' },
    { id: 'trainer_count', numeric: true, label: 'Trainers' },
];

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

const BadgeList: React.FC = () => {
    const { data: badges, isLoading, error } = useQuery({
        queryKey: ['badges'],
        queryFn: fetchBadges,
    });

    const [order, setOrder] = React.useState<Order>('asc');
    const [orderBy, setOrderBy] = React.useState<keyof Badge>('name');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(25);
    const [pageInput, setPageInput] = React.useState('');

    const handleRequestSort = (property: keyof Badge) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handlePageJump = () => {
        const pageNumber = parseInt(pageInput);
        const maxPage = Math.ceil(sortedBadges.length / rowsPerPage) - 1;
        if (pageNumber >= 1 && pageNumber <= maxPage + 1) {
            setPage(pageNumber - 1);
            setPageInput('');
        }
    };

    const handlePageInputKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handlePageJump();
        }
    };

    const sortedBadges = React.useMemo(() => {
        if (!badges) return [];
        return [...badges].sort((a, b) => {
            const aValue = a[orderBy];
            const bValue = b[orderBy];
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;
            if (order === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
            }
        });
    }, [badges, order, orderBy]);

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
                <Typography color="error">Error fetching badges data.</Typography>
            </Box>
        );
    }

    return (
        <Box className="!p-6">
            <Typography variant="h4" className="!text-white !mb-6">
                Badges
            </Typography>

            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                {headCells.map((headCell) => (
                                    <TableCell
                                        key={headCell.id}
                                        align={headCell.numeric ? 'right' : 'left'}
                                        sortDirection={orderBy === headCell.id ? order : false}
                                        className="!text-gray-400 !font-bold"
                                    >
                                        <TableSortLabel
                                            active={orderBy === headCell.id}
                                            direction={orderBy === headCell.id ? order : 'asc'}
                                            onClick={() => handleRequestSort(headCell.id)}
                                            className="!text-gray-400"
                                        >
                                            {headCell.label}
                                        </TableSortLabel>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedBadges
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((badge) => (
                                <TableRow
                                    key={badge.id}
                                    className="hover:!bg-gray-700 !cursor-pointer"
                                    component={Link}
                                    to={`/badges/${badge.id}`}
                                    sx={{ textDecoration: 'none' }}
                                >
                                    <TableCell className="!text-white">
                                        {badge.name}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={badge.category}
                                            size="small"
                                            className={getCategoryColor(badge.category)}
                                        />
                                    </TableCell>
                                    <TableCell className="!text-white">
                                        {badge.region_name || '-'}
                                    </TableCell>
                                    <TableCell className="!text-white">
                                        {badge.tournament_name || '-'}
                                    </TableCell>
                                    <TableCell align="right" className="!text-white">
                                        {badge.trainer_count}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box className="!flex !items-center !justify-between !border-t !border-gray-700">
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        component="div"
                        count={sortedBadges.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        className="!text-white"
                    />
                    <Box className="!flex !items-center !gap-2 !pr-4">
                        <TextField
                            size="small"
                            placeholder="Page"
                            value={pageInput}
                            onChange={(e) => setPageInput(e.target.value)}
                            onKeyPress={handlePageInputKeyPress}
                            type="number"
                            inputProps={{ 
                                min: 1, 
                                max: Math.ceil(sortedBadges.length / rowsPerPage) 
                            }}
                            sx={{
                                width: '80px',
                                '& .MuiInputBase-input': { color: 'white' },
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: 'gray' },
                                    '&:hover fieldset': { borderColor: 'lightgray' },
                                },
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handlePageJump}
                            size="small"
                            className="!bg-blue-600 hover:!bg-blue-700"
                        >
                            Go
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default BadgeList;
