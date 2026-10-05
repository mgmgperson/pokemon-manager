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
  TextField,
  Typography,
} from '@mui/material';
import type { TrainerDirectoryEntry, TrainerDirectoryPagination } from '../../types/trainer';
import TrainerDirectoryTable, { type TrainerDirectorySortField as TrainerSortField } from './TrainerDirectoryTable';

type Order = 'asc' | 'desc';
type TitleFilter = 'all' | 'champion' | 'elite_four' | 'gym_leader' | 'none';
type StatusFilter = 'all' | 'active' | 'inactive' | 'unknown';

interface TrainerDirectoryResponse {
  data: TrainerDirectoryEntry[];
  pagination: TrainerDirectoryPagination;
}

interface Region {
  id: number;
  name: string;
}

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
    pagination: TrainerDirectoryPagination;
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

const TrainerList: React.FC = () => {
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<TrainerSortField>('rank');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
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
        <Box className="!flex !gap-3">
          <Link
            to="/trainer-ratings"
            className="!border !border-gray-500 !text-white !px-4 !py-2 !rounded !no-underline hover:!border-white"
          >
            Rating Leaders
          </Link>
          <Link
            to="/trainer-manager"
            className="!border !border-gray-500 !text-white !px-4 !py-2 !rounded !no-underline hover:!border-white"
          >
            Trainer Management
          </Link>
          <Link
            to="/add_trainer"
            className="!bg-blue-600 !text-white !px-4 !py-2 !rounded !no-underline hover:!bg-blue-700"
          >
            Add Trainer
          </Link>
        </Box>
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
        <TrainerDirectoryTable
          trainers={trainers}
          pagination={pagination}
          page={page}
          rowsPerPage={rowsPerPage}
          order={order}
          orderBy={orderBy}
          onRequestSort={handleRequestSort}
          onPageChange={setPage}
          onRowsPerPageChange={(newRowsPerPage) => {
            setRowsPerPage(newRowsPerPage);
            setPage(0);
          }}
        />
      </Paper>
    </Box>
  );
};

export default TrainerList;
