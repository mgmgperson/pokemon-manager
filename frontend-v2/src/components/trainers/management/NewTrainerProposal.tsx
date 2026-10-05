import React from 'react';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import {
  fetchManagementCities,
  fetchManagementRegions,
  type GeneralRatingProposal,
} from './trainerManagementData';

type NameGender = 'random' | 'M' | 'F';

interface NumericRange {
  minimum: number;
  maximum: number;
}

interface NewTrainerProfileProposal {
  fname: string;
  lname: string;
  regionId: number;
  hometownCityId?: number;
  hometownName?: string;
  birthdate: string;
  pwtrRating: number;
  peakRating: number;
  peakRank: number;
  activeStatus: boolean;
}

interface NewTrainerProposalResponse {
  profile: NewTrainerProfileProposal;
  rating: GeneralRatingProposal | null;
  nameGender: Exclude<NameGender, 'random'>;
  notices: string[];
}

interface NewTrainerBrief {
  regionId: string;
  hometownCityId: string;
  gender: NameGender;
  ageMinimum: string;
  ageMaximum: string;
  pwtrMinimum: string;
  pwtrMaximum: string;
  activeStatus: 'active' | 'inactive';
  includeRatings: boolean;
}

const defaultBrief: NewTrainerBrief = {
  regionId: '',
  hometownCityId: '',
  gender: 'random',
  ageMinimum: '',
  ageMaximum: '',
  pwtrMinimum: '',
  pwtrMaximum: '',
  activeStatus: 'active',
  includeRatings: true,
};

function requiredRange(minimum: string, maximum: string, label: string): NumericRange {
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

function requiredPositiveInteger(value: string, label: string): number {
  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${label} is required.`);
  }
  return parsedValue;
}

function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    return error.response?.data.error ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

async function createProposal(brief: NewTrainerBrief): Promise<NewTrainerProposalResponse> {
  const { data } = await axios.post<{ data: NewTrainerProposalResponse }>(
    'http://localhost:5000/trainer-management/new-trainer/proposal',
    {
      regionId: requiredPositiveInteger(brief.regionId, 'Region'),
      hometownCityId: brief.hometownCityId === '' ? undefined : requiredPositiveInteger(brief.hometownCityId, 'Hometown'),
      gender: brief.gender === 'random' ? undefined : brief.gender,
      ageRange: requiredRange(brief.ageMinimum, brief.ageMaximum, 'Age range'),
      pwtrRange: requiredRange(brief.pwtrMinimum, brief.pwtrMaximum, 'PWTR range'),
      activeStatus: brief.activeStatus === 'active',
      includeRatings: brief.includeRatings,
    }
  );
  return data.data;
}

async function applyProposal(input: {
  profile: NewTrainerProfileProposal;
  rating?: GeneralRatingProposal;
}): Promise<number> {
  const { data } = await axios.post<{ data: { trainerId: number } }>(
    'http://localhost:5000/trainer-management/new-trainer/apply',
    input
  );
  return data.data.trainerId;
}

const NewTrainerProposal: React.FC = () => {
  const queryClient = useQueryClient();
  const [brief, setBrief] = React.useState<NewTrainerBrief>(defaultBrief);
  const [proposal, setProposal] = React.useState<NewTrainerProposalResponse | null>(null);
  const [applyRating, setApplyRating] = React.useState(true);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [createdTrainerId, setCreatedTrainerId] = React.useState<number | null>(null);

  const regionsQuery = useQuery({ queryKey: ['regions'], queryFn: fetchManagementRegions });
  const citiesQuery = useQuery({ queryKey: ['cities'], queryFn: fetchManagementCities });
  const eligibleCities = (citiesQuery.data ?? []).filter((city) => String(city.region_id) === brief.regionId);

  const proposalMutation = useMutation({
    mutationFn: () => createProposal(brief),
    onSuccess: (nextProposal) => {
      setProposal(nextProposal);
      setApplyRating(nextProposal.rating !== null);
      setCreatedTrainerId(null);
      setFormError(null);
    },
    onError: (error) => {
      setProposal(null);
      setFormError(errorMessage(error, 'Unable to create a trainer proposal.'));
    },
  });

  const applyMutation = useMutation({
    mutationFn: () => applyProposal({
      profile: proposal!.profile,
      rating: applyRating ? proposal!.rating ?? undefined : undefined,
    }),
    onSuccess: async (trainerId) => {
      setProposal(null);
      setCreatedTrainerId(trainerId);
      setFormError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trainer-directory'] }),
        queryClient.invalidateQueries({ queryKey: ['trainer-management'] }),
        queryClient.invalidateQueries({ queryKey: ['trainer-options'] }),
      ]);
    },
    onError: (error) => setFormError(errorMessage(error, 'Unable to create the trainer.')),
  });

  const updateBrief = <Key extends keyof NewTrainerBrief>(key: Key, value: NewTrainerBrief[Key]): void => {
    setBrief((currentBrief) => ({ ...currentBrief, [key]: value }));
    setProposal(null);
    setCreatedTrainerId(null);
  };

  const updateProfile = <Key extends keyof NewTrainerProfileProposal>(
    key: Key,
    value: NewTrainerProfileProposal[Key]
  ): void => {
    setProposal((currentProposal) => currentProposal
      ? { ...currentProposal, profile: { ...currentProposal.profile, [key]: value } }
      : currentProposal);
  };

  const updateRating = <Key extends keyof GeneralRatingProposal>(
    key: Key,
    value: GeneralRatingProposal[Key]
  ): void => {
    setProposal((currentProposal) => currentProposal?.rating
      ? { ...currentProposal, rating: { ...currentProposal.rating, [key]: value } }
      : currentProposal);
  };

  const handleGenerate = (): void => {
    try {
      requiredPositiveInteger(brief.regionId, 'Region');
      requiredRange(brief.ageMinimum, brief.ageMaximum, 'Age range');
      requiredRange(brief.pwtrMinimum, brief.pwtrMaximum, 'PWTR range');
      setFormError(null);
      proposalMutation.mutate();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Check the trainer brief.');
    }
  };

  return (
    <Box className="!mt-4">
      <Paper className="!p-4 !bg-gray-800">
        <Typography variant="h6" className="!text-white">Add trainer proposal</Typography>
        <Typography variant="body2" className="!text-gray-400 !mt-1">
          Create one author-reviewed trainer. This does not use the legacy direct-create form or add a Pokémon roster.
        </Typography>

        <Box className="!grid !grid-cols-1 md:!grid-cols-2 !gap-4 !mt-4">
          <FormControl size="small" required>
            <InputLabel>Region</InputLabel>
            <Select
              value={brief.regionId}
              label="Region"
              onChange={(event) => {
                updateBrief('regionId', event.target.value);
                updateBrief('hometownCityId', '');
              }}
            >
              <MenuItem value="">Select region</MenuItem>
              {(regionsQuery.data ?? []).map((region) => (
                <MenuItem key={region.id} value={String(region.id)}>{region.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" disabled={brief.regionId === ''}>
            <InputLabel>Hometown</InputLabel>
            <Select
              value={brief.hometownCityId}
              label="Hometown"
              onChange={(event) => updateBrief('hometownCityId', event.target.value)}
            >
              <MenuItem value="">No hometown proposal</MenuItem>
              {eligibleCities.map((city) => (
                <MenuItem key={city.id} value={String(city.id)}>{city.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Name generation</InputLabel>
            <Select
              value={brief.gender}
              label="Name generation"
              onChange={(event) => updateBrief('gender', event.target.value as NameGender)}
            >
              <MenuItem value="random">Random M/F distribution</MenuItem>
              <MenuItem value="M">M name distribution</MenuItem>
              <MenuItem value="F">F name distribution</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Activity status</InputLabel>
            <Select
              value={brief.activeStatus}
              label="Activity status"
              onChange={(event) => updateBrief('activeStatus', event.target.value as NewTrainerBrief['activeStatus'])}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Minimum age"
            type="number"
            value={brief.ageMinimum}
            onChange={(event) => updateBrief('ageMinimum', event.target.value)}
            helperText="Whole-number range between 14 and 80."
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
            helperText="Range between 1000 and 4500."
          />
          <TextField
            label="Maximum PWTR"
            type="number"
            value={brief.pwtrMaximum}
            onChange={(event) => updateBrief('pwtrMaximum', event.target.value)}
          />
          <FormControlLabel
            control={(
              <Checkbox
                checked={brief.includeRatings}
                onChange={(event) => updateBrief('includeRatings', event.target.checked)}
              />
            )}
            label="Include general-rating proposal"
          />
        </Box>

        <Button
          variant="contained"
          className="!mt-4 !bg-blue-600 hover:!bg-blue-700"
          onClick={handleGenerate}
          disabled={proposalMutation.isPending}
        >
          {proposalMutation.isPending ? 'Generating…' : 'Generate trainer proposal'}
        </Button>
      </Paper>

      {formError && <Alert severity="error" className="!mt-4">{formError}</Alert>}
      {createdTrainerId !== null && (
        <Alert severity="success" className="!mt-4">
          Trainer created. <Link to={`/trainers/${createdTrainerId}`}>Open trainer #{createdTrainerId}</Link>
        </Alert>
      )}

      {proposal && (
        <Paper className="!p-4 !mt-4 !bg-gray-800">
          <Typography variant="h6" className="!text-white">Review new trainer</Typography>
          <Typography variant="body2" className="!text-gray-400 !mt-1">
            Name source: {proposal.nameGender} distribution. Review or edit these concrete values before applying.
          </Typography>
          {proposal.notices.map((notice) => <Alert key={notice} severity="info" className="!mt-2">{notice}</Alert>)}

          <Box className="!grid !grid-cols-1 md:!grid-cols-2 !gap-4 !mt-4">
            <TextField label="First name" value={proposal.profile.fname} onChange={(event) => updateProfile('fname', event.target.value)} />
            <TextField label="Last name" value={proposal.profile.lname} onChange={(event) => updateProfile('lname', event.target.value)} />
            <TextField
              label="Region"
              value={(regionsQuery.data ?? []).find((region) => region.id === proposal.profile.regionId)?.name ?? proposal.profile.regionId}
              disabled
            />
            <TextField label="Hometown" value={proposal.profile.hometownName ?? 'None proposed'} disabled />
            <TextField
              label="Birthdate"
              type="date"
              value={proposal.profile.birthdate}
              onChange={(event) => updateProfile('birthdate', event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
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
            <TextField label="Current PWTR" type="number" value={proposal.profile.pwtrRating} onChange={(event) => updateProfile('pwtrRating', Number(event.target.value))} />
            <TextField label="Peak rating" type="number" value={proposal.profile.peakRating} onChange={(event) => updateProfile('peakRating', Number(event.target.value))} />
            <TextField label="Peak rank" type="number" value={proposal.profile.peakRank} onChange={(event) => updateProfile('peakRank', Number(event.target.value))} />
          </Box>

          {proposal.rating && (
            <Box className="!mt-4">
              <FormControlLabel
                control={<Checkbox checked={applyRating} onChange={(event) => setApplyRating(event.target.checked)} />}
                label="Create general ratings"
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
            disabled={applyMutation.isPending}
          >
            {applyMutation.isPending ? 'Creating…' : 'Create reviewed trainer'}
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default NewTrainerProposal;
