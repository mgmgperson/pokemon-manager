import React from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TablePagination, Box, Button } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { City } from '../../types/region';
import AddIcon from '@mui/icons-material/Add';

type Order = 'asc' | 'desc';

interface HeadCell {
    id: keyof City;
    label: string;
    numeric: boolean;
}

const headCells: HeadCell[] = [
    { id: 'name', numeric: false, label: 'City' },
    { id: 'population', numeric: true, label: 'Population' },
];

interface RegionCitiesProps {
    cities: City[];
}

const RegionCities: React.FC<RegionCitiesProps> = ({ cities }) => {
    const navigate = useNavigate();
    const [order, setOrder] = React.useState<Order>('asc');
    const [orderBy, setOrderBy] = React.useState<keyof City | null>(null);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const handleRequestSort = (property: keyof City) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const sortedCities = React.useMemo(() => {
        if (!orderBy) return cities;
        return [...cities].sort((a, b) => {
            const aValue = a[orderBy];
            const bValue = b[orderBy];
            if (aValue === null || bValue === null) return 0;
            if (order === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
            }
        });
    }, [cities, order, orderBy]);

    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - sortedCities.length) : 0;

    return (
        <Box>
            <Box className="mb-4 flex justify-end">
                <Button 
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/add_city')}
                >
                    Add City
                </Button>
            </Box>
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
                            {sortedCities
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((city) => (
                                    <TableRow
                                        key={city.name}
                                        hover
                                        className="hover:!bg-gray-700"
                                    >
                                        <TableCell className="!text-white">
                                            <Link to={`/cities/${city.id}`} className="!text-blue-400 hover:!text-blue-300">
                                                {city.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="!text-white">
                                            {(city.population ?? 0).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {emptyRows > 0 && (
                                <TableRow style={{ height: 53 * emptyRows }}>
                                    <TableCell colSpan={2} />
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={sortedCities.length}
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

export default RegionCities;