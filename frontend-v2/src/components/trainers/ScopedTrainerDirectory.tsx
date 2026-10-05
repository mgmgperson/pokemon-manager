import React from 'react';
import axios from 'axios';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import type { TrainerDirectoryEntry, TrainerDirectoryPagination } from '../../types/trainer';
import TrainerDirectoryTable, { type TrainerDirectorySortField } from './TrainerDirectoryTable';

type Order = 'asc' | 'desc';

interface ScopedTrainerDirectoryProps {
  heading: string;
  emptyMessage: string;
  regionId?: string;
  hometownCityId?: string;
}

interface TrainerDirectoryResponse {
  data: TrainerDirectoryEntry[];
  pagination: TrainerDirectoryPagination;
}

async function fetchScopedTrainers(input: {
  page: number;
  pageSize: number;
  regionId?: string;
  hometownCityId?: string;
  sortBy: TrainerDirectorySortField;
  sortOrder: Order;
}): Promise<TrainerDirectoryResponse> {
  const { data } = await axios.get<TrainerDirectoryResponse>('http://localhost:5000/trainers', {
    params: {
      page: input.page + 1,
      pageSize: input.pageSize,
      regionId: input.regionId,
      hometownCityId: input.hometownCityId,
      status: 'active',
      title: 'all',
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
    },
  });

  return data;
}

const ScopedTrainerDirectory: React.FC<ScopedTrainerDirectoryProps> = ({
  heading,
  emptyMessage,
  regionId,
  hometownCityId,
}) => {
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<TrainerDirectorySortField>('rank');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);

  const trainerQuery = useQuery({
    queryKey: [
      'scoped-trainer-directory',
      regionId,
      hometownCityId,
      page,
      rowsPerPage,
      orderBy,
      order,
    ],
    queryFn: () => fetchScopedTrainers({
      page,
      pageSize: rowsPerPage,
      regionId,
      hometownCityId,
      sortBy: orderBy,
      sortOrder: order,
    }),
    enabled: Boolean(regionId || hometownCityId),
    placeholderData: keepPreviousData,
  });

  const handleRequestSort = (property: TrainerDirectorySortField): void => {
    const isAscending = orderBy === property && order === 'asc';
    setOrder(isAscending ? 'desc' : 'asc');
    setOrderBy(property);
  };

  if (trainerQuery.isLoading) {
    return (
      <Paper className="p-6">
        <Box className="flex justify-center items-center">
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (trainerQuery.error) {
    return (
      <Paper className="p-6">
        <Typography color="error">Error loading trainers.</Typography>
      </Paper>
    );
  }

  const trainers = trainerQuery.data?.data ?? [];
  const pagination = trainerQuery.data?.pagination;

  return (
    <Paper className="p-6">
      <Box className="flex justify-between items-center mb-4">
        <Typography variant="h5" className="text-white">{heading}</Typography>
        <Typography variant="body2" className="text-gray-400">
          {pagination?.totalItems ?? 0} active trainer{pagination?.totalItems === 1 ? '' : 's'}
        </Typography>
      </Box>
      {trainers.length === 0 ? (
        <Typography className="text-gray-400">{emptyMessage}</Typography>
      ) : (
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
          showPeakColumns={false}
        />
      )}
    </Paper>
  );
};

export default ScopedTrainerDirectory;
