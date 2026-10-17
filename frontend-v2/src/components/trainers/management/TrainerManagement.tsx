import React from 'react';
import axios from 'axios';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
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
  Tabs,
  Tab,
  TextField,
  Typography,
} from '@mui/material';
import type {
  Trainer,
  TrainerDirectoryEntry,
  TrainerDirectoryPagination,
  TrainerReviewFlag,
} from '../../../types/trainer';
import TrainerEnrichment from './TrainerEnrichment';
import NewTrainerProposal from './NewTrainerProposal';
import PopulationWorkbench from './PopulationWorkbench';

interface TrainerDirectoryResponse {
  data: TrainerDirectoryEntry[];
  pagination: TrainerDirectoryPagination;
}

interface ReviewFilterOption {
  value: TrainerReviewFlag;
  label: string;
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'unknown';

const generalFilterOptions: ReviewFilterOption[] = [
  { value: 'birthdate', label: 'Missing birthdate' },
  { value: 'region', label: 'Missing region' },
  { value: 'hometown', label: 'Missing hometown' },
  { value: 'active_status', label: 'Missing activity status' },
  { value: 'pwtr_rating', label: 'Missing current PWTR' },
  { value: 'peak_rating', label: 'Missing peak rating' },
  { value: 'peak_rank', label: 'Missing peak rank' },
  { value: 'rating', label: 'No current rating record' },
  { value: 'general_rating', label: 'Incomplete general rating' },
];

const rosterFilterOptions: ReviewFilterOption[] = [
  { value: 'no_pokemon', label: 'No owned Pokémon' },
  { value: 'low_pokemon_count', label: 'One to five owned Pokémon' },
  { value: 'pokemon_details', label: 'Missing core Pokémon details' },
];

const reviewFlagLabels: Record<TrainerReviewFlag, string> = {
  birthdate: 'Missing birthdate',
  region: 'Missing region',
  hometown: 'Missing hometown',
  active_status: 'Missing activity status',
  pwtr_rating: 'Missing current PWTR',
  peak_rating: 'Missing peak rating',
  peak_rank: 'Missing peak rank',
  rating: 'No current rating record',
  general_rating: 'Incomplete general rating',
  no_pokemon: 'No owned Pokémon',
  low_pokemon_count: 'One to five owned Pokémon',
  pokemon_details: 'Missing core Pokémon details',
};

const defaultGeneralFilters: TrainerReviewFlag[] = [
  'birthdate',
  'region',
  'hometown',
  'active_status',
];

async function fetchTrainers(input: {
  page: number;
  pageSize: number;
  search: string;
  missing: TrainerReviewFlag[];
  status: StatusFilter;
}): Promise<TrainerDirectoryResponse> {
  const { data } = await axios.get<TrainerDirectoryResponse>('http://localhost:5000/trainers', {
    params: {
      page: input.page + 1,
      pageSize: input.pageSize,
      search: input.search || undefined,
      missing: input.missing.length > 0 ? input.missing.join(',') : undefined,
      status: input.status,
      sortBy: 'name',
      sortOrder: 'asc',
    },
  });

  return data;
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

function selectedFilterOptions(tab: number): ReviewFilterOption[] {
  return tab === 0 ? generalFilterOptions : rosterFilterOptions;
}

const TrainerManagement: React.FC = () => {
  const [tab, setTab] = React.useState(0);
  const [generalFilters, setGeneralFilters] = React.useState<TrainerReviewFlag[]>(defaultGeneralFilters);
  const [rosterFilters, setRosterFilters] = React.useState<TrainerReviewFlag[]>([]);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<StatusFilter>('all');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [enrichmentTrainerId, setEnrichmentTrainerId] = React.useState<number | undefined>();

  const filters = tab === 0 ? generalFilters : rosterFilters;
  const filterOptions = selectedFilterOptions(tab);
  const hasFilters = filters.length > 0;
  const isReviewTab = tab < 2;

  const trainerQuery = useQuery({
    queryKey: ['trainer-management', tab, page, rowsPerPage, search, status, filters],
    queryFn: () => fetchTrainers({ page, pageSize: rowsPerPage, search, status, missing: filters }),
    enabled: isReviewTab && hasFilters,
    placeholderData: keepPreviousData,
  });

  const trainers = trainerQuery.data?.data ?? [];
  const pagination = trainerQuery.data?.pagination;

  const setFilterSelected = (filter: TrainerReviewFlag, selected: boolean): void => {
    const setFilters = tab === 0 ? setGeneralFilters : setRosterFilters;
    setFilters((currentFilters) => {
      if (selected) {
        return currentFilters.includes(filter) ? currentFilters : [...currentFilters, filter];
      }

      return currentFilters.filter((currentFilter) => currentFilter !== filter);
    });
  };

  const openTrainerEnrichment = (trainerId: number): void => {
    setEnrichmentTrainerId(trainerId);
    setTab(2);
  };

  React.useEffect(() => {
    setPage(0);
  }, [tab, filters, search, status, rowsPerPage]);

  return (
    <Box className="!p-6">
      <Box className="!flex !justify-between !items-center !mb-6">
        <Box>
          <Typography variant="h4" className="!text-white">
            Trainer Management
          </Typography>
          <Typography className="!text-gray-400 !mt-1">
            Review factual queues, then preview and explicitly apply author-approved trainer changes.
          </Typography>
        </Box>
        <Link
          to="/trainers"
          className="!border !border-gray-500 !text-white !px-4 !py-2 !rounded !no-underline hover:!border-white"
        >
          Back to Trainers
        </Link>
      </Box>

      <Paper className="!p-4 !mb-4 !bg-gray-800">
        <Tabs value={tab} onChange={(_event, value: number) => setTab(value)} textColor="inherit">
          <Tab label="General data" />
          <Tab label="Pokémon and roster" />
          <Tab label="Enrich existing trainer" />
          <Tab label="Add trainer" />
          <Tab label="Regional population" />
        </Tabs>

        {isReviewTab && <Box className="!mt-4 !flex !flex-wrap !gap-6 !items-start">
          <FormGroup row>
            {filterOptions.map((option) => (
              <FormControlLabel
                key={option.value}
                control={(
                  <Checkbox
                    checked={filters.includes(option.value)}
                    onChange={(event) => setFilterSelected(option.value, event.target.checked)}
                  />
                )}
                label={option.label}
              />
            ))}
          </FormGroup>

          <TextField
            label="Search by name"
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="!min-w-[220px]"
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
            <InputLabel className="!text-gray-400">Status</InputLabel>
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
              label="Status"
              className="!text-white"
              sx={{
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'gray' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'lightgray' },
                '& .MuiSvgIcon-root': { color: 'white' },
              }}
            >
              <MenuItem value="all">All statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="unknown">Unknown</MenuItem>
            </Select>
          </FormControl>
        </Box>}
      </Paper>

      {tab === 2 && <TrainerEnrichment initialTrainerId={enrichmentTrainerId} />}
      {tab === 3 && <NewTrainerProposal />}
      <Box hidden={tab !== 4}><PopulationWorkbench active={tab === 4} /></Box>

      {isReviewTab && !hasFilters && (
        <Paper className="!p-6 !text-center">
          <Typography className="!text-gray-300">
            Select one or more factual conditions to view this review queue.
          </Typography>
        </Paper>
      )}

      {isReviewTab && hasFilters && trainerQuery.isLoading && (
        <Box className="!flex !justify-center !items-center !h-48">
          <CircularProgress />
        </Box>
      )}

      {isReviewTab && hasFilters && trainerQuery.error && (
        <Paper className="!p-6">
          <Typography color="error">Unable to load the trainer review queue.</Typography>
        </Paper>
      )}

      {isReviewTab && hasFilters && !trainerQuery.isLoading && !trainerQuery.error && (
        <Paper>
          <Box className="!px-4 !pt-4">
            <Typography variant="body2" className="!text-gray-400">
              {pagination?.totalItems ?? 0} trainer{pagination?.totalItems === 1 ? '' : 's'} matching any selected condition
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className="!text-white">Trainer</TableCell>
                  <TableCell className="!text-white">Region</TableCell>
                  <TableCell className="!text-white">Birthdate</TableCell>
                  <TableCell className="!text-white">Status</TableCell>
                  <TableCell className="!text-white">Observed gaps</TableCell>
                  {tab === 0 && <TableCell className="!text-white">Action</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {trainers.map((trainer) => (
                  <TableRow key={trainer.id} hover className="hover:!bg-gray-700">
                    <TableCell>
                      <Link
                        to={`/trainers/${trainer.id}`}
                        className="!text-blue-400 hover:!text-blue-300 !no-underline"
                      >
                        {[trainer.fname, trainer.lname].filter(Boolean).join(' ') || 'Unnamed Trainer'}
                      </Link>
                    </TableCell>
                    <TableCell>{trainer.region_name ?? 'Unknown'}</TableCell>
                    <TableCell>{trainer.birthdate ?? 'Unknown'}</TableCell>
                    <TableCell>{formatStatus(trainer.active_status)}</TableCell>
                    <TableCell>
                      <Box className="!flex !flex-wrap !gap-1">
                        {trainer.review_flags.map((flag) => (
                          <Chip key={flag} label={reviewFlagLabels[flag]} size="small" />
                        ))}
                      </Box>
                    </TableCell>
                    {tab === 0 && (
                      <TableCell>
                        <Button size="small" variant="outlined" onClick={() => openTrainerEnrichment(trainer.id)}>
                          Enrich
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {trainers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={tab === 0 ? 6 : 5} className="!text-center !text-gray-400">
                      No trainers match the selected conditions.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={pagination?.totalItems ?? 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => setRowsPerPage(Number(event.target.value))}
            className="!text-white"
          />
        </Paper>
      )}
    </Box>
  );
};

export default TrainerManagement;
