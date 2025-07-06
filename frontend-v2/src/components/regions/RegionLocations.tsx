import React from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TablePagination, Chip, Box, Button } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { Location, getAccessibilityLabel, getTravelTimeLabel } from '../../types/location';
import AddIcon from '@mui/icons-material/Add';

type Order = 'asc' | 'desc';

interface HeadCell {
    id: keyof Location;
    label: string;
    numeric: boolean;
}

const headCells: HeadCell[] = [
    { id: 'name', numeric: false, label: 'Location' },
    { id: 'population', numeric: true, label: 'Population' },
    { id: 'travel_time', numeric: true, label: 'Travel Time' },
    { id: 'accessibility', numeric: true, label: 'Accessibility' },
];

interface RegionLocationsProps {
    locations: Location[];
}

const RegionLocations: React.FC<RegionLocationsProps> = ({ locations = [] }) => {
    const navigate = useNavigate();
    const [order, setOrder] = React.useState<Order>('asc');
    const [orderBy, setOrderBy] = React.useState<keyof Location | null>(null);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const handleRequestSort = (property: keyof Location) => {
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

    const sortedLocations = React.useMemo(() => {
        if (!orderBy) return locations;

        return [...locations].sort((a, b) => {
            const aValue = a[orderBy];
            const bValue = b[orderBy];

            // Handle null values in sorting
            if (aValue === null && bValue === null) return 0;
            if (aValue === null) return order === 'desc' ? -1 : 1;
            if (bValue === null) return order === 'desc' ? 1 : -1;

            // Handle non-null values
            if (order === 'desc') {
                return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
            }
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        });
    }, [locations, order, orderBy]);

    const visibleRows = sortedLocations.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
    );

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - sortedLocations.length) : 0;

    return (
        <Box>
            <Box className="mb-4 flex justify-end">
                <Button 
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/add_location')}
                >
                    Add Location
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
                                <TableCell className="!text-white">
                                    Details
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {visibleRows
                                .map((location) => (
                                    <TableRow
                                        key={location.id}
                                        hover
                                        className="hover:!bg-gray-700"
                                    >
                                        <TableCell className="!text-white">
                                            <Link to={`/locations/${location.id}`} className="!text-blue-400 hover:!text-blue-300">
                                                {location.name}
                                            </Link>
                                            {location.parent_location_name && (
                                                <div className="text-sm text-gray-400">
                                                    Part of {location.parent_location_name}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="!text-white">
                                            {location.population?.toLocaleString() ?? 'N/A'}
                                        </TableCell>
                                        <TableCell className="!text-white">
                                            {getTravelTimeLabel(location.travel_time)}
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={getAccessibilityLabel(location.accessibility).label}
                                                color={getAccessibilityLabel(location.accessibility).color as any}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell className="!text-white">
                                            {location.terrain_types.length > 0 ? (
                                                <div className="flex gap-1 flex-wrap">
                                                    {location.terrain_types.map((terrain, index) => (
                                                        <Chip
                                                            key={index}
                                                            label={terrain}
                                                            size="small"
                                                            className="bg-blue-600"
                                                        />
                                                    ))}
                                                </div>
                                            ) : 'No special terrain'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {emptyRows > 0 && (
                                <TableRow style={{ height: 53 * emptyRows }}>
                                    <TableCell colSpan={5} />
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={sortedLocations.length}
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

export default RegionLocations;
