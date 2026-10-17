import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Paper, Step, StepLabel, Stepper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import PopulationBriefForm from './PopulationBriefForm';
import PopulationTrainerEditor from './PopulationTrainerEditor';
import { PopulationPlanSummary, PopulationReviewSummary } from './PopulationReviewSummary';
import { emptyPopulationBrief, populationBriefDraft, populationBriefInput, populationPlanningInput } from './populationBrief';
import { applyPopulation, exportPopulationJson, fetchPopulation, planPopulation, populationError, proposePopulation, rerollPopulation,
  reviewPopulation, specialKinds, validatePopulationBrief, type PopulationPlan, type PopulationProposal, type PopulationReceipt, type PopulationReview, type RerollSection } from './populationData';
import { fetchManagementCities } from './trainerManagementData';

export default function PopulationWorkbench({ active }: { active: boolean }): React.JSX.Element {
  const client = useQueryClient();
  const [brief, setBrief] = useState(emptyPopulationBrief);
  const [plan, setPlan] = useState<PopulationPlan | null>(null);
  const [draft, setDraft] = useState<PopulationProposal | null>(null);
  const [review, setReview] = useState<PopulationReview | null>(null);
  const [receipt, setReceipt] = useState<PopulationReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState<string | null>(null);
  const [rerollKey, setRerollKey] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<PopulationReview | null>(null);
  const [discard, setDiscard] = useState(false);
  const [importMode, setImportMode] = useState<'brief' | 'proposal' | null>(null);
  const [importText, setImportText] = useState('');
  const inspectionQuery = useQuery({ queryKey: ['trainer-population', 'inspection'], queryFn: fetchPopulation,
    enabled: active, retry: false, refetchOnMount: 'always' });
  const inspection = inspectionQuery.data;
  const citiesQuery = useQuery({ queryKey: ['trainer-population', 'cities', inspection?.snapshot], queryFn: fetchManagementCities,
    enabled: active && !!inspection, retry: false });
  const fail = (failure: unknown): void => {
    setError(populationError(failure)); setReview(null); setConfirmation(null);
    void inspectionQuery.refetch();
  };
  const acceptReview = (next: PopulationReview): void => {
    setDraft(next.proposal); setReview(next); setBrief(populationBriefDraft(next.proposal.brief)); setPlan(next.proposal.plan);
    setError(null); setEditorKey(null); setRerollKey(null); setImportMode(null); setReceipt(null);
  };
  const planMutation = useMutation({ mutationFn: planPopulation, onSuccess: (next) => { setPlan(next); setError(null); }, onError: fail });
  const proposalMutation = useMutation({ mutationFn: proposePopulation, onSuccess: (next) => {
    setDraft(next); setPlan(next.plan); setReview(null); setReceipt(null); setError(null);
  }, onError: fail });
  const reviewMutation = useMutation({ mutationFn: reviewPopulation, onSuccess: acceptReview, onError: fail });
  const briefMutation = useMutation({ mutationFn: (input: unknown) => validatePopulationBrief(input, inspection!.snapshot),
    onSuccess: (next) => { setBrief(populationBriefDraft(next.brief)); setPlan(next.plan); setError(null); setImportMode(null); }, onError: fail });
  const rerollMutation = useMutation({ mutationFn: (input: { key: string; section: RerollSection }) => rerollPopulation(draft!, input.key, input.section), onSuccess: acceptReview, onError: fail });
  const applyMutation = useMutation({ mutationFn: applyPopulation, onSuccess: async (created) => {
    setReceipt(created); setConfirmation(null); setError(null); setEditorKey(null); setRerollKey(null);
    await Promise.all(['trainer-population', 'trainer-directory', 'trainer-management', 'trainer-options', 'trainer-rating-leaderboard',
      'scoped-trainer-directory', 'regions', 'region', 'cities', 'city'].map((key) => client.invalidateQueries({ queryKey: [key] })));
  }, onError: fail });
  const busy = planMutation.isPending || proposalMutation.isPending || reviewMutation.isPending || briefMutation.isPending || rerollMutation.isPending || applyMutation.isPending;
  const stale = !!draft && !!inspection && draft.snapshot !== inspection.snapshot && !receipt;
  const planCurrent = !!plan && !!inspection && plan.inspection.snapshot === inspection.snapshot;
  const selected = draft?.trainers.find((trainer) => trainer.key === editorKey);
  const rerollTrainer = draft?.trainers.find((trainer) => trainer.key === rerollKey);
  const guard = (work: () => void): void => { try { setError(null); work(); } catch (failure) { setError(populationError(failure)); } };
  const reset = (): void => {
    setDraft(null); setReview(null); setReceipt(null); setPlan(null); setError(null); setDiscard(false);
    setEditorKey(null); setRerollKey(null); setConfirmation(null); void inspectionQuery.refetch();
  };
  const load = (): void => guard(() => {
    const input: unknown = JSON.parse(importText);
    if (importMode === 'brief') briefMutation.mutate(input); else { setReview(null); reviewMutation.mutate(input); }
  });
  return <Box sx={{ mt: 3 }}>
    <Typography variant="h5" gutterBottom>Regional competitive population</Typography>
    <Typography color="text.secondary" sx={{ mb: 2 }}>Build active competitors or inactive cohorts in small batches. Choose settings, preview complete trainers, then review and confirm the batch.</Typography>
    <Stepper activeStep={draft ? review ? 2 : 1 : 0} sx={{ mb: 3 }}>{['Choose brief', 'Inspect / edit draft', 'Review and confirm'].map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>
    {inspectionQuery.isLoading && <CircularProgress aria-label="Loading population coverage" />}
    {inspectionQuery.error && <Alert severity="error" action={<Button onClick={() => void inspectionQuery.refetch()}>Retry inspection</Button>}>{populationError(inspectionQuery.error)} Select a save first if none is active.</Alert>}
    {inspection && <>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2">Selected save: {inspection.databaseFile}</Typography><Typography variant="body2">World date: {inspection.gameDate}</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          <Chip label={`${inspection.counts.active.toLocaleString()} active`} /><Chip label={`${inspection.counts.inactive.toLocaleString()} inactive`} />
          <Chip label={`${inspection.counts.activeInCoverage.toLocaleString()} at ${inspection.ratingFloor.toLocaleString()}+ PWTR`} />
          <Chip label={`${inspection.referenceCount.toLocaleString()} reference positions`} />
        </Box>
        <Typography variant="body2" sx={{ mt: 1 }}>Reference projection: {inspection.referenceProjection.active.toLocaleString()} active trainers, retaining existing excesses and protected gaps.</Typography>
        <Button size="small" disabled={busy || inspectionQuery.isFetching} onClick={() => void inspectionQuery.refetch()}>Refresh coverage</Button>
        {!inspection.protection.ready && brief.cohort === 'active' && <Alert severity="warning">Resolve the protected elite boundary before generating a batch.</Alert>}
        <Accordion><AccordionSummary>Coverage notes and existing ages</AccordionSummary><AccordionDetails>
          {inspection.issues.map((issue) => <Typography key={issue} variant="body2" sx={{ mb: 1 }}>{issue}</Typography>)}
          <Box sx={{ overflowX: 'auto', mb: 2 }}><Table size="small" aria-label="Regional population coverage"><TableHead><TableRow><TableCell>Region</TableCell><TableCell>Active</TableCell><TableCell>Inactive</TableCell><TableCell>3,000+ PWTR</TableCell></TableRow></TableHead>
            <TableBody>{inspection.regions.map((region) => <TableRow key={region.id}><TableCell>{region.name}</TableCell><TableCell>{region.counts.active}</TableCell><TableCell>{region.counts.inactive}</TableCell><TableCell>{region.counts.activeInCoverage}</TableCell></TableRow>)}</TableBody></Table></Box>
          <Box sx={{ maxHeight: 240, overflow: 'auto' }}><Table size="small"><TableHead><TableRow><TableCell>Age</TableCell><TableCell>All active</TableCell><TableCell>3,000+ PWTR</TableCell></TableRow></TableHead>
            <TableBody>{inspection.ageCounts.map((age) => <TableRow key={age.age}><TableCell>{age.age}</TableCell><TableCell>{age.allActive}</TableCell><TableCell>{age.inCoverage}</TableCell></TableRow>)}</TableBody></Table></Box>
        </AccordionDetails></Accordion>
      </Paper>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Button variant="outlined" disabled={busy || !!draft} onClick={() => { setImportMode('brief'); setImportText(''); setError(null); }}>Load brief JSON</Button>
        <Button variant="outlined" disabled={busy} onClick={() => { setImportMode('proposal'); setImportText(''); setError(null); }}>Import proposal / review</Button>
        <Button disabled={busy} onClick={() => guard(() => exportPopulationJson(draft?.brief ?? populationBriefInput(brief, inspection), 'population-brief.json'))}>Export brief</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {citiesQuery.error && <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => void citiesQuery.refetch()}>Retry hometowns</Button>}>Hometown choices could not be loaded. Existing proposal values are retained.</Alert>}
      {inspection.regions.length === 0 && <Alert severity="info" sx={{ mb: 2 }}>This save has no regions. Complete geographic baselines before planning trainers.</Alert>}
      {stale && <Alert severity="warning" sx={{ mb: 2 }}>The selected save changed since this batch was generated. Export the draft, then start a fresh batch against the current save. Reviewed records have been retained.</Alert>}
      {busy && <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}><CircularProgress size={20} /><Typography>Working on this batch…</Typography></Box>}
      {!draft && <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Generation brief</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Enter settings here or load a jointly prepared brief. Numeric choices have no automatic defaults; previously entered choices are retained.</Typography>
        <PopulationBriefForm value={brief} inspection={inspection} disabled={busy} onChange={(next) => { setBrief(next); setPlan(null); setError(null); }} />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
          <Button variant="outlined" disabled={busy || (brief.cohort === 'active' && !inspection.protection.ready)} onClick={() => guard(() => planMutation.mutate(populationPlanningInput(brief, inspection)))}>Plan targets</Button>
          <Button variant="contained" disabled={busy || !planCurrent || (brief.cohort === 'active' && !inspection.protection.ready)} onClick={() => guard(() => proposalMutation.mutate(populationBriefInput(brief, inspection)))}>Generate unsaved batch</Button>
        </Box>
        {plan && <PopulationPlanSummary plan={plan} />}
      </Paper>}
      {draft && <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>Batch: {draft.trainers.length} trainer{draft.trainers.length === 1 ? '' : 's'} · {draft.trainers.reduce((sum, trainer) => sum + trainer.pokemon.length, 0)} Pokémon</Typography>
          <Button disabled={busy} onClick={() => exportPopulationJson(draft, `population-${draft.proposalId}.json`)}>Export proposal</Button>
          <Button disabled={busy || !review} onClick={() => exportPopulationJson(review, `population-review-${draft.proposalId}.json`)}>Export review</Button>
          <Button disabled={busy} onClick={() => setDiscard(true)}>{receipt ? 'Start another batch' : 'Discard batch'}</Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Switching manager tabs keeps this draft. Export it to resume after leaving or reloading this page.</Typography>
        {draft.trainers.length === 0 && <Alert severity="info">No trainers retained. Restore one through import or discard this batch.</Alert>}
        <Box sx={{ overflowX: 'auto' }}><Table size="small" aria-label="Population batch trainers"><TableHead><TableRow>
          <TableCell>Trainer</TableCell><TableCell>Age</TableCell><TableCell>PWTR</TableCell><TableCell>Current overall / peak estimate</TableCell><TableCell>Owned Pokémon</TableCell><TableCell>Exceptional ownership</TableCell><TableCell>Actions</TableCell>
        </TableRow></TableHead><TableBody>{draft.trainers.map((trainer) => <TableRow key={trainer.key}>
          <TableCell>{trainer.profile.fname} {trainer.profile.lname}<Typography variant="caption" display="block">{trainer.profile.hometownName}</Typography>
            {trainer.notices.map((notice) => <Typography key={notice} variant="caption" display="block" color="warning.main">{notice}</Typography>)}</TableCell>
          <TableCell>{trainer.age}</TableCell><TableCell>{trainer.profile.pwtrRating === null ? 'Unknown' : trainer.profile.pwtrRating.toFixed(2)}</TableCell><TableCell>{trainer.generalRatings.overallRating}{!trainer.profile.activeStatus && <Typography variant="caption" display="block">Peak {trainer.profile.estimatedPeakAbility ?? 'unknown'} · decline {trainer.declinePoints} · year {trainer.profile.estimatedPeakAbilityYear ?? 'unknown'}</Typography>}</TableCell><TableCell>{trainer.pokemon.length}</TableCell>
          <TableCell>{specialKinds.filter((kind) => trainer.specialOwnership[kind] > 0).map((kind) => `${kind}: ${trainer.specialOwnership[kind]}`).join(', ') || 'None'}</TableCell>
          <TableCell><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button size="small" disabled={busy || !!receipt} onClick={() => { setEditorKey(trainer.key); setError(null); }}>Inspect / edit</Button>
            <Button size="small" disabled={busy || stale || !!receipt} onClick={() => { setRerollKey(trainer.key); setError(null); }}>Reroll…</Button>
            <Button size="small" color="warning" disabled={busy || !!receipt} onClick={() => { setDraft({ ...draft, trainers: draft.trainers.filter((current) => current.key !== trainer.key) }); setReview(null); setError(null); }}>Remove</Button>
          </Box></TableCell>
        </TableRow>)}</TableBody></Table></Box>
        {!receipt && <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
          <Button variant="outlined" disabled={busy || stale || draft.trainers.length === 0} onClick={() => { setReview(null); reviewMutation.mutate(draft); }}>Review batch</Button>
          <Button variant="contained" color="success" disabled={busy || stale || !review} onClick={() => setConfirmation(review)}>Apply reviewed batch…</Button>
        </Box>}
        {review && <PopulationReviewSummary review={review} />}
        {receipt && <Alert severity="success" sx={{ mt: 2 }}>Created {receipt.created.length} trainer{receipt.created.length === 1 ? '' : 's'} and {receipt.created.reduce((sum, trainer) => sum + trainer.pokemonIds.length, 0)} Pokémon.
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>{receipt.created.map((trainer) => <Link key={trainer.key} to={`/trainers/${trainer.trainerId}`}>Trainer #{trainer.trainerId}</Link>)}</Box>
          <Button onClick={() => exportPopulationJson(receipt, `population-receipt-${receipt.proposalId}.json`)}>Export receipt</Button>
        </Alert>}
      </Paper>}
    </>}
    {selected && <PopulationTrainerEditor key={selected.key} trainer={selected} cities={citiesQuery.data ?? []} busy={busy} serverError={error}
      onClose={() => { setEditorKey(null); setError(null); }} onReview={(trainer) => { setReview(null); reviewMutation.mutate({ ...draft, trainers: draft!.trainers.map((current) => current.key === selected.key ? trainer : current) }); }} />}
    <Dialog open={!!rerollTrainer} onClose={() => { if (!busy) setRerollKey(null); }} fullWidth maxWidth="sm">
      <DialogTitle>Reroll {rerollTrainer?.profile.fname} {rerollTrainer?.profile.lname}</DialogTitle><DialogContent>
        <Typography>Choose what to replace. Whole-trainer rerolls use the chosen cohort ranges (or current active rating and age bands); section rerolls preserve the profile. Other trainers retain their values.</Typography>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent><DialogActions><Button disabled={busy} onClick={() => setRerollKey(null)}>Cancel reroll</Button>
        {(['trainer', 'ratings', 'roster'] as const).map((section) => <Button key={section} disabled={busy || stale} onClick={() => rerollMutation.mutate({ key: rerollKey!, section })}>Reroll {section}</Button>)}
      </DialogActions>
    </Dialog>
    <Dialog open={confirmation !== null} onClose={() => { if (!busy) setConfirmation(null); }} fullWidth maxWidth="sm">
      <DialogTitle>Create the reviewed batch?</DialogTitle><DialogContent>
        {confirmation && <><Typography>{confirmation.proposal.summary.trainerCount} trainers and {confirmation.proposal.summary.pokemonCount} Pokémon will be created together.</Typography>
          <Typography sx={{ mt: 2 }}>Save: {confirmation.proposal.plan.inspection.databaseFile}</Typography><Typography>World date: {confirmation.proposal.plan.inspection.gameDate}</Typography>
          <Typography sx={{ mt: 2 }}>{confirmation.proposal.summary.exceptionalTrainers} trainers have exceptional ownership. Existing trainers and history are preserved.</Typography></>}
        {stale && <Alert severity="warning">The save changed. Confirmation is disabled; export your draft and start a fresh batch.</Alert>}
      </DialogContent><DialogActions><Button disabled={busy} onClick={() => setConfirmation(null)}>Cancel</Button>
        <Button variant="contained" color="success" disabled={busy || stale || !confirmation || confirmation.reviewToken !== review?.reviewToken}
          onClick={() => applyMutation.mutate(confirmation!)}>{applyMutation.isPending ? 'Creating…' : 'Confirm and create trainers'}</Button></DialogActions>
    </Dialog>
    <Dialog open={discard} onClose={() => setDiscard(false)}><DialogTitle>{receipt ? 'Start another batch?' : 'Discard this unsaved batch?'}</DialogTitle>
      <DialogContent><Typography>Export first if you want to resume this batch later. Your explicit brief settings will be retained.</Typography></DialogContent>
      <DialogActions><Button onClick={() => setDiscard(false)}>Keep batch</Button><Button color="warning" onClick={reset}>Continue with a new batch</Button></DialogActions>
    </Dialog>
    <Dialog open={importMode !== null} onClose={() => { if (!busy) setImportMode(null); }} fullWidth maxWidth="md">
      <DialogTitle>{importMode === 'brief' ? 'Load generation brief' : 'Import proposal or review'}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>{importMode === 'brief' ? 'Load the settings prepared together in chat. They will be checked against the currently selected save without generating trainers.'
          : 'Import a CLI-exported proposal or review. Records are validated without regenerating them. A successful import replaces the displayed batch.'}</Typography>
        {draft && <Alert severity="warning" sx={{ mb: 2 }}>Export the current batch first if you want to keep it.</Alert>}
        <Button component="label" disabled={busy}>Choose JSON file<input hidden type="file" accept=".json,application/json" onChange={(event) => {
          const file = event.target.files?.[0]; event.target.value = '';
          if (file) { if (file.size > 10 * 1024 * 1024) setError('Choose a JSON file under 10 MB.');
            else void file.text().then(setImportText).catch((failure: unknown) => setError(populationError(failure))); }
        }} /></Button>
        <TextField fullWidth multiline minRows={12} maxRows={24} label="Brief or proposal JSON" value={importText} disabled={busy} onChange={(event) => setImportText(event.target.value)} />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent><DialogActions><Button disabled={busy} onClick={() => setImportMode(null)}>Cancel import</Button><Button variant="contained" disabled={busy || !inspection || !importText.trim()} onClick={load}>{importMode === 'brief' ? 'Load brief' : 'Import and review'}</Button></DialogActions>
    </Dialog>
  </Box>;
}
