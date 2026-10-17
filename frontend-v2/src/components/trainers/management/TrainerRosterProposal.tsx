import React from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

interface TrainerRosterProposalProps {
  trainerId: number;
  existingPokemonCount: number;
}

interface PreferenceOption {
  id: number;
  name: string;
}

export interface RosterPokemonProposal {
  speciesId: number;
  pokemonId: number;
  name: string;
  level: number;
  typeIds: number[];
  isMega: boolean;
  isGigantamax: boolean;
  details: GeneratedPokemonDetails;
}

export interface GeneratedPokemonDetails {
  otName: string;
  otId: number;
  nickname: string;
  happiness: number;
  gender: string;
  shiny: boolean;
  pokeballId: number;
  heldItemId: number;
  experiencePoints: number;
  dateMetAt: string;
  levelMetAt: number;
  currentHp: number;
  currentStrength: number;
  statusId: number;
  battlesWon: number;
  battlesLost: number;
  kills: number;
  deaths: number;
  trainingEfficiency: number;
  abilityId: number;
  natureId: number;
  evHp: number;
  evAttack: number;
  evDefense: number;
  evSpecialAttack: number;
  evSpecialDefense: number;
  evSpeed: number;
  ivHp: number;
  ivAttack: number;
  ivDefense: number;
  ivSpecialAttack: number;
  ivSpecialDefense: number;
  ivSpeed: number;
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

interface RosterProposal {
  trainerId: number;
  existingPokemonCount: number;
  pokemon: RosterPokemonProposal[];
  overallRating: number;
  notices: string[];
}

const typeOptions: PreferenceOption[] = [
  { id: 1, name: 'Normal' },
  { id: 2, name: 'Fighting' },
  { id: 3, name: 'Flying' },
  { id: 4, name: 'Poison' },
  { id: 5, name: 'Ground' },
  { id: 6, name: 'Rock' },
  { id: 7, name: 'Bug' },
  { id: 8, name: 'Ghost' },
  { id: 9, name: 'Steel' },
  { id: 10, name: 'Fire' },
  { id: 11, name: 'Water' },
  { id: 12, name: 'Grass' },
  { id: 13, name: 'Electric' },
  { id: 14, name: 'Psychic' },
  { id: 15, name: 'Ice' },
  { id: 16, name: 'Dragon' },
  { id: 17, name: 'Dark' },
  { id: 18, name: 'Fairy' },
  { id: 19, name: 'Stellar' },
];

const generationOptions: PreferenceOption[] = Array.from(
  { length: 9 },
  (_value, index) => ({ id: index + 1, name: `Generation ${index + 1}` })
);

function preferenceNames(ids: number[], options: PreferenceOption[]): string {
  return ids
    .map((id) => options.find((option) => option.id === id)?.name ?? `Type ${id}`)
    .join(', ');
}

function errorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    return error.response?.data.error ?? 'Unable to create a roster proposal.';
  }
  return error instanceof Error ? error.message : 'Unable to create a roster proposal.';
}

async function createRosterProposal(input: {
  trainerId: number;
  pokemonCount: number;
  typeIds: number[];
  generations: number[];
}): Promise<RosterProposal> {
  const { data } = await axios.post<{ data: RosterProposal }>(
    `http://localhost:5000/trainer-management/trainers/${input.trainerId}/roster-proposal`,
    {
      pokemonCount: input.pokemonCount,
      typeIds: input.typeIds,
      generations: input.generations,
    }
  );
  return data.data;
}

async function applyRosterProposal(input: {
  trainerId: number;
  pokemon: RosterPokemonProposal[];
}): Promise<number> {
  const { data } = await axios.post<{ data: { pokemonCreated: number } }>(
    `http://localhost:5000/trainer-management/trainers/${input.trainerId}/roster-apply`,
    { pokemon: input.pokemon }
  );
  return data.data.pokemonCreated;
}

function detailEntries(pokemon: RosterPokemonProposal): ReadonlyArray<readonly [string, string | number | boolean]> {
  const details = pokemon.details;
  return [
    ['Species ID', pokemon.speciesId],
    ['Pokémon form ID', pokemon.pokemonId],
    ['Types', preferenceNames(pokemon.typeIds, typeOptions)],
    ['Form', pokemon.isMega ? 'Mega' : pokemon.isGigantamax ? 'Gigantamax' : 'Standard'],
    ['Original trainer', details.otName || 'Unnamed trainer'],
    ['Original trainer ID', details.otId],
    ['Nickname', details.nickname],
    ['Gender', details.gender],
    ['Shiny', details.shiny ? 'Yes' : 'No'],
    ['Poké Ball ID', details.pokeballId],
    ['Ability ID', details.abilityId],
    ['Nature ID', details.natureId],
    ['Happiness', details.happiness],
    ['Met date', details.dateMetAt],
    ['Met level', details.levelMetAt],
    ['Training efficiency', details.trainingEfficiency],
    ['Battle record', `${details.battlesWon} wins · ${details.battlesLost} losses · ${details.kills} KOs · ${details.deaths} deaths`],
    ['IVs', `HP ${details.ivHp} · Atk ${details.ivAttack} · Def ${details.ivDefense} · SpA ${details.ivSpecialAttack} · SpD ${details.ivSpecialDefense} · Spe ${details.ivSpeed}`],
    ['EVs', `HP ${details.evHp} · Atk ${details.evAttack} · Def ${details.evDefense} · SpA ${details.evSpecialAttack} · SpD ${details.evSpecialDefense} · Spe ${details.evSpeed}`],
    ['Final stats', `HP ${details.hp} · Atk ${details.attack} · Def ${details.defense} · SpA ${details.specialAttack} · SpD ${details.specialDefense} · Spe ${details.speed}`],
    ['Current condition', `HP ${details.currentHp} · Strength ${details.currentStrength} · Status ID ${details.statusId}`],
    ['Held item ID', details.heldItemId],
    ['Experience points', details.experiencePoints],
  ];
}

const TrainerRosterProposal: React.FC<TrainerRosterProposalProps> = ({ trainerId, existingPokemonCount }) => {
  const [pokemonCount, setPokemonCount] = React.useState('6');
  const [typeIds, setTypeIds] = React.useState<number[]>([]);
  const [generations, setGenerations] = React.useState<number[]>([]);
  const [proposal, setProposal] = React.useState<RosterProposal | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [appliedMessage, setAppliedMessage] = React.useState<string | null>(null);
  const [selectedPokemon, setSelectedPokemon] = React.useState<RosterPokemonProposal | null>(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    setPokemonCount('6');
    setTypeIds([]);
    setGenerations([]);
    setProposal(null);
    setFormError(null);
    setAppliedMessage(null);
    setSelectedPokemon(null);
  }, [trainerId]);

  const proposalMutation = useMutation({
    mutationFn: (input: { pokemonCount: number; typeIds: number[]; generations: number[] }) => createRosterProposal({
      trainerId,
      ...input,
    }),
    onSuccess: (nextProposal) => {
      setProposal(nextProposal);
      setFormError(null);
      setAppliedMessage(null);
    },
    onError: (error) => {
      setProposal(null);
      setFormError(errorMessage(error));
    },
  });

  const applyMutation = useMutation({
    mutationFn: () => applyRosterProposal({ trainerId, pokemon: proposal?.pokemon ?? [] }),
    onSuccess: async (pokemonCreated) => {
      setProposal(null);
      setSelectedPokemon(null);
      setFormError(null);
      setAppliedMessage(`Created ${pokemonCreated} Pokémon for this trainer.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trainer-management-trainer', trainerId] }),
        queryClient.invalidateQueries({ queryKey: ['trainer-directory'] }),
        queryClient.invalidateQueries({ queryKey: ['trainer-management'] }),
      ]);
    },
    onError: (error) => setFormError(errorMessage(error)),
  });

  const handleGenerate = (): void => {
    const parsedCount = Number(pokemonCount);
    if (!Number.isInteger(parsedCount) || parsedCount < 1 || parsedCount > 24) {
      setFormError('Additional Pokémon must be a whole number between 1 and 24.');
      return;
    }

    setFormError(null);
    proposalMutation.mutate({ pokemonCount: parsedCount, typeIds, generations });
  };

  const clearProposal = (): void => setProposal(null);

  return (
    <Paper className="!p-4 !mt-4 !bg-gray-800">
      <Typography variant="h6" className="!text-white">Roster proposal</Typography>
      <Typography variant="body2" className="!text-gray-400 !mt-1">
        Request additional Pokémon only. Existing roster entries remain untouched, and their species are excluded from this preview.
      </Typography>
      <Typography variant="body2" className="!text-gray-300 !mt-2">
        Current roster: {existingPokemonCount} Pokémon
      </Typography>

      <Alert severity="info" className="!mt-4">
        Generation is non-persisting. Review the complete generated records, then explicitly create those exact records.
      </Alert>

      <Box className="!grid !grid-cols-1 md:!grid-cols-3 !gap-4 !mt-4">
        <TextField
          label="Additional Pokémon"
          type="number"
          value={pokemonCount}
          onChange={(event) => {
            setPokemonCount(event.target.value);
            clearProposal();
          }}
          inputProps={{ min: 1, max: 24, step: 1 }}
          helperText="1–24; this is not a universal roster-size rule."
        />
        <Autocomplete
          multiple
          options={typeOptions}
          value={typeOptions.filter((option) => typeIds.includes(option.id))}
          onChange={(_event, options) => {
            setTypeIds(options.map((option) => option.id));
            clearProposal();
          }}
          getOptionLabel={(option) => option.name}
          renderInput={(params) => <TextField {...params} label="Preferred types" />}
        />
        <Autocomplete
          multiple
          options={generationOptions}
          value={generationOptions.filter((option) => generations.includes(option.id))}
          onChange={(_event, options) => {
            setGenerations(options.map((option) => option.id));
            clearProposal();
          }}
          getOptionLabel={(option) => option.name}
          renderInput={(params) => <TextField {...params} label="Preferred generations" />}
        />
      </Box>

      <Button
        variant="contained"
        className="!mt-4 !bg-blue-600 hover:!bg-blue-700"
        onClick={handleGenerate}
        disabled={proposalMutation.isPending}
      >
        {proposalMutation.isPending ? 'Generating…' : 'Generate roster preview'}
      </Button>

      {formError && <Alert severity="error" className="!mt-4">{formError}</Alert>}
      {appliedMessage && <Alert severity="success" className="!mt-4">{appliedMessage}</Alert>}
      {proposalMutation.isPending && <CircularProgress size={24} className="!ml-3" />}

      {proposal && (
        <Box className="!mt-5">
          {proposal.notices.map((notice) => <Alert key={notice} severity="info" className="!mb-2">{notice}</Alert>)}
          <Typography className="!text-gray-300 !mb-2">
            Current roster: {proposal.existingPokemonCount} Pokémon · Generator baseline: {proposal.overallRating.toFixed(1)} overall
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell className="!text-white">Pokémon</TableCell>
                  <TableCell className="!text-white">Level</TableCell>
                  <TableCell className="!text-white">Types</TableCell>
                  <TableCell className="!text-white">Form</TableCell>
                  <TableCell className="!text-white">Review</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proposal.pokemon.map((pokemon) => (
                  <TableRow key={`${pokemon.speciesId}-${pokemon.pokemonId}`}>
                    <TableCell>{pokemon.name}</TableCell>
                    <TableCell>{pokemon.level}</TableCell>
                    <TableCell>{preferenceNames(pokemon.typeIds, typeOptions)}</TableCell>
                    <TableCell>
                      {pokemon.isMega ? 'Mega' : pokemon.isGigantamax ? 'Gigantamax' : 'Standard'}
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => setSelectedPokemon(pokemon)}>
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button
            variant="contained"
            color="success"
            className="!mt-4"
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending || proposal.pokemon.length === 0}
          >
            {applyMutation.isPending ? 'Creating Pokémon…' : `Create ${proposal.pokemon.length} reviewed Pokémon`}
          </Button>
        </Box>
      )}
      <Dialog open={selectedPokemon !== null} onClose={() => setSelectedPokemon(null)} fullWidth maxWidth="sm">
        <DialogTitle>{selectedPokemon?.name} generated details</DialogTitle>
        <DialogContent dividers>
          <Box className="!grid !grid-cols-1 sm:!grid-cols-2 !gap-x-6 !gap-y-3">
            {selectedPokemon && detailEntries(selectedPokemon).map(([label, value]) => (
              <Box key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2">{value}</Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPokemon(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TrainerRosterProposal;
