import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import {
  changeCityLocation, errorMessage, fetchLocationBudget, formatPopulation, locationSignalLabels, reviewLocationPopulation,
  type CityLocationReview,
} from './cityManagementData';
import CityLocationMap from './CityLocationMap';

interface Props { review: CityLocationReview; regionName: string; }

export default function CityLocationEditor({ review, regionName }: Props): React.JSX.Element {
  const { city, locations, candidates, point } = review;
  const [persistedLocationId, setPersistedLocationId] = useState(city.location_id);
  const [locationId, setLocationId] = useState(city.location_id);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState('');
  if (persistedLocationId !== city.location_id) {
    setPersistedLocationId(city.location_id);
    setLocationId(city.location_id);
    setConfirmOpen(false);
  }
  const queryClient = useQueryClient();
  const selectedLocation = locations.find((location) => location.id === locationId);
  const currentLocation = locations.find((location) => location.id === city.location_id);
  const budgetQuery = useQuery({
    queryKey: ['city-management', 'budget', locationId],
    queryFn: () => fetchLocationBudget(locationId!),
    enabled: locationId !== null,
    retry: false,
  });
  const budget = budgetQuery.data;
  const { remainingAfterLink, conflict } = reviewLocationPopulation(city, locationId, budget);
  const canApply = locationId !== city.location_id && !conflict
    && (locationId === null || (!!selectedLocation && !!budget && !budgetQuery.isFetching && !budgetQuery.error));
  const mutation = useMutation({
    mutationFn: (targetLocationId: number | null) => changeCityLocation(city.id, targetLocationId),
    onError: () => { if (locationId !== null) void budgetQuery.refetch(); },
    onSuccess: async (_response, targetLocationId) => {
      setConfirmOpen(false);
      setNotice(targetLocationId === null ? `${city.name} is now unlinked.` : `${city.name} is now linked to ${selectedLocation?.name}.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['city-management'] }),
        queryClient.invalidateQueries({ queryKey: ['cities'] }),
        queryClient.invalidateQueries({ queryKey: ['city', String(city.id)] }),
      ]);
    },
  });
  function selectLocation(id: number | null): void {
    setLocationId(id); setNotice(''); mutation.reset();
  }

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">{city.name} · {formatPopulation(city.population)} people</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Current assignment: {city.location_id === null ? 'Unlinked' : currentLocation?.name ?? `Location #${city.location_id} (not in this region)`}
        </Typography>
        {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
        {!locations.length && <Alert severity="info" sx={{ mb: 2 }}>
          No locations have been authored in this region. Create them with the existing location editor before linking cities.
        </Alert>}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Autocomplete options={locations} value={selectedLocation ?? null}
            getOptionLabel={(location) => `${location.name} · #${location.id}`}
            isOptionEqualToValue={(left, right) => left.id === right.id}
            onChange={(_event, location) => selectLocation(location?.id ?? null)}
            disabled={mutation.isPending} sx={{ minWidth: 280, flex: 1 }}
            renderInput={(params) => <TextField {...params} label="Assigned location" helperText="Clear this selection to propose unlinking." />} />
          <Button variant="outlined" onClick={() => setShowSuggestions(true)} disabled={!locations.length || mutation.isPending}>
            Suggest location
          </Button>
        </Box>
        {showSuggestions && <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {candidates.length > 1 ? 'Multiple candidates need author review.' : 'Suggestions are hints, not automatic assignments.'}
          </Typography>
          {!candidates.length && <Alert severity="info">No name or coordinate-based match. Choose a location manually.</Alert>}
          {candidates.map((candidate) => <Box key={candidate.locationId} sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
            <Button onClick={() => selectLocation(candidate.locationId)} disabled={mutation.isPending}>{candidate.locationName}</Button>
            {candidate.signals.map((signal) => <Chip key={signal} size="small" label={locationSignalLabels[signal]}
              color={signal === 'nearest-polygon' ? 'warning' : 'default'} />)}
          </Box>)}
        </Box>}
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, alignItems: 'start' }}>
        <CityLocationMap regionName={regionName} cityName={city.name} point={point}
          locationName={selectedLocation?.name} polygon={selectedLocation?.polygon} />
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Population review</Typography>
          {locationId === null && <Typography color="text.secondary">No location selected. Unlinking preserves all city data.</Typography>}
          {locationId !== null && budgetQuery.isLoading && <CircularProgress aria-label="Loading population budget" />}
          {locationId !== null && budgetQuery.error && <Alert severity="error"
            action={<Button onClick={() => void budgetQuery.refetch()}>Retry</Button>}>{errorMessage(budgetQuery.error)}</Alert>}
          {locationId !== null && budget && !budgetQuery.error && <>
            <Typography>Location population: {formatPopulation(budget.population)}</Typography>
            <Typography>Currently assigned: {formatPopulation(budget.assignedPopulation)}</Typography>
            <Typography>Remaining budget: {formatPopulation(budget.remainingPopulation)}</Typography>
            <Typography sx={{ mt: 1 }}>Remaining after this link: {formatPopulation(remainingAfterLink)}</Typography>
            {remainingAfterLink === 0 && <Alert severity="info" sx={{ mt: 1 }}>Fully municipal: this leaves no budget for additional cities.</Alert>}
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Currently linked cities ({budget.cities.length})</Typography>
            {budget.cities.length === 0 ? <Typography color="text.secondary">None</Typography> : <TableContainer sx={{ maxHeight: 240 }}>
              <Table size="small" aria-label="Currently linked cities">
                <TableHead><TableRow><TableCell>City</TableCell><TableCell align="right">Population</TableCell></TableRow></TableHead>
                <TableBody>{budget.cities.map((assigned) => <TableRow key={assigned.id}>
                  <TableCell>{assigned.name}</TableCell><TableCell align="right">{formatPopulation(assigned.population)}</TableCell>
                </TableRow>)}</TableBody>
              </Table>
            </TableContainer>}
          </>}
          {conflict && <Alert severity="warning" sx={{ mt: 2 }}>{conflict}</Alert>}
          {mutation.error && !confirmOpen && <Alert severity="error" sx={{ mt: 2 }}>{errorMessage(mutation.error)}</Alert>}
          <Button variant="contained" sx={{ mt: 2 }} disabled={!canApply || mutation.isPending} onClick={() => setConfirmOpen(true)}>
            {locationId === null ? 'Review unlink' : 'Review link'}
          </Button>
        </Paper>
      </Box>
      <Dialog open={confirmOpen} onClose={() => { if (!mutation.isPending) setConfirmOpen(false); }} disableEscapeKeyDown={mutation.isPending}>
        <DialogTitle>{locationId === null ? 'Confirm unlink' : 'Confirm location assignment'}</DialogTitle>
        <DialogContent>
          <Typography>{city.name} → {selectedLocation?.name ?? 'Unlinked'}</Typography>
          {locationId !== null && <Typography>Remaining population after linking: {formatPopulation(remainingAfterLink)}</Typography>}
          <Typography color="text.secondary" sx={{ mt: 2 }}>Only the location link changes. Coordinates, population, trainer hometowns, stadiums, and gym leaders stay unchanged.</Typography>
          {conflict && <Alert severity="warning" sx={{ mt: 2 }}>{conflict}</Alert>}
          {mutation.error && <Alert severity="error" sx={{ mt: 2 }}>{errorMessage(mutation.error)}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button disabled={mutation.isPending} onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!canApply || mutation.isPending} onClick={() => mutation.mutate(locationId)}>
            {mutation.isPending ? 'Applying…' : 'Confirm and apply'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
