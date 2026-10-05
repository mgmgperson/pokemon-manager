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
  ListSubheader,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
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
import { fieldNamesMap, type Trainer } from '../../types/trainer';

type Order = 'asc' | 'desc';
type MetricGroup = 'General' | 'Format' | 'Mental' | 'Field';
type LeaderboardSortField =
  | 'rank'
  | 'name'
  | 'pwtr_rating'
  | 'region_name'
  | 'title'
  | 'birthdate'
  | 'age'
  | 'peak_rating'
  | 'peak_rank'
  | 'metric';

interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface RatingMetricOption {
  value: string;
  group: MetricGroup;
}

interface RatingLeaderboardEntry extends Trainer {
  age: number | null;
  metric_value: number | null;
}

interface RatingLeaderboardResponse {
  data: RatingLeaderboardEntry[];
  metric: string;
  metrics: RatingMetricOption[];
  pagination: Pagination;
}

interface HeadCell {
  id: LeaderboardSortField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'rank', numeric: true, label: 'Rank' },
  { id: 'name', numeric: false, label: 'Name' },
  { id: 'pwtr_rating', numeric: true, label: 'PWTR Rating' },
  { id: 'region_name', numeric: false, label: 'Region' },
  { id: 'title', numeric: false, label: 'Title' },
  { id: 'birthdate', numeric: false, label: 'Birthdate' },
  { id: 'age', numeric: true, label: 'Age' },
  { id: 'peak_rating', numeric: true, label: 'Peak Rating' },
  { id: 'peak_rank', numeric: true, label: 'Peak Rank' },
  { id: 'metric', numeric: true, label: 'Selected Rating' },
];

const generalRatingNames: Record<string, string> = {
  overall_rating: 'Overall',
  typing_rating: 'Typing',
  mixed_rating: 'Mixed',
  special_rating: 'Special',
};

const metricGroups: MetricGroup[] = ['General', 'Format', 'Mental', 'Field'];

function metricLabel(metric: string): string {
  return generalRatingNames[metric] ?? fieldNamesMap[metric] ?? metric;
}

function formatPwtrRating(value: number | null): string {
  return value === null ? 'Unrated' : value.toFixed(2);
}

function formatMetricValue(value: number | null): string {
  return value === null ? 'Unrated' : value.toFixed(0);
}

async function fetchRatingLeaderboard(input: {
  page: number;
  pageSize: number;
  metric: string;
  sortBy: LeaderboardSortField;
  sortOrder: Order;
}): Promise<RatingLeaderboardResponse> {
  const { data } = await axios.get<RatingLeaderboardResponse>('http://localhost:5000/trainers/ratings', {
    params: {
      page: input.page + 1,
      pageSize: input.pageSize,
      metric: input.metric,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
    },
  });

  return data;
}

const TrainerRatingsLeaderboard: React.FC = () => {
  const [metric, setMetric] = React.useState('overall_rating');
  const [order, setOrder] = React.useState<Order>('desc');
  const [orderBy, setOrderBy] = React.useState<LeaderboardSortField>('metric');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [pageInput, setPageInput] = React.useState('');

  const leaderboardQuery = useQuery({
    queryKey: ['trainer-rating-leaderboard', page, rowsPerPage, metric, orderBy, order],
    queryFn: () => fetchRatingLeaderboard({
      page,
      pageSize: rowsPerPage,
      metric,
      sortBy: orderBy,
      sortOrder: order,
    }),
    placeholderData: keepPreviousData,
  });

  const pagination = leaderboardQuery.data?.pagination;
  const trainers = leaderboardQuery.data?.data ?? [];
  const metrics = leaderboardQuery.data?.metrics ?? [];

  const handleMetricChange = (event: SelectChangeEvent): void => {
    setMetric(event.target.value);
    setOrderBy('metric');
    setOrder('desc');
    setPage(0);
  };

  const handleRequestSort = (property: LeaderboardSortField): void => {
    const isAscending = orderBy === property && order === 'asc';
    setOrder(isAscending ? 'desc' : 'asc');
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

  if (leaderboardQuery.isLoading) {
    return (
      <Box className="!flex !justify-center !items-center !h-full">
        <CircularProgress />
      </Box>
    );
  }

  if (leaderboardQuery.error) {
    return (
      <Box className="!flex !justify-center !items-center !h-full">
        <Typography color="error">Error fetching trainer rating leaders.</Typography>
      </Box>
    );
  }

  return (
    <Box className="!p-6">
      <Box className="!flex !justify-between !items-center !mb-6">
        <Box>
          <Typography variant="h4" className="!text-white">
            Trainer Rating Leaders
          </Typography>
          <Typography variant="body2" className="!text-gray-400 !mt-1">
            Active trainers only. Select any saved trainer rating to view its leaderboard.
          </Typography>
        </Box>
        <Link
          to="/trainers"
          className="!border !border-gray-500 !text-white !px-4 !py-2 !rounded !no-underline hover:!border-white"
        >
          Trainer Directory
        </Link>
      </Box>

      <Paper className="!p-4 !mb-4 !bg-gray-800">
        <Box className="!flex !flex-wrap !gap-4 !items-center">
          <FormControl size="small" className="!min-w-[260px]">
            <InputLabel className="!text-gray-400">Rating</InputLabel>
            <Select
              value={metric}
              onChange={handleMetricChange}
              label="Rating"
              className="!text-white"
              sx={{
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'gray' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'lightgray' },
                '& .MuiSvgIcon-root': { color: 'white' },
              }}
            >
              {metricGroups.map((group) => {
                const groupMetrics = metrics.filter((ratingMetric) => ratingMetric.group === group);
                if (groupMetrics.length === 0) {
                  return null;
                }

                return [
                  <ListSubheader key={`${group}-header`}>{group}</ListSubheader>,
                  ...groupMetrics.map((ratingMetric) => (
                    <MenuItem key={ratingMetric.value} value={ratingMetric.value}>
                      {metricLabel(ratingMetric.value)}
                    </MenuItem>
                  )),
                ];
              })}
            </Select>
          </FormControl>

          <Typography variant="body2" className="!text-gray-400 !ml-auto">
            {pagination?.totalItems ?? 0} active trainer{pagination?.totalItems === 1 ? '' : 's'}
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
                      {headCell.id === 'metric' ? metricLabel(metric) : headCell.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {trainers.map((trainer) => (
                <TableRow key={trainer.id} hover className="hover:!bg-gray-700">
                  <TableCell align="right" className="!text-white">{trainer.rank ?? '—'}</TableCell>
                  <TableCell className="!text-white">
                    <Link
                      to={`/trainers/${trainer.id}`}
                      className="!text-blue-400 hover:!text-blue-300 !no-underline"
                    >
                      {[trainer.fname, trainer.lname].filter(Boolean).join(' ') || 'Unnamed Trainer'}
                    </Link>
                  </TableCell>
                  <TableCell align="right" className="!text-white">
                    {formatPwtrRating(trainer.pwtr_rating)}
                  </TableCell>
                  <TableCell className="!text-white">{trainer.region_name ?? 'Unknown'}</TableCell>
                  <TableCell className="!text-white">{trainer.title || 'None'}</TableCell>
                  <TableCell className="!text-white">{trainer.birthdate ?? 'Unknown'}</TableCell>
                  <TableCell align="right" className="!text-white">{trainer.age ?? 'Unknown'}</TableCell>
                  <TableCell align="right" className="!text-white">
                    {trainer.peak_rating === null ? 'N/A' : trainer.peak_rating.toFixed(2)}
                  </TableCell>
                  <TableCell align="right" className="!text-white">{trainer.peak_rank ?? 'N/A'}</TableCell>
                  <TableCell align="right" className="!text-white">
                    {formatMetricValue(trainer.metric_value)}
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

export default TrainerRatingsLeaderboard;
