import React from 'react';
import axios from 'axios';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import type { Trainer } from '../../types/trainer';

type Order = 'asc' | 'desc';
type TitleFilter = 'all' | 'champion' | 'elite_four' | 'gym_leader' | 'none';
type StatusFilter = 'all' | 'active' | 'inactive' | 'unknown';

type TrainerSortField =
  | 'rank'
  | 'name'
  | 'pwtr_rating'
  | 'region_name'
  | 'title'
  | 'birthdate'
  | 'age'
  | 'peak_rating'
  | 'peak_rank'
  | 'active_status';

interface TrainerDirectoryEntry extends Trainer {
  age: number | null;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface TrainerDirectoryResponse {
  data: TrainerDirectoryEntry[];
  pagination: Pagination;
}

interface Region {
  id: number;
  name: string;
}

interface HeadCell {
  id: TrainerSortField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'rank', numeric: true, label: 'Rank' },
  { id: 'name', numeric: false, label: 'Name' },
  { id: 'pwtr_rating', numeric: true, label: 'Rating' },
  { id: 'region_name', numeric: false, label: 'Region' },
  { id: 'title', numeric: false, label: 'Title' },
  { id: 'birthdate', numeric: false, label: 'Birthdate' },
  { id: 'age', numeric: true, label: 'Age' },
  { id: 'peak_rating', numeric: true, label: 'Peak Rating' },
  { id: 'peak_rank', numeric: true, label: 'Peak Rank' },
  { id: 'active_status', numeric: false, label: 'Status' },
];

async function fetchTrainers(input: {
  page: number;
  pageSize: number;
  search: string;
  regionId: string;
  title: TitleFilter;
  status: StatusFilter;
  sortBy: TrainerSortField;
  sortOrder: Order;
}): Promise<TrainerDirectoryResponse> {
  const { data } = await axios.get<{
    data: TrainerDirectoryEntry[];
    pagination: Pagination;
  }>('http://localhost:5000/trainers', {
    params: {
      page: input.page + 1,
      pageSize: input.pageSize,
      search: input.search || undefined,
      regionId: input.regionId || undefined,
      title: input.title,
      status: input.status,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
    },
  });

  return data;
}

async function fetchRegions(): Promise<Region[]> {
  const { data } = await axios.get<{ data: Region[] }>('http://localhost:5000/regions');
  return data.data;
}

function formatRating(value: number | null): string {
  return value === null ? 'Unrated' : value.toFixed(2);
}

function formatStatus(status: Trainer['active_status']): string {
  if (status === true || status === 1) {
    return 'Active';
  }

  if (status === false || status === 0) {
    return 'Inactive';
  }

  return 'Unknown';
}

const TrainerList: React.FC = () => {
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<TrainerSortField>('rank');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [pageInput, setPageInput] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [regionId, setRegionId] = React.useState('');
  const [titleFilter, setTitleFilter] = React.useState<TitleFilter>('all');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');

  const trainerQuery = useQuery({
    queryKey: [
      'trainer-directory',
      page,
      rowsPerPage,
      searchQuery,
      regionId,
      titleFilter,
      statusFilter,
      orderBy,
      order,
    ],
    queryFn: () =>
      fetchTrainers({
        page,
        pageSize: rowsPerPage,
        search: searchQuery,
        regionId,
        title: titleFilter,
        status: statusFilter,
        sortBy: orderBy,
        sortOrder: order,
      }),
    placeholderData: keepPreviousData,
  });

  const regionsQuery = useQuery({
    queryKey: ['regions'],
    queryFn: fetchRegions,
  });

  const pagination = trainerQuery.data?.pagination;
  const trainers = trainerQuery.data?.data ?? [];

  const handleRequestSort = (property: TrainerSortField): void => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_event: unknown, newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(Number(event.target.value));
    setPage(0);
  };

  const handlePageJump = (): void => {
    if (!pagination) {
      return;
    }

    const pageNumber = Number(pageInput);
    if (Number.isInteger(pageNumber) && pageNumber >= 1 && pageNumber <= pagination.totalPages) {
      setPage(pageNumber - 1);
      setPageInput('');
    }
  };

  const clearFilters = (): void => {
    setSearchQuery('');
    setRegionId('');
    setTitleFilter('all');
    setStatusFilter('all');
  };

  React.useEffect(() => {
    setPage(0);
  }, [searchQuery, regionId, titleFilter, statusFilter]);

  if (trainerQuery.isLoading || regionsQuery.isLoading) {
    return (
      <Box className="!flex !justify-center !items-center !h-full">
        <CircularProgress />
      </Box>
    );
  }

  if (trainerQuery.error || regionsQuery.error) {
    return (
      <Box className="!flex !justify-center !items-center !h-full">
        <Typography color="error">Error fetching trainer directory data.</Typography>
      </Box>
    );
  }

  return (
    <Box className="!p-6">
      <div className="!flex !justify-between !items-center !mb-6">
        <Typography variant="h4" className="!text-white">
          Trainer Directory
        </Typography>
        <Link
          to="/add_trainer"
          className="!bg-blue-600 !text-white !px-4 !py-2 !rounded !no-underline hover:!bg-blue-700"
        >
          Add Trainer
        </Link>
      </div>

      <Paper className="!p-4 !mb-4 !bg-gray-800">
        <Box className="!flex !flex-wrap !gap-4 !items-center">
          <TextField
            label="Search by Name"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
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

          <FormControl size="small" className="!min-w-[150px]">
            <InputLabel className="!text-gray-400">Region</InputLabel>
            <Select
              value={regionId}
              onChange={(event) => setRegionId(event.target.value)}
              label="Region"
              className="!text-white"
              sx={{
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'gray' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'lightgray' },
                '& .MuiSvgIcon-root': { color: 'white' },
              }}
            >
              <MenuItem value="">All Regions</MenuItem>
              {(regionsQuery.data ?? []).map((region) => (
                <MenuItem key={region.id} value={String(region.id)}>
                  {region.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" className="!min-w-[150px]">
            <InputLabel className="!text-gray-400">Title</InputLabel>
            <Select
              value={titleFilter}
              onChange={(event) => setTitleFilter(event.target.value as TitleFilter)}
              label="Title"
              className="!text-white"
              sx={{
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'gray' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'lightgray' },
                '& .MuiSvgIcon-root': { color: 'white' },
              }}
            >
              <MenuItem value="all">All Titles</MenuItem>
              <MenuItem value="champion">Champion</MenuItem>
              <MenuItem value="elite_four">Elite Four</MenuItem>
              <MenuItem value="gym_leader">Gym Leader</MenuItem>
              <MenuItem value="none">None</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" className="!min-w-[150px]">
            <InputLabel className="!text-gray-400">Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              label="Status"
              className="!text-white"
              sx={{
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'gray' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'lightgray' },
                '& .MuiSvgIcon-root': { color: 'white' },
              }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="unknown">Unknown</MenuItem>
            </Select>
          </FormControl>

          {(searchQuery || regionId || titleFilter !== 'all' || statusFilter !== 'all') && (
            <Button
              variant="outlined"
              size="small"
              onClick={clearFilters}
              className="!text-white !border-gray-500 hover:!border-white"
            >
              Clear Filters
            </Button>
          )}

          <Typography variant="body2" className="!text-gray-400 !ml-auto">
            {pagination?.totalItems ?? 0} trainer{pagination?.totalItems === 1 ? '' : 's'}
          </Typography>
        </Box>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell key={headCell.id} align={headCell.numeric ? 'right' : 'left'} className="!text-white">
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
              {trainers.map((trainer) => (
                <TableRow key={trainer.id} hover className="hover:!bg-gray-700">
                  <TableCell align="right" className="!text-white">
                    {trainer.rank ?? '—'}
                  </TableCell>
                  <TableCell className="!text-white">
                    <Link
                      to={`/trainers/${trainer.id}`}
                      className="!text-blue-400 hover:!text-blue-300 !no-underline"
                    >
                      {[trainer.fname, trainer.lname].filter(Boolean).join(' ') || 'Unnamed Trainer'}
                    </Link>
                  </TableCell>
                  <TableCell align="right" className="!text-white">
                    {formatRating(trainer.pwtr_rating)}
                  </TableCell>
                  <TableCell className="!text-white">{trainer.region_name ?? 'Unknown'}</TableCell>
                  <TableCell className="!text-white">{trainer.title || 'None'}</TableCell>
                  <TableCell className="!text-white">{trainer.birthdate ?? 'Unknown'}</TableCell>
                  <TableCell align="right" className="!text-white">{trainer.age ?? 'Unknown'}</TableCell>
                  <TableCell align="right" className="!text-white">
                    {trainer.peak_rating === null ? 'N/A' : trainer.peak_rating.toFixed(2)}
                  </TableCell>
                  <TableCell align="right" className="!text-white">{trainer.peak_rank ?? 'N/A'}</TableCell>
                  <TableCell className="!text-white">{formatStatus(trainer.active_status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box className="!flex !items-center !justify-between !border-t !border-gray-700">
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={pagination?.totalItems ?? 0}
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
              onChange={(event) => setPageInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handlePageJump();
                }
              }}
              type="number"
              inputProps={{ min: 1, max: pagination?.totalPages ?? 1 }}
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
              disabled={!pagination || pagination.totalPages === 0}
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
