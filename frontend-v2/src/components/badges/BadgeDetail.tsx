import React from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { BadgeDetail as BadgeDetailType } from '../../types/badge';

const fetchBadgeDetail = async (id: string): Promise<BadgeDetailType> => {
    const { data } = await axios.get(`http://localhost:5000/badges/${id}`);
    return data.data;
};

type Order = 'asc' | 'desc';

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

const BadgeDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: badgeData, isLoading, error } = useQuery({
        queryKey: ['badge', id],
        queryFn: () => fetchBadgeDetail(id!),
        enabled: !!id,
    });

    const [order, setOrder] = React.useState<Order>('desc');
    const [orderBy, setOrderBy] = React.useState<'pwtr_rating' | 'awarded_at'>('pwtr_rating');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(25);
    const [pageInput, setPageInput] = React.useState('');

    const handleRequestSort = (property: 'pwtr_rating' | 'awarded_at') => {
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
        const maxPage = Math.ceil(sortedTrainers.length / rowsPerPage) - 1;
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

    const sortedTrainers = React.useMemo(() => {
        if (!badgeData?.trainers) return [];
        return [...badgeData.trainers].sort((a, b) => {
            let aValue: number | string = 0;
            let bValue: number | string = 0;

            if (orderBy === 'pwtr_rating') {
                aValue = a.pwtr_rating ?? 0;
                bValue = b.pwtr_rating ?? 0;
            } else {
                aValue = a.awarded_at;
                bValue = b.awarded_at;
            }

            if (order === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
            }
        });
    }, [badgeData?.trainers, order, orderBy]);

    if (isLoading) {
        return (
            <Box className="!flex !justify-center !items-center !h-full">
                <CircularProgress />
            </Box>
        );
    }

    if (error || !badgeData) {
        return (
            <Box className="!flex !justify-center !items-center !h-full">
                <Typography color="error">Badge not found</Typography>
            </Box>
        );
    }

    const { badge, trainers } = badgeData;

    return (
        <Box className="!p-6">
            <Paper className="!p-6 !bg-gray-800 !mb-6">
                <Box className="!flex !justify-between !items-start !mb-4">
                    <Typography variant="h4" className="!text-white">
                        {badge.name}
                    </Typography>
                    <Chip
                        label={badge.category}
                        className={getCategoryColor(badge.category)}
                    />
                </Box>

                <Typography variant="body2" className="!text-gray-400 !mb-4">
                    Code: {badge.code}
                </Typography>

                {badge.description && (
                    <Typography variant="body1" className="!text-gray-300 !mb-4">
                        {badge.description}
                    </Typography>
                )}

                <Box className="!flex !gap-6 !flex-wrap">
                    {badge.region_name && (
                        <Box>
                            <Typography variant="caption" className="!text-gray-500">
                                Region
                            </Typography>
                            <Typography variant="body2" className="!text-white">
                                <Link
                                    to={`/regions/${badge.region_id}`}
                                    className="!text-blue-400 hover:!text-blue-300 !no-underline"
                                >
                                    {badge.region_name}
                                </Link>
                            </Typography>
                        </Box>
                    )}

                    {badge.tournament_name && (
                        <Box>
                            <Typography variant="caption" className="!text-gray-500">
                                Tournament
                            </Typography>
                            <Typography variant="body2" className="!text-white">
                                <Link
                                    to={`/tournaments/${badge.tournament_template_id}`}
                                    className="!text-blue-400 hover:!text-blue-300 !no-underline"
                                >
                                    {badge.tournament_name}
                                </Link>
                            </Typography>
                        </Box>
                    )}

                    {badge.tournament_frequency && (
                        <Box>
                            <Typography variant="caption" className="!text-gray-500">
                                Frequency
                            </Typography>
                            <Typography variant="body2" className="!text-white">
                                {badge.tournament_frequency}
                            </Typography>
                        </Box>
                    )}

                    {badge.tournament_team_type && (
                        <Box>
                            <Typography variant="caption" className="!text-gray-500">
                                Team Type
                            </Typography>
                            <Typography variant="body2" className="!text-white">
                                {badge.tournament_team_type}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Paper>

            <Typography variant="h5" className="!text-white !mb-4">
                Trainers with this badge ({trainers.length})
            </Typography>

            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell className="!text-gray-400 !font-bold">
                                    Trainer
                                </TableCell>
                                <TableCell className="!text-gray-400 !font-bold">
                                    Region
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sortDirection={orderBy === 'pwtr_rating' ? order : false}
                                    className="!text-gray-400 !font-bold"
                                >
                                    <TableSortLabel
                                        active={orderBy === 'pwtr_rating'}
                                        direction={orderBy === 'pwtr_rating' ? order : 'asc'}
                                        onClick={() => handleRequestSort('pwtr_rating')}
                                        className="!text-gray-400"
                                    >
                                        Rating
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sortDirection={orderBy === 'awarded_at' ? order : false}
                                    className="!text-gray-400 !font-bold"
                                >
                                    <TableSortLabel
                                        active={orderBy === 'awarded_at'}
                                        direction={orderBy === 'awarded_at' ? order : 'asc'}
                                        onClick={() => handleRequestSort('awarded_at')}
                                        className="!text-gray-400"
                                    >
                                        Awarded Date
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell className="!text-gray-400 !font-bold">
                                    Event
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedTrainers
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((trainer) => (
                                <TableRow
                                    key={trainer.trainer_id}
                                    className="hover:!bg-gray-700 !cursor-pointer"
                                    component={Link}
                                    to={`/trainers/${trainer.trainer_id}`}
                                    sx={{ textDecoration: 'none' }}
                                >
                                    <TableCell className="!text-white">
                                        {trainer.fname} {trainer.lname}
                                    </TableCell>
                                    <TableCell className="!text-white">
                                        {trainer.region_name}
                                    </TableCell>
                                    <TableCell align="right" className="!text-white">
                                        {trainer.pwtr_rating?.toFixed(2) ?? 'Unrated'}
                                    </TableCell>
                                    <TableCell align="right" className="!text-white">
                                        {new Date(trainer.awarded_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="!text-white">
                                        {trainer.event_edition || '-'}
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
                        count={sortedTrainers.length}
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
                                max: Math.ceil(sortedTrainers.length / rowsPerPage) 
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

export default BadgeDetail;
