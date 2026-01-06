import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Paper, Typography, Box, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TablePagination, TextField, Button, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
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
    const [pageInput, setPageInput] = React.useState('');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [regionFilter, setRegionFilter] = React.useState<string>('all');
    const [titleFilter, setTitleFilter] = React.useState<string>('all');

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

    const handlePageJump = () => {
        const pageNumber = parseInt(pageInput);
        const maxPage = Math.ceil(filteredTrainers.length / rowsPerPage) - 1;
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

    // Get unique regions and titles for filters
    const uniqueRegions = React.useMemo(() => {
        if (!trainers) return [];
        const regions = Array.from(new Set(trainers.map(t => t.region_name).filter(Boolean)));
        return regions.sort();
    }, [trainers]);

    // Predefined title filters
    const titleOptions = [
        { value: 'champion', label: 'Champion' },
        { value: 'elite_four', label: 'Elite Four' },
        { value: 'gym_leader', label: 'Gym Leader' },
        { value: 'none', label: 'None' },
    ];

    // Filter trainers based on search and filters
    const filteredTrainers = React.useMemo(() => {
        if (!trainers) return [];
        
        return trainers.filter((trainer) => {
            // Search filter (name)
            const matchesSearch = searchQuery === '' || 
                `${trainer.fname} ${trainer.lname}`.toLowerCase().includes(searchQuery.toLowerCase());
            
            // Region filter
            const matchesRegion = regionFilter === 'all' || trainer.region_name === regionFilter;
            
            // Title filter
            let matchesTitle = true;
            if (titleFilter !== 'all') {
                const trainerTitle = (trainer.title || '').toLowerCase();
                if (titleFilter === 'champion') {
                    matchesTitle = trainerTitle.includes('champion');
                } else if (titleFilter === 'elite_four') {
                    matchesTitle = trainerTitle.includes('elite four') || trainerTitle.includes('elite-four');
                } else if (titleFilter === 'gym_leader') {
                    matchesTitle = trainerTitle.includes('leader') || trainerTitle.includes('gym-leader');
                } else if (titleFilter === 'none') {
                    matchesTitle = trainerTitle === '' || trainerTitle === 'none';
                }
            }
            
            return matchesSearch && matchesRegion && matchesTitle;
        });
    }, [trainers, searchQuery, regionFilter, titleFilter]);

    const sortedTrainers = React.useMemo(() => {
        if (!filteredTrainers) return [];
        return [...filteredTrainers].sort((a, b) => {
            const aValue = a[orderBy];
            const bValue = b[orderBy];
            if (aValue === null || bValue === null) return 0;
            if (order === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
            }
        });
    }, [filteredTrainers, order, orderBy]);

    // Reset page when filters change
    React.useEffect(() => {
        setPage(0);
    }, [searchQuery, regionFilter, titleFilter]);

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

            {/* Search and Filter Controls */}
            <Paper className="!p-4 !mb-4 !bg-gray-800">
                <Box className="!flex !flex-wrap !gap-4 !items-center">
                    {/* Search by Name */}
                    <TextField
                        label="Search by Name"
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="!flex-1 !min-w-[200px]"
                        sx={{
                            '& .MuiInputBase-input': { color: 'white' },
                            '& .MuiInputLabel-root': { color: 'gray' },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: 'gray' },
                                '&:hover fieldset': { borderColor: 'lightgray' },
                            },
                        }}
                    />

                    {/* Region Filter */}
                    <FormControl size="small" className="!min-w-[150px]">
                        <InputLabel className="!text-gray-400">Region</InputLabel>
                        <Select
                            value={regionFilter}
                            onChange={(e) => setRegionFilter(e.target.value)}
                            label="Region"
                            className="!text-white"
                            sx={{
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'gray' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'lightgray' },
                                '& .MuiSvgIcon-root': { color: 'white' },
                            }}
                        >
                            <MenuItem value="all">All Regions</MenuItem>
                            {uniqueRegions.map((region) => (
                                <MenuItem key={region} value={region || ''}>
                                    {region}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Title Filter */}
                    <FormControl size="small" className="!min-w-[150px]">
                        <InputLabel className="!text-gray-400">Title</InputLabel>
                        <Select
                            value={titleFilter}
                            onChange={(e) => setTitleFilter(e.target.value)}
                            label="Title"
                            className="!text-white"
                            sx={{
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'gray' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'lightgray' },
                                '& .MuiSvgIcon-root': { color: 'white' },
                            }}
                        >
                            <MenuItem value="all">All Titles</MenuItem>
                            {titleOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Clear Filters Button */}
                    {(searchQuery || regionFilter !== 'all' || titleFilter !== 'all') && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                                setSearchQuery('');
                                setRegionFilter('all');
                                setTitleFilter('all');
                            }}
                            className="!text-white !border-gray-500 hover:!border-white"
                        >
                            Clear Filters
                        </Button>
                    )}

                    <Typography variant="body2" className="!text-gray-400 !ml-auto">
                        {sortedTrainers.length} trainer{sortedTrainers.length !== 1 ? 's' : ''}
                    </Typography>
                </Box>
            </Paper>

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

export default TrainerList; 