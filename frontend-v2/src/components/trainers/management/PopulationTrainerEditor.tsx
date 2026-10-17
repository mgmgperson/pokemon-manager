import { TrainerPeakEstimateFields } from '../TrainerPeakEstimates';
import { useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Checkbox, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControlLabel, MenuItem, Tab, Tabs, TextField, Typography } from '@mui/material';
import { fieldNamesMap } from '../../../types/trainer';
import type { ManagementCity } from './trainerManagementData';
import type { PopulationTrainer } from './populationData';

interface Props { trainer: PopulationTrainer; cities: ManagementCity[]; busy: boolean; serverError: string | null; onClose: () => void; onReview: (trainer: unknown) => void; }
function fieldLabel(key: string): string {
  return fieldNamesMap[key as keyof typeof fieldNamesMap] ?? key.replace(/_rating$|Rating$/g, '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\b(Iv|Ev|Ot|Hp|Id)\b/g, (word) => word.toUpperCase());
}
export default function PopulationTrainerEditor({ trainer, cities, busy, serverError, onClose, onReview }: Props): React.JSX.Element {
  const [draft, setDraft] = useState<PopulationTrainer>(() => structuredClone(trainer));
  const [tab, setTab] = useState(0);
  const [json, setJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const number = (value: string): number => value.trim() ? Number(value) : NaN;
  const profile = (key: keyof PopulationTrainer['profile'], value: string | number | null): void => setDraft((current) => {
    const next = { ...current.profile, [key]: value };
    return { ...current, profile: next, pokemon: key === 'fname' || key === 'lname'
      ? current.pokemon.map((member) => ({ ...member, details: { ...member.details, otName: `${next.fname} ${next.lname}` } })) : current.pokemon };
  });
  const numeric = (label: string, value: number, onChange: (value: number) => void): React.JSX.Element => <TextField
    size="small" type="number" label={label} value={Number.isFinite(value) ? value : ''} disabled={busy}
    onChange={(event) => onChange(number(event.target.value))} />;
  const official = (label: string, key: 'pwtrRating' | 'peakRating' | 'peakRank'): React.JSX.Element => <TextField
    size="small" type="number" label={label} value={draft.profile[key] ?? ''} disabled={busy}
    helperText={!draft.profile.activeStatus ? 'Leave unknown unless you are authoring a known official value.' : undefined}
    onChange={(event) => profile(key, !event.target.value.trim() && !draft.profile.activeStatus ? null : number(event.target.value))} />;
  const submit = (): void => {
    try {
      const edited: unknown = tab === 3 ? JSON.parse(json) : JSON.parse(JSON.stringify(draft, (_key, value: unknown) => {
        if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Complete every numeric field before reviewing.');
        return value;
      }));
      setError(null); onReview(edited);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Check the edited record.'); }
  };
  return <Dialog open onClose={() => { if (!busy) onClose(); }} fullWidth maxWidth="lg">
    <DialogTitle>Inspect / edit {trainer.profile.fname} {trainer.profile.lname}</DialogTitle>
    <DialogContent dividers>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Edits stay in this dialog until you review them. Reviewing recalculates dependent ratings and stats before confirmation.</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {serverError && <Alert severity="error">{serverError}</Alert>}
      <Tabs value={tab} onChange={(_event, value: number) => {
        if (value === 3) setJson(JSON.stringify(draft, null, 2));
        setTab(value);
      }}><Tab label="Profile" disabled={busy} /><Tab label="Ratings" disabled={busy} /><Tab label="Pokémon" disabled={busy} /><Tab label="Advanced record" disabled={busy} /></Tabs>
      {tab === 0 && <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 2, mt: 2 }}>
        <TextField label="First name" value={draft.profile.fname} disabled={busy} onChange={(event) => profile('fname', event.target.value)} />
        <TextField label="Last name" value={draft.profile.lname} disabled={busy} onChange={(event) => profile('lname', event.target.value)} />
        <TextField label="Birthdate" type="date" value={draft.profile.birthdate} disabled={busy} slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => profile('birthdate', event.target.value)} />
        <TextField select label="Hometown" value={draft.profile.hometownCityId ?? ''} disabled={busy || cities.length === 0}
          onChange={(event) => {
            const city = cities.find((candidate) => candidate.id === Number(event.target.value));
            if (city) setDraft((current) => ({ ...current, profile: { ...current.profile, hometownCityId: city.id, hometownName: city.name } }));
          }}>
          {!cities.some((city) => city.id === draft.profile.hometownCityId) && <MenuItem value={draft.profile.hometownCityId}>{draft.profile.hometownName}</MenuItem>}
          {cities.filter((city) => city.region_id === draft.profile.regionId).map((city) => <MenuItem key={city.id} value={city.id}>{city.name}</MenuItem>)}
        </TextField>
        {official('Current PWTR', 'pwtrRating')}
        {official('Peak PWTR', 'peakRating')}
        {official('Peak rank', 'peakRank')}
        <TrainerPeakEstimateFields ability={draft.profile.estimatedPeakAbility} year={draft.profile.estimatedPeakAbilityYear} disabled={busy}
          onAbility={(value) => profile('estimatedPeakAbility', value)} onYear={(value) => profile('estimatedPeakAbilityYear', value)} />
      </Box>}
      {!draft.profile.activeStatus && <Typography variant="body2" sx={{ mt: 2 }}>Inactive · current ability {draft.generalRatings.overallRating} · estimated peak {draft.profile.estimatedPeakAbility ?? 'unknown'} · decline {draft.profile.estimatedPeakAbility == null ? 'unknown' : draft.profile.estimatedPeakAbility - draft.generalRatings.overallRating} points. Decline is derived from the reviewed peak/current values.</Typography>}
      {tab === 1 && <Box sx={{ mt: 2 }}>{(['generalRatings', 'formatRatings', 'mentalRatings', 'fieldRatings'] as const).map((family) => <Accordion key={family} defaultExpanded={family === 'generalRatings'}>
        <AccordionSummary>{family.replace('Ratings', ' ratings')}</AccordionSummary><AccordionDetails>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 2 }}>
            {Object.entries(draft[family]).map(([key, value]) => <Box key={key}>{numeric(fieldLabel(key), value, (next) => setDraft((current) => ({ ...current, [family]: { ...current[family], [key]: next } })))}</Box>)}
          </Box>
        </AccordionDetails>
      </Accordion>)}</Box>}
      {tab === 2 && <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{draft.pokemon.length} owned Pokémon. {draft.profile.activeStatus ? 'Acquisition dates and battle counters are generated estimates.' : 'Acquisition dates are estimates; counters start unrecorded at zero. Manual edits are authored estimates, not event history.'}</Typography>
        {draft.pokemon.map((member, index) => <Accordion key={index} slotProps={{ transition: { unmountOnExit: true } }}>
          <AccordionSummary>{member.name} · level {member.level}{member.isMega ? ' · Mega' : ''}{member.isGigantamax ? ' · Gigantamax' : ''}</AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              {numeric(`${member.name} level`, member.level, (level) => setDraft((current) => ({ ...current, pokemon: current.pokemon.map((other, otherIndex) => otherIndex === index ? { ...other, level } : other) })))}
              {(['isMega', 'isGigantamax'] as const).map((flag) => <FormControlLabel key={flag} label={flag === 'isMega' ? 'Mega' : 'Gigantamax'} control={<Checkbox checked={member[flag]} disabled={busy}
                onChange={(event) => setDraft((current) => ({ ...current, pokemon: current.pokemon.map((other, otherIndex) => otherIndex === index ? { ...other, [flag]: event.target.checked } : other) }))} />} />)}
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 2 }}>
              {Object.entries(member.details).map(([key, value]) => {
                const update = (next: string | number | boolean): void => setDraft((current) => ({ ...current,
                  pokemon: current.pokemon.map((other, otherIndex) => otherIndex === index ? { ...other, details: { ...other.details, [key]: next } } : other) }));
                const label = `${member.name} ${fieldLabel(key)}`;
                return typeof value === 'boolean' ? <FormControlLabel key={key} label={label} control={<Checkbox checked={value} disabled={busy} onChange={(event) => update(event.target.checked)} />} />
                  : typeof value === 'number' ? <Box key={key}>{numeric(label, value, update)}</Box>
                    : <TextField key={key} size="small" label={label} value={value} disabled={busy || key === 'otName'} onChange={(event) => update(event.target.value)} />;
              })}
            </Box>
          </AccordionDetails>
        </Accordion>)}
      </Box>}
      {tab === 3 && <TextField sx={{ mt: 2 }} fullWidth multiline minRows={18} maxRows={30} label="Complete trainer JSON" value={json} disabled={busy}
        onChange={(event) => setJson(event.target.value)} helperText="Use for catalog species/form edits or chat-authored changes. Review validates the complete record; switching back leaves these JSON edits unused." />}
    </DialogContent>
    <DialogActions><Button disabled={busy} onClick={onClose}>Cancel edits</Button><Button disabled={busy} variant="contained" onClick={submit}>{busy ? 'Reviewing…' : 'Review edits'}</Button></DialogActions>
  </Dialog>;
}
