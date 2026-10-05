import React from 'react';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import TrainerRosterProposal from './TrainerRosterProposal';
import {
  fetchManagementCities,
  fetchManagementRegions,
  type GeneralRatingProposal,
} from './trainerManagementData';

interface TrainerOption {
  id: number;
  fname: string | null;
  lname: string | null;
}

interface TrainerDetail {
  trainer: {
    id: number;
    fname: string | null;
    lname: string | null;
    region_id: number | null;
    region_name: string | null;
    birthdate: string | null;
    pwtr_rating: number | null;
    peak_rating: number | null;
    peak_rank: number | null;
    active_status: boolean | number | null;
    pokemon_count: number;
  };
  hometowns: Array<{ city_id: number; city_name: string }>;
  rating: {
    overall_rating: number | null;
    typing_rating: number | null;
    mixed_rating: number | null;
    special_rating: number | null;
  } | null;
}

interface ProfileProposal {
  regionId?: number;
  hometownCityId?: number;
  hometownName?: string;
  birthdate?: string;
  pwtrRating?: number;
  peakRating?: number;
  peakRank?: number;
  activeStatus?: boolean;
}

interface ExistingTrainerProposal {
  trainerId: number;
  profile: ProfileProposal;
  rating: GeneralRatingProposal | null;
  notices: string[];
}

interface BriefState {
  regionId: string;
  hometownCityId: string;
  ageMinimum: string;
  ageMaximum: string;
  pwtrMinimum: string;
  pwtrMaximum: string;
  activeStatus: 'unspecified' | 'active' | 'inactive';
  includeRatings: boolean;
}

interface TrainerEnrichmentProps {
  initialTrainerId?: number;
}

const defaultBrief: BriefState = {
  regionId: '',
  hometownCityId: '',
  ageMinimum: '',
  ageMaximum: '',
  pwtrMinimum: '',
  pwtrMaximum: '',
  activeStatus: 'unspecified',
  includeRatings: true,
};

function trainerName(trainer: TrainerOption): string {
  return [trainer.fname, trainer.lname].filter(Boolean).join(' ') || `Trainer ${trainer.id}`;
}

function optionalRange(minimum: string, maximum: string, label: string): { minimum: number; maximum: number } | undefined {
  if (minimum === '' && maximum === '') {
    return undefined;
  }
  if (minimum === '' || maximum === '') {
    throw new Error(`${label} needs both a minimum and maximum.`);
  }

  const parsedMinimum = Number(minimum);
  const parsedMaximum = Number(maximum);
  if (!Number.isFinite(parsedMinimum) || !Number.isFinite(parsedMaximum)) {
    throw new Error(`${label} must contain valid numbers.`);
  }
  return { minimum: parsedMinimum, maximum: parsedMaximum };
}

function optionalNumber(value: string): number | undefined {
  return value === '' ? undefined : Number(value);
}

async function fetchTrainerOptions(input: { search: string; selectedId?: number }): Promise<TrainerOption[]> {
  const { data } = await axios.get<{ data: TrainerOption[] }>('http://localhost:5000/trainers/options', {
    params: {
      search: input.search || undefined,
      ids: input.selectedId ? String(input.selectedId) : undefined,
    },
  });
  return data.data;
}

async function fetchTrainerDetail(trainerId: number): Promise<TrainerDetail> {
  const { data } = await axios.get<{ data: TrainerDetail }>(`http://localhost:5000/trainers/${trainerId}`);
  return data.data;
}

async function createProposal(
  trainerId: number,
  brief: BriefState
): Promise<ExistingTrainerProposal> {
  const { data } = await axios.post<{ data: ExistingTrainerProposal }>(
    `http://localhost:5000/trainer-management/trainers/${trainerId}/proposal`,
    {
      regionId: optionalNumber(brief.regionId),
      hometownCityId: optionalNumber(brief.hometownCityId),
      ageRange: optionalRange(brief.ageMinimum, brief.ageMaximum, 'Age range'),
      pwtrRange: optionalRange(brief.pwtrMinimum, brief.pwtrMaximum, 'PWTR range'),
      activeStatus: brief.activeStatus === 'unspecified'
        ? undefined
        : brief.activeStatus === 'active',
      includeRatings: brief.includeRatings,
    }
  );
  return data.data;
}

async function applyProposal(
  trainerId: number,
  input: { profile?: ProfileProposal; rating?: GeneralRatingProposal }
): Promise<void> {
  await axios.post(`http://localhost:5000/trainer-management/trainers/${trainerId}/apply`, input);
}

function statusLabel(status: boolean | number | null): string {
  if (status === true || status === 1) {
    return 'Active';
  }
  if (status === false || status === 0) {
    return 'Inactive';
  }
  return 'Unknown';
}

const TrainerEnrichment: React.FC<TrainerEnrichmentProps> = ({ initialTrainerId }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [selectedTrainer, setSelectedTrainer] = React.useState<TrainerOption | null>(null);
  const [appliedInitialTrainerId, setAppliedInitialTrainerId] = React.useState<number | undefined>();
  const [brief, setBrief] = React.useState<BriefState>(defaultBrief);
  const [proposal, setProposal] = React.useState<ExistingTrainerProposal | null>(null);
  const [applyProfile, setApplyProfile] = React.useState(true);
  const [applyRating, setApplyRating] = React.useState(true);
  const [formError, setFormError] = React.useState<string | null>(null);

  const trainerOptionsQuery = useQuery({
    queryKey: ['trainer-options', 'management', search, selectedTrainer?.id, initialTrainerId],
    queryFn: () => fetchTrainerOptions({
      search,
      selectedId: selectedTrainer?.id ?? initialTrainerId,
    }),
  });
  const trainerDetailQuery = useQuery({
    queryKey: ['trainer-management-trainer', selectedTrainer?.id],
    queryFn: () => fetchTrainerDetail(selectedTrainer!.id),
    enabled: selectedTrainer !== null,
  });
  const regionsQuery = useQuery({ queryKey: ['regions'], queryFn: fetchManagementRegions });
  const citiesQuery = useQuery({ queryKey: ['cities'], queryFn: fetchManagementCities });

  React.useEffect(() => {
    if (initialTrainerId === undefined || appliedInitialTrainerId === initialTrainerId) {
      return;
    }

    const trainerOption = trainerOptionsQuery.data?.find((option) => option.id === initialTrainerId);
    if (!trainerOption) {
      return;
    }

    setSelectedTrainer(trainerOption);
    setBrief(defaultBrief);
    setProposal(null);
    setFormError(null);
    setAppliedInitialTrainerId(initialTrainerId);
  }, [appliedInitialTrainerId, initialTrainerId, trainerOptionsQuery.data]);

  const proposalMutation = useMutation({
    mutationFn: () => createProposal(selectedTrainer!.id, brief),
    onSuccess: (nextProposal) => {
      setProposal(nextProposal);
      setApplyProfile(Object.keys(nextProposal.profile).some((key) => key !== 'hometownName'));
      setApplyRating(nextProposal.rating !== null);
      setFormError(null);
    },
    onError: (error) => {
      setProposal(null);
      setFormError(error instanceof Error ? error.message : 'Unable to create a proposal.');
    },
  });
  const applyMutation = useMutation({
    mutationFn: () => applyProposal(selectedTrainer!.id, {
      profile: applyProfile ? proposal?.profile : undefined,
      rating: applyRating ? proposal?.rating ?? undefined : undefined,
    }),
    onSuccess: async () => {
      setProposal(null);
      setFormError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trainer-management-trainer', selectedTrainer?.id] }),
        queryClient.invalidateQueries({ queryKey: ['trainer-directory'] }),
        queryClient.invalidateQueries({ queryKey: ['trainer-management'] }),
      ]);
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'Unable to apply the proposal.');
    },
  });

  const trainer = trainerDetailQuery.data?.trainer;
  const effectiveRegionId = brief.regionId || (trainer?.region_id ? String(trainer.region_id) : '');
  const eligibleCities = (citiesQuery.data ?? []).filter(
    (city) => String(city.region_id) === effectiveRegionId
  );

  const updateBrief = <Key extends keyof BriefState>(key: Key, value: BriefState[Key]): void => {
    setBrief((currentBrief) => ({ ...currentBrief, [key]: value }));
    setProposal(null);
  };

  const updateProfile = <Key extends keyof ProfileProposal>(key: Key, value: ProfileProposal[Key]): void => {
    setProposal((currentProposal) => currentProposal
      ? { ...currentProposal, profile: { ...currentProposal.profile, [key]: value } }
      : currentProposal);
  };

  const updateRating = <Key extends keyof GeneralRatingProposal>(
    key: Key,
    value: GeneralRatingProposal[Key]
  ): void => {
    setProposal((currentProposal) => currentProposal?.rating
      ? {
        ...currentProposal,
        rating: { ...currentProposal.rating, [key]: value },
      }
      : currentProposal);
  };

  const selectTrainer = (_event: unknown, trainerOption: TrainerOption | null): void => {
    setSelectedTrainer(trainerOption);
    setBrief(defaultBrief);
    setProposal(null);
    setFormError(null);
  };

  const handleGenerate = (): void => {
    if (!selectedTrainer) {
      setFormError('Select an existing trainer first.');
      return;
    }

    try {
      optionalRange(brief.ageMinimum, brief.ageMaximum, 'Age range');
      optionalRange(brief.pwtrMinimum, brief.pwtrMaximum, 'PWTR range');
      setFormError(null);
      proposalMutation.mutate();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Check the proposal constraints.');
    }
  };

  const hasProfileProposal = proposal
    ? Object.keys(proposal.profile).some((key) => key !== 'hometownName')
    : false;

  return (
    <Box className="!mt-4">
      <Paper className="!p-4 !mb-4 !bg-gray-800">
        <Typography variant="h6" className="!text-white">
          Enrich existing trainer
        </Typography>
        <Typography variant="body2" className="!text-gray-400 !mt-1">
          Profile and rating generation preserves known values. Location corrections and hometown additions are explicit proposals.
        </Typography>

        <Autocomplete
          className="!mt-4 !max-w-xl"
          options={trainerOptionsQuery.data ?? []}
          value={selectedTrainer}
          loading={trainerOptionsQuery.isLoading}
          onInputChange={(_event, value) => setSearch(value)}
          onChange={selectTrainer}
          getOptionLabel={trainerName}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select trainer"
              sx={{
                '& .MuiInputBase-input': { color: 'white' },
                '& .MuiInputLabel-root': { color: 'gray' },
                '& .MuiOutlinedInput-root fieldset': { borderColor: 'gray' },
              }}
            />
          )}
        />

        {selectedTrainer && trainerDetailQuery.isLoading && <CircularProgress className="!mt-4" />}
        {trainer && (
          <Box className="!mt-4 !text-gray-300">
            <Typography>
              Current: {[trainer.fname, trainer.lname].filter(Boolean).join(' ') || `Trainer ${trainer.id}`} · {trainer.region_name ?? 'Unknown region'} · {trainer.birthdate ?? 'Unknown birthdate'} · {statusLabel(trainer.active_status)}
            </Typography>
            <Typography variant="body2" className="!text-gray-400">
              Hometown{(trainerDetailQuery.data?.hometowns.length ?? 0) === 1 ? '' : 's'}: {trainerDetailQuery.data?.hometowns.map((hometown) => hometown.city_name).join(', ') || 'Unknown'} · PWTR: {trainer.pwtr_rating ?? 'Unknown'}
            </Typography>
          </Box>
        )}
      </Paper>

      {selectedTrainer && trainer && (
        <Paper className="!p-4 !mb-4 !bg-gray-800">
          <Typography variant="h6" className="!text-white">Constraints</Typography>
          <Typography variant="body2" className="!text-gray-400 !mt-1">
            Location changes are explicit proposals. New hometowns are added without deleting saved hometown records.
          </Typography>
          <Box className="!grid !grid-cols-1 md:!grid-cols-2 !gap-4 !mt-4">
            <FormControl size="small">
              <InputLabel>Set or correct region</InputLabel>
              <Select
                value={brief.regionId}
                label="Set or correct region"
                onChange={(event) => {
                  updateBrief('regionId', event.target.value);
                  updateBrief('hometownCityId', '');
                }}
              >
                <MenuItem value="">No region change</MenuItem>
                {(regionsQuery.data ?? []).map((region) => (
                  <MenuItem key={region.id} value={String(region.id)}>{region.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" disabled={effectiveRegionId === ''}>
              <InputLabel>Add hometown</InputLabel>
              <Select
                value={brief.hometownCityId}
                label="Add hometown"
                onChange={(event) => updateBrief('hometownCityId', event.target.value)}
              >
                <MenuItem value="">No hometown change</MenuItem>
                {eligibleCities.map((city) => (
                  <MenuItem key={city.id} value={String(city.id)}>{city.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Minimum age"
              type="number"
              value={brief.ageMinimum}
              onChange={(event) => updateBrief('ageMinimum', event.target.value)}
              helperText="Set both bounds to generate a missing birthdate."
            />
            <TextField
              label="Maximum age"
              type="number"
              value={brief.ageMaximum}
              onChange={(event) => updateBrief('ageMaximum', event.target.value)}
            />
            <TextField
              label="Minimum PWTR"
              type="number"
              value={brief.pwtrMinimum}
              onChange={(event) => updateBrief('pwtrMinimum', event.target.value)}
              helperText="Set both bounds to generate a missing current PWTR."
            />
            <TextField
              label="Maximum PWTR"
              type="number"
              value={brief.pwtrMaximum}
              onChange={(event) => updateBrief('pwtrMaximum', event.target.value)}
            />
            <FormControl size="small">
              <InputLabel>Activity status if unknown</InputLabel>
              <Select
                value={brief.activeStatus}
                label="Activity status if unknown"
                onChange={(event) => updateBrief('activeStatus', event.target.value as BriefState['activeStatus'])}
              >
                <MenuItem value="unspecified">No status proposal</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={(
                <Checkbox
                  checked={brief.includeRatings}
                  onChange={(event) => updateBrief('includeRatings', event.target.checked)}
                />
              )}
              label="Propose missing general ratings"
            />
          </Box>
          <Button
            variant="contained"
            className="!mt-4 !bg-blue-600 hover:!bg-blue-700"
            onClick={handleGenerate}
            disabled={proposalMutation.isPending}
          >
            {proposalMutation.isPending ? 'Generating…' : 'Generate proposal'}
          </Button>
        </Paper>
      )}

      {formError && <Alert severity="error" className="!mb-4">{formError}</Alert>}

      {proposal && (
        <Paper className="!p-4 !bg-gray-800">
          <Typography variant="h6" className="!text-white">Review proposal</Typography>
          {proposal.notices.length > 0 && (
            <Box className="!flex !flex-wrap !gap-2 !mt-2">
              {proposal.notices.map((notice) => <Chip key={notice} label={notice} color="info" size="small" variant="outlined" />)}
            </Box>
          )}

          {hasProfileProposal && (
            <Box className="!mt-4">
              <FormControlLabel
                control={<Checkbox checked={applyProfile} onChange={(event) => setApplyProfile(event.target.checked)} />}
                label="Apply profile and trajectory values"
              />
              <Box className="!grid !grid-cols-1 md:!grid-cols-2 !gap-4 !mt-2">
                {proposal.profile.regionId !== undefined && (
                  <TextField label="Region" value={(regionsQuery.data ?? []).find((region) => region.id === proposal.profile.regionId)?.name ?? proposal.profile.regionId} disabled />
                )}
                {proposal.profile.hometownCityId !== undefined && (
                  <TextField label="Hometown" value={proposal.profile.hometownName ?? proposal.profile.hometownCityId} disabled />
                )}
                {proposal.profile.birthdate !== undefined && (
                  <TextField label="Birthdate" type="date" value={proposal.profile.birthdate} onChange={(event) => updateProfile('birthdate', event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                )}
                {proposal.profile.pwtrRating !== undefined && (
                  <TextField label="Current PWTR" type="number" value={proposal.profile.pwtrRating} onChange={(event) => updateProfile('pwtrRating', Number(event.target.value))} />
                )}
                {proposal.profile.peakRating !== undefined && (
                  <TextField label="Peak rating" type="number" value={proposal.profile.peakRating} onChange={(event) => updateProfile('peakRating', Number(event.target.value))} />
                )}
                {proposal.profile.peakRank !== undefined && (
                  <TextField label="Peak rank" type="number" value={proposal.profile.peakRank} onChange={(event) => updateProfile('peakRank', Number(event.target.value))} />
                )}
                {proposal.profile.activeStatus !== undefined && (
                  <FormControl size="small">
                    <InputLabel>Activity status</InputLabel>
                    <Select
                      value={proposal.profile.activeStatus ? 'active' : 'inactive'}
                      label="Activity status"
                      onChange={(event) => updateProfile('activeStatus', event.target.value === 'active')}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Box>
            </Box>
          )}

          {proposal.rating && (
            <Box className="!mt-4">
              <FormControlLabel
                control={<Checkbox checked={applyRating} onChange={(event) => setApplyRating(event.target.checked)} />}
                label="Apply general ratings"
              />
              <Box className="!grid !grid-cols-1 md:!grid-cols-4 !gap-4 !mt-2">
                <TextField label="Overall" type="number" value={proposal.rating.overallRating} onChange={(event) => updateRating('overallRating', Number(event.target.value))} />
                <TextField label="Typing" type="number" value={proposal.rating.typingRating} onChange={(event) => updateRating('typingRating', Number(event.target.value))} />
                <TextField label="Mixed" type="number" value={proposal.rating.mixedRating} onChange={(event) => updateRating('mixedRating', Number(event.target.value))} />
                <TextField label="Special" type="number" value={proposal.rating.specialRating} onChange={(event) => updateRating('specialRating', Number(event.target.value))} />
              </Box>
            </Box>
          )}

          <Button
            variant="contained"
            color="success"
            className="!mt-6"
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending || (!applyProfile && !applyRating)}
          >
            {applyMutation.isPending ? 'Applying…' : 'Apply selected values'}
          </Button>
        </Paper>
      )}

      {selectedTrainer && trainer && (
        <TrainerRosterProposal trainerId={selectedTrainer.id} existingPokemonCount={trainer.pokemon_count} />
      )}
    </Box>
  );
};

export default TrainerEnrichment;
