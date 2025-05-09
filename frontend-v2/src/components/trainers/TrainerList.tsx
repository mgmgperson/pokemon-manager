import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Paper, Typography, Box, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TablePagination } from '@mui/material';
import { Trainer } from '../../types/trainer';
import axios from 'axios';
import { Link } from 'react-router-dom';

const fetchTrainers = async (): Promise<Trainer[]> => {
    const { data } = await axios.get('http://localhost:5000/trainers');
    return data.data.filter((trainer: Trainer) => trainer.pwtr_rating !== null)
        .map((trainer: Trainer, index: number) => ({
            ...trainer,
            rank: index + 1,
        }));
};

type Order = 'asc' | 'desc';

interface HeadCell {
    id: keyof Trainer;
    label: string;
    numeric: boolean;
}

const headCells: HeadCell[] = [
    { id: 'rank', numeric: true, label: 'Rank' },
    { id: 'fname', numeric: false, label: 'Name' },
    { id: 'pwtr_rating', numeric: true, label: 'Rating' },
    { id: 'region_name', numeric: false, label: 'Region' },
    { id: 'title', numeric: false, label: 'Title' },
];

const TrainerList: React.FC = () => {
    const { data: trainers, isLoading, error } = useQuery({
        queryKey: ['trainers'],
        queryFn: fetchTrainers,
    });

    const [order, setOrder] = React.useState<Order>('asc');
    const [orderBy, setOrderBy] = React.useState<keyof Trainer>('rank');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const handleRequestSort = (property: keyof Trainer) => {
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

    const sortedTrainers = React.useMemo(() => {
        if (!trainers) return [];
        return [...trainers].sort((a, b) => {
            const aValue = a[orderBy];
            const bValue = b[orderBy];
            if (aValue === null || bValue === null) return 0;
            if (order === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
            }
        });
    }, [trainers, order, orderBy]);

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
                <Typography color="error">Error fetching trainers data.</Typography>
            </Box>
        );
    }

    return (
        <Box className="!p-6">
            <div className="!flex !justify-between !items-center !mb-6">
                <Typography variant="h4" className="!text-white">
                    PWTR List
                </Typography>
                <Link 
                    to="/add_trainer"
                    className="!bg-blue-600 !text-white !px-4 !py-2 !rounded !no-underline hover:!bg-blue-700"
                >
                    Add Trainer
                </Link>
            </div>
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
                            {sortedTrainers
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((trainer) => (
                                    <TableRow
                                        key={trainer.id}
                                        hover
                                        className="hover:!bg-gray-700"
                                    >
                                        <TableCell className="!text-white">
                                            {trainer.rank}
                                        </TableCell>
                                        <TableCell className="!text-white">
                                            <Link 
                                                to={`/trainers/${trainer.id}`}
                                                className="!text-blue-400 hover:!text-blue-300 !no-underline"
                                            >
                                                {trainer.fname} {trainer.lname}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="!text-white">
                                            {trainer.pwtr_rating?.toFixed(2) ?? 'Unrated'}
                                        </TableCell>
                                        <TableCell className="!text-white">
                                            {trainer.region_name}
                                        </TableCell>
                                        <TableCell className="!text-white">
                                            {trainer.title || ''}
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={sortedTrainers.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    className="!text-white"
                />
            </Paper>
        </Box>
    );
};

export default TrainerList; 