import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, Link, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { errorMessage, formatPopulation } from './cityManagementData';
import { applyMunicipalities, draftConflict, fetchMunicipalityReview, generateMunicipalities, generationConflict,
  municipalityNameWarnings, namingStyleLabel, numericInput, parseDraftCities, rerollMunicipalityName, resolvePopulationBudget, reviewMunicipalities,
  type DraftMunicipality, type MunicipalityProposal, type PopulationBudgetMode, type ReviewedMunicipalities } from './municipalityData';
import MunicipalityDraftTable from './MunicipalityDraftTable';
import MunicipalityPointDialog from './MunicipalityPointDialog';
import CityLocationMap from './CityLocationMap';
import { municipalityProfiles, profileCityCount } from './municipalityProfiles';

export default function MunicipalityEditor({ locationId, regionName }: { locationId: number; regionName: string }): React.JSX.Element {
  const queryClient = useQueryClient();
  const reviewQuery = useQuery({ queryKey: ['city-management', 'generation-review', locationId],
    queryFn: () => fetchMunicipalityReview(locationId), retry: false, refetchOnWindowFocus: false });
  const [settings, setSettings] = useState({ cityCount: '6', populationBudget: '', budgetPercentage: '', minimumPopulation: '1000', alpha: '1.2', offset: '0', namingStyle: 'pokemon', islandNamePercent: '0' });
  const [budgetMode, setBudgetMode] = useState<PopulationBudgetMode>('amount');
  const [profileId, setProfileId] = useState('');
  const [mixedStyles, setMixedStyles] = useState<string[]>(['pokemon', 'english']);
  const [proposal, setProposal] = useState<MunicipalityProposal | null>(null);
  const [cities, setCities] = useState<DraftMunicipality[]>([]);
  const [pointEditorIndex, setPointEditorIndex] = useState<number | null>(null);
  const [confirmation, setConfirmation] = useState<ReviewedMunicipalities | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const review = reviewQuery.data;
  const parameters = { cityCount: numericInput(settings.cityCount), populationBudget: resolvePopulationBudget(
    budgetMode === 'amount' ? settings.populationBudget : settings.budgetPercentage, budgetMode, review?.remainingPopulation ?? null),
    minimumPopulation: numericInput(settings.minimumPopulation), alpha: numericInput(settings.alpha), offset: numericInput(settings.offset), namingStyle: settings.namingStyle,
    islandNamePercent: numericInput(settings.islandNamePercent),
    ...(settings.namingStyle === 'mixed' ? { mixedStyles } : {}) };
  const beginRequest = (): void => { setRequestError(null); setNotice(null); };
  const failedRequest = (error: unknown): void => { setRequestError(errorMessage(error)); void reviewQuery.refetch(); };
  const generation = useMutation({
    mutationFn: () => generateMunicipalities(locationId, review!.snapshot, parameters), onMutate: beginRequest, onError: failedRequest,
    onSuccess: (generated) => { setProposal(generated); setConfirmation(null); setPointEditorIndex(null); setCities(generated.cities.map((city) => ({
      name: city.name, population: String(city.population), x: String(city.point.x), y: String(city.point.y),
      islandName: city.name.endsWith(' Island'),
    }))); },
  });
  const validation = useMutation({
    mutationFn: () => reviewMunicipalities(locationId, { snapshot: proposal!.snapshot, populationBudget: proposal!.parameters.populationBudget,
      minimumPopulation: proposal!.parameters.minimumPopulation, cities: parseDraftCities(cities) }),
    onMutate: beginRequest, onError: failedRequest, onSuccess: setConfirmation,
  });
  const apply = useMutation({
    mutationFn: () => applyMunicipalities(locationId, confirmation!), onMutate: beginRequest, onError: failedRequest,
    onSuccess: async (count) => {
      setProposal(null); setCities([]); setConfirmation(null); setPointEditorIndex(null); setNotice(`Created ${count} new municipalities. Existing cities were unchanged.`);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['city-management'] }),
        queryClient.invalidateQueries({ queryKey: ['cities'] }), queryClient.invalidateQueries({ queryKey: ['city'] }),
        queryClient.invalidateQueries({ queryKey: ['regions'] }), queryClient.invalidateQueries({ queryKey: ['region'] }),
        queryClient.invalidateQueries({ queryKey: ['locations'] }), queryClient.invalidateQueries({ queryKey: ['location'] })]);
    },
  });
  const reroll = useMutation({
    mutationFn: async (index: number) => ({ index, name: await rerollMunicipalityName(locationId, proposal!.snapshot,
      cities[index].rerollStyle ?? proposal!.parameters.namingStyle, cities.map((city) => city.name), proposal!.parameters.mixedStyles, cities[index].islandName) }),
    onMutate: beginRequest, onError: failedRequest,
    onSuccess: ({ index, name }) => setCities((previous) => previous.map((city, row) => row === index ? { ...city, name } : city)),
  });
  const busy = generation.isPending || validation.isPending || apply.isPending || reroll.isPending;
  if (reviewQuery.isLoading) return <CircularProgress aria-label="Loading municipality generation review" />;
  if (reviewQuery.error) return <Alert severity="error" action={<Button onClick={() => void reviewQuery.refetch()}>Retry</Button>}>{errorMessage(reviewQuery.error)}</Alert>;
  if (!review) return <Alert severity="info">No location review available.</Alert>;
  const conflict = generationConflict(review);
  const stale = proposal !== null && proposal.snapshot !== review.snapshot;
  const optionsValid = [parameters.cityCount, parameters.populationBudget, parameters.minimumPopulation].every((value) => Number.isSafeInteger(value) && value > 0)
    && parameters.cityCount <= review.maximumCityCount && parameters.minimumPopulation <= Math.floor(parameters.populationBudget / parameters.cityCount)
    && parameters.populationBudget <= (review.remainingPopulation ?? 0) && Number.isFinite(parameters.alpha) && parameters.alpha >= 0.5 && parameters.alpha <= 3
    && Number.isFinite(parameters.offset) && parameters.offset >= 0 && parameters.offset <= 10
    && Number.isFinite(parameters.islandNamePercent) && parameters.islandNamePercent >= 0 && parameters.islandNamePercent <= 100
    && (settings.namingStyle !== 'mixed' || mixedStyles.length >= 2);
  const resolvedBudgetValid = Number.isSafeInteger(parameters.populationBudget) && parameters.populationBudget > 0
    && review.remainingPopulation !== null && parameters.populationBudget <= review.remainingPopulation;
  const parsedCities = parseDraftCities(cities);
  const nameWarnings = municipalityNameWarnings(parsedCities, review.existingPlaceNames);
  const confirmationNameWarnings = confirmation ? municipalityNameWarnings(confirmation.cities, review.existingPlaceNames) : [];
  const draftProblem = proposal ? draftConflict(parsedCities, proposal) : null;
  const totalPopulation = parsedCities.reduce((sum, city) => sum + city.population, 0);
  const remainingAfterApply = Number.isSafeInteger(totalPopulation) && review.remainingPopulation !== null ? review.remainingPopulation - totalPopulation : null;
  const existingMapCities = review.cities.flatMap(({ name, x_coordinate: x, y_coordinate: y }) =>
    x !== null && y !== null && [x, y].every((value) => Number.isFinite(value) && value >= 0 && value <= 1) ? [{ name, point: { x, y }, proposed: false }] : []);
  const proposedMapCities = parsedCities.map((city, index) => ({ name: city.name, point: city.point, proposed: true, index }))
    .filter((city) => [city.point.x, city.point.y].every((value) => Number.isFinite(value) && value >= 0 && value <= 1));
  const mapCities = [...existingMapCities, ...proposedMapCities];
  const canReview = proposal !== null && !stale && !draftProblem && !conflict && !busy && !reviewQuery.isFetching;
  const editCity = (index: number, field: keyof DraftMunicipality, value: string | boolean): void => {
    setRequestError(null); setCities((previous) => previous.map((city, row) => row === index ? { ...city, [field]: value } : city));
  };
  const selectedProfile = municipalityProfiles.find((profile) => profile.id === profileId);
  const suggestedCityCount = selectedProfile ? profileCityCount(selectedProfile, review.remainingPopulation, review.maximumCityCount) : 0;
  const applyProfile = (): void => {
    if (!selectedProfile) return;
    setSettings((previous) => ({ ...previous, cityCount: String(suggestedCityCount), budgetPercentage: String(selectedProfile.budgetPercentage),
      minimumPopulation: String(selectedProfile.minimumPopulation), alpha: String(selectedProfile.alpha), offset: String(selectedProfile.offset) }));
    setBudgetMode('percentage'); setRequestError(null); setNotice(null);
  };
  return <Box>
    {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
    {requestError && <Alert severity="error" sx={{ mb: 2 }}>{requestError}</Alert>}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' }, gap: 2, mb: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6"><Link component={RouterLink} to={`/locations/${review.id}`} target="_blank" rel="noopener noreferrer" underline="hover">{review.name}</Link></Typography>
        {review.description && <Typography color="text.secondary" sx={{ my: 1 }}>{review.description}</Typography>}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, my: 1 }}>{review.terrains.map((terrain) => <Chip size="small" key={terrain.name} label={terrain.name} />)}</Box>
        <Typography>Location population: {formatPopulation(review.population)}</Typography>
        <Typography>Existing municipalities: {review.cities.length} · Assigned population: {formatPopulation(review.assignedPopulation)}</Typography>
        <Typography>Available population: {formatPopulation(review.remainingPopulation)}</Typography>
        {review.cities.length > 0 && <TableContainer sx={{ mt: 1, maxHeight: 200 }}><Table size="small"><TableBody>
          {review.cities.map((city) => <TableRow key={city.id}><TableCell>
            <Link component={RouterLink} to={`/cities/${city.id}`} target="_blank" rel="noopener noreferrer" underline="hover">{city.name}</Link>
          </TableCell><TableCell align="right">{formatPopulation(city.population)}</TableCell></TableRow>)}
        </TableBody></Table></TableContainer>}
        {conflict && <Alert severity="warning" sx={{ mt: 2 }}>{conflict}</Alert>}
      </Paper>
      <CityLocationMap regionName={regionName} cityName="Municipality preview" point={null} locationName={review.name} polygon={review.polygon} additionalPoints={mapCities} />
    </Box>
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>Generate municipalities</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>Choose how much population to allocate. A lower budget preserves a non-municipal remainder. These settings are proposal heuristics, not world rules.</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
        <TextField select size="small" label="Starter profile" value={profileId} disabled={busy} sx={{ minWidth: 260 }}
          onChange={(event) => setProfileId(event.target.value)}>
          <MenuItem value="">Choose a profile</MenuItem>
          {municipalityProfiles.map((profile) => <MenuItem key={profile.id} value={profile.id}>{profile.name}</MenuItem>)}
        </TextField>
        <Button disabled={busy || !selectedProfile} onClick={applyProfile}>Apply profile</Button>
      </Box>
      {selectedProfile && <Typography variant="body2" sx={{ mb: 1 }}>{selectedProfile.description}</Typography>}
      {selectedProfile && <Typography variant="body2" sx={{ mb: 1 }}>
        Suggested new cities: {suggestedCityCount} · Target average: {formatPopulation(selectedProfile.populationPerCity)} people per generated municipality.
        {suggestedCityCount === 0 ? ' No count fits the available population and minimum size.' : ' Count is scaled to this profile’s share of remaining population, within the generation limit.'}
      </Typography>}
      <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
        Profiles fill count, % of remaining, minimum population, exponent and offset. All values stay editable; naming and existing previews are unchanged.
      </Typography>
      <ToggleButtonGroup size="small" exclusive value={budgetMode} disabled={busy} aria-label="Population budget input mode" sx={{ mb: 2 }}
        onChange={(_event, mode: PopulationBudgetMode | null) => { if (mode !== null) setBudgetMode(mode); }}>
        <ToggleButton value="amount">Amount</ToggleButton>
        <ToggleButton value="percentage">% of remaining</ToggleButton>
      </ToggleButtonGroup>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        {([{ key: 'cityCount', label: 'New municipality count' }, { key: 'populationBudget', label: 'Municipality population budget' },
          { key: 'minimumPopulation', label: 'Minimum city population' }, { key: 'alpha', label: 'Rank-size exponent' }, { key: 'offset', label: 'Rank-size offset' }] as const).map(({ key, label }) => {
          const inputKey = key === 'populationBudget' && budgetMode === 'percentage' ? 'budgetPercentage' : key;
          return <TextField key={key} label={inputKey === 'budgetPercentage' ? 'Budget (% of remaining)' : label} value={settings[inputKey]} disabled={busy}
            onChange={(event) => setSettings((previous) => ({ ...previous, [inputKey]: event.target.value }))}
            error={key === 'populationBudget' && settings[inputKey].trim() !== '' && !resolvedBudgetValid}
            helperText={key === 'populationBudget' ? budgetMode === 'percentage'
              ? `More than 0 to 100% of ${formatPopulation(review.remainingPopulation)} remaining people; rounded down to whole people.`
              : `Maximum ${formatPopulation(review.remainingPopulation)}; enter an explicit budget.`
              : key === 'alpha' ? '0.5–3; higher produces a steeper size distribution.' : key === 'offset' ? '0–10; higher flattens the distribution.' : undefined} />;
        })}
        <TextField select label="Naming style" value={settings.namingStyle} disabled={busy} onChange={(event) => setSettings((previous) => ({ ...previous, namingStyle: event.target.value }))}>
          {review.namingStyles.map((style) => <MenuItem key={style} value={style}>{namingStyleLabel(style)}</MenuItem>)}
        </TextField>
        <TextField label="Island names (%)" value={settings.islandNamePercent} disabled={busy}
          onChange={(event) => setSettings((previous) => ({ ...previous, islandNamePercent: event.target.value }))}
          error={!Number.isFinite(parameters.islandNamePercent) || parameters.islandNamePercent < 0 || parameters.islandNamePercent > 100}
          helperText="0–100; approximate share ending in Island. Naming only, not island count or placement." />
      </Box>
      {settings.namingStyle === 'mixed' && <Box sx={{ mt: 2 }}>
        <Typography variant="body2">Styles in mix · names are split evenly, then shuffled. Select at least two.</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
          {review.namingStyles.filter((style) => style !== 'mixed').map((style) => <FormControlLabel key={style}
            label={namingStyleLabel(style)} control={<Checkbox size="small" disabled={busy} checked={mixedStyles.includes(style)}
              onChange={(_event, checked) => setMixedStyles((previous) => checked ? [...previous, style] : previous.filter((selected) => selected !== style))} />} />)}
        </Box>
        {mixedStyles.length < 2 && <Alert severity="info">Select at least two naming styles before generation.</Alert>}
      </Box>}
      {resolvedBudgetValid && review.remainingPopulation !== null && <Typography sx={{ mt: 2 }}>Resolved budget: {formatPopulation(parameters.populationBudget)} · Remaining after allocation: {formatPopulation(review.remainingPopulation - parameters.populationBudget)}</Typography>}
      <Button variant="contained" sx={{ mt: 2 }} disabled={busy || reviewQuery.isFetching || !!conflict || !optionsValid} onClick={() => generation.mutate()}>
        {generation.isPending ? 'Generating…' : 'Generate city preview'}
      </Button>
      <Typography variant="caption" display="block" sx={{ mt: 1 }}>Generation and name rerolls create no database rows. Generated names avoid existing city/location names across this save.</Typography>
    </Paper>
    {proposal && <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Proposed municipalities</Typography>
      <Typography sx={{ mb: 1 }}>{cities.length} new cities · Budget: {formatPopulation(proposal.parameters.populationBudget)} · Remaining after edited proposal: {formatPopulation(remainingAfterApply)}</Typography>
      <Typography variant="caption" display="block" sx={{ mb: 2 }}>Preview settings: {namingStyleLabel(proposal.parameters.namingStyle)} · Island names {proposal.parameters.islandNamePercent ?? 0}% · Exponent {proposal.parameters.alpha} · Offset {proposal.parameters.offset}. Name rerolls preserve population and coordinates.</Typography>
      <Typography variant="caption" display="block" sx={{ mb: 2 }}>Island toggles apply to the next name reroll; manually edited names stay unchanged until rerolled.</Typography>
      {proposal.parameters.mixedStyles && <Typography variant="caption" display="block" sx={{ mb: 2 }}>
        Proposal mix: {proposal.parameters.mixedStyles.map(namingStyleLabel).join(', ')}. Row rerolls can use this mix or a specific style.
      </Typography>}
      {stale && <Alert severity="warning" sx={{ mb: 2 }}>Geography changed since this preview. Generate a new proposal before applying.</Alert>}
      {draftProblem && <Alert severity="warning" sx={{ mb: 2 }}>{draftProblem}</Alert>}
      {nameWarnings.some(Boolean) && <Alert severity="warning" sx={{ mb: 2 }}>Repeated names are marked below. You can still review and create these cities.</Alert>}
      <MunicipalityDraftTable cities={cities} disabled={busy || stale} onEdit={editCity} onReroll={(index) => reroll.mutate(index)}
        nameWarnings={nameWarnings}
        namingStyles={review.namingStyles.filter((style) => style !== 'mixed' || proposal.parameters.namingStyle === 'mixed')}
        defaultNamingStyle={proposal.parameters.namingStyle}
        onPlace={setPointEditorIndex}
        onRemove={(index) => { setRequestError(null); setCities((previous) => previous.filter((_city, row) => row !== index)); }} />
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Button disabled={busy} onClick={() => { setProposal(null); setCities([]); setConfirmation(null); setPointEditorIndex(null); setRequestError(null); }}>Discard proposal</Button>
        <Button variant="contained" disabled={!canReview} onClick={() => validation.mutate()}>{validation.isPending ? 'Checking…' : 'Review new cities'}</Button>
      </Box>
    </Paper>}
    {pointEditorIndex !== null && review.polygon && cities[pointEditorIndex] && <MunicipalityPointDialog key={pointEditorIndex}
      cityName={cities[pointEditorIndex].name} regionName={regionName} locationName={review.name} polygon={review.polygon}
      point={proposedMapCities.find((city) => city.index === pointEditorIndex)?.point ?? null}
      otherCities={[...existingMapCities, ...proposedMapCities.filter((city) => city.index !== pointEditorIndex)]}
      disabled={busy || stale} onClose={() => setPointEditorIndex(null)} onConfirm={(point) => {
        setRequestError(null); setCities((previous) => previous.map((city, index) => index === pointEditorIndex
          ? { ...city, x: String(point.x), y: String(point.y) } : city)); setPointEditorIndex(null);
      }} />}
    <Dialog open={confirmation !== null} onClose={() => { if (!busy) setConfirmation(null); }} disableEscapeKeyDown={busy} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm new municipalities</DialogTitle>
      <DialogContent>
        <Typography>{regionName} · {review.name}</Typography>
        <Typography>{confirmation?.cities.length} new cities · Population: {formatPopulation(confirmation?.totalPopulation ?? null)}</Typography>
        <Typography>Remaining population after creation: {formatPopulation(confirmation?.remainingPopulation ?? null)}</Typography>
        {confirmationNameWarnings.some(Boolean) && <Alert severity="warning" sx={{ mt: 2 }}>Some names are repeated. Confirmation will create them as entered.</Alert>}
        <Table size="small" sx={{ mt: 1 }}><TableHead><TableRow><TableCell>Name</TableCell><TableCell>Population</TableCell></TableRow></TableHead><TableBody>
          {confirmation?.cities.map((city, index) => <TableRow key={index}><TableCell>{city.name}
            {confirmationNameWarnings[index] && <Typography variant="caption" color="warning.main" display="block">{confirmationNameWarnings[index]}</Typography>}
          </TableCell><TableCell>{formatPopulation(city.population)}</TableCell></TableRow>)}
        </TableBody></Table>
        <Typography color="text.secondary" sx={{ mt: 2 }}>Create these exact reviewed city records in one transaction. Existing cities, trainer hometowns, stadiums, and gym leaders remain unchanged.</Typography>
        {stale && <Alert severity="warning" sx={{ mt: 1 }}>Geography changed. Cancel and generate a new proposal.</Alert>}
        {requestError && <Alert severity="error" sx={{ mt: 1 }}>{requestError}</Alert>}
      </DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setConfirmation(null)}>Cancel</Button>
        <Button variant="contained" disabled={!canReview} onClick={() => apply.mutate()}>{apply.isPending ? 'Creating…' : 'Confirm and create cities'}</Button></DialogActions>
    </Dialog>
  </Box>;
}
