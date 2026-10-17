import { useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Autocomplete, Box, Button, MenuItem, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import type { PopulationBriefDraft } from './populationBrief';
import { specialKinds, type PopulationInspection } from './populationData';

interface Props {
  value: PopulationBriefDraft; inspection: PopulationInspection; disabled: boolean;
  onChange: (value: PopulationBriefDraft) => void;
}
export default function PopulationBriefForm({ value, inspection, disabled, onChange }: Props): React.JSX.Element {
  const [bulkPopulation, setBulkPopulation] = useState('');
  const [bulkCulture, setBulkCulture] = useState('');
  const change = <Key extends keyof PopulationBriefDraft>(key: Key, next: PopulationBriefDraft[Key]): void => onChange({ ...value, [key]: next });
  const numeric = (label: string, current: string, update: (next: string) => void, helperText?: string): React.JSX.Element => (
    <TextField label={label} type="number" size="small" required value={current} disabled={disabled}
      onChange={(event) => update(event.target.value)} helperText={helperText} />
  );
  return <Box sx={{ display: 'grid', gap: 2 }}>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      <TextField select size="small" label="Population cohort" value={value.cohort} disabled={disabled} sx={{ minWidth: 220 }}
        onChange={(event) => change('cohort', event.target.value as PopulationBriefDraft['cohort'])}>
        <MenuItem value="active">Active competitors</MenuItem><MenuItem value="inactive">Inactive cohort</MenuItem>
      </TextField>
      <TextField select required size="small" label="Batch region" value={value.regionId} disabled={disabled}
        onChange={(event) => change('regionId', event.target.value)} sx={{ minWidth: 220 }}>
        {inspection.regions.map((region) => <MenuItem key={region.id} value={String(region.id)}>{region.name}</MenuItem>)}
      </TextField>
      {numeric('Trainers in batch', value.count, (next) => change('count', next), value.cohort === 'inactive' ? '1–100, an explicit cohort count.' : '1–100, within the planned regional deficit.')}
      <TextField select required size="small" label="Name distribution" value={value.nameGender} disabled={disabled}
        onChange={(event) => change('nameGender', event.target.value as PopulationBriefDraft['nameGender'])} sx={{ minWidth: 220 }}>
        <MenuItem value="random">Random M/F distribution</MenuItem><MenuItem value="M">M distribution</MenuItem><MenuItem value="F">F distribution</MenuItem>
      </TextField>
    </Box>
    {value.cohort === 'inactive' && <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">Choose a small inactive cohort. Current overall ability equals estimated peak ability minus decline in ability points. This creates no official PWTR or career history. There is no automatic retirement age or historical population target.</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {numeric('Inactive age minimum', value.inactiveAgeMinimum, (next) => change('inactiveAgeMinimum', next))}
        {numeric('Inactive age maximum', value.inactiveAgeMaximum, (next) => change('inactiveAgeMaximum', next))}
        {numeric('Peak ability minimum', value.peakMinimum, (next) => change('peakMinimum', next), '0–99 ability scale.')}
        {numeric('Peak ability maximum', value.peakMaximum, (next) => change('peakMaximum', next))}
        {numeric('Decline points minimum', value.declineMinimum, (next) => change('declineMinimum', next))}
        {numeric('Decline points maximum', value.declineMaximum, (next) => change('declineMaximum', next), '0 is allowed. Maximum cannot exceed minimum peak ability.')}
      </Box>
      <TextField select required size="small" label="Inactive Pokémon counters" value={value.battleCounters} disabled={disabled}
        onChange={(event) => change('battleCounters', event.target.value as PopulationBriefDraft['battleCounters'])}
        helperText="This choice is required. Current ability drives strength. Manual counter edits during review remain authored estimates.">
        <MenuItem value="unrecorded-zero">Unrecorded: start at zero</MenuItem>
      </TextField>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <TextField select required size="small" label="Estimated peak years" value={value.peakYearMode} disabled={disabled} sx={{ minWidth: 260 }}
          onChange={(event) => change('peakYearMode', event.target.value as PopulationBriefDraft['peakYearMode'])}>
          <MenuItem value="unknown">Unknown; retain no year</MenuItem><MenuItem value="range">Choose a year range</MenuItem>
        </TextField>
        {value.peakYearMode === 'range' && <>{numeric('Peak year minimum', value.peakYearMinimum, (next) => change('peakYearMinimum', next))}
          {numeric('Peak year maximum', value.peakYearMaximum, (next) => change('peakYearMaximum', next))}</>}
      </Box>
    </Box>}
    {value.cohort === 'active' && <><Accordion defaultExpanded>
      <AccordionSummary>Worldwide regional allocation</AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Choose weights for every region. Unfinished regions retain their share. Culture weights affect representation in stronger rating bands.</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <TextField size="small" type="number" label="Population multiplier for all regions" value={bulkPopulation} disabled={disabled} onChange={(event) => setBulkPopulation(event.target.value)} />
          <TextField size="small" type="number" label="Culture multiplier for all regions" value={bulkCulture} disabled={disabled} onChange={(event) => setBulkCulture(event.target.value)} />
          <Button disabled={disabled || !bulkPopulation.trim() || !bulkCulture.trim() || !Number.isFinite(Number(bulkPopulation)) || !Number.isFinite(Number(bulkCulture))}
            onClick={() => change('weights', Object.fromEntries(inspection.regions.map((region) => [region.id, { population: bulkPopulation, culture: bulkCulture }])))}>Set all weights</Button>
        </Box>
        <Box sx={{ overflowX: 'auto' }}><Table size="small" aria-label="Regional allocation weights"><TableHead><TableRow>
          <TableCell>Region</TableCell><TableCell>Residents</TableCell><TableCell>Active / inactive</TableCell><TableCell>Hometowns / polygons</TableCell><TableCell>Population multiplier</TableCell><TableCell>Culture multiplier</TableCell>
        </TableRow></TableHead><TableBody>{inspection.regions.map((region) => <TableRow key={region.id}>
          <TableCell>{region.name}{region.issues.length > 0 && <Typography variant="caption" display="block" color="warning.main">{region.issues.join(' ')}</Typography>}</TableCell>
          <TableCell>{region.population?.toLocaleString() ?? 'Unknown'}</TableCell><TableCell>{region.counts.active} / {region.counts.inactive}</TableCell>
          <TableCell>{region.weightedHometowns} / {region.validPolygons}</TableCell>
          {(['population', 'culture'] as const).map((kind) => <TableCell key={kind}>{numeric(`${region.name} ${kind} multiplier`, value.weights[region.id]?.[kind] ?? '',
            (next) => change('weights', { ...value.weights, [region.id]: { population: value.weights[region.id]?.population ?? '', culture: value.weights[region.id]?.culture ?? '', [kind]: next } }))}</TableCell>)}
        </TableRow>)}</TableBody></Table></Box>
      </AccordionDetails>
    </Accordion>
    <Accordion defaultExpanded>
      <AccordionSummary>Age targets</AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Target the finished population, accounting for existing trainers. Generated competitors start at age 12. Choose the bands and shares; shares must total 100%.</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <TextField select required size="small" label="Age target population" value={value.ageScope} disabled={disabled}
            sx={{ minWidth: 240 }} onChange={(event) => change('ageScope', event.target.value as PopulationBriefDraft['ageScope'])}>
            <MenuItem value="coverage">Active trainers at 3,000+ PWTR</MenuItem><MenuItem value="all_active">All active trainers</MenuItem>
          </TextField>
          {numeric('Age/rating bias', value.ageRatingBias, (next) => change('ageRatingBias', next), '0–1. Soft weighting; strong teenagers remain possible.')}
        </Box>
        {value.ages.map((band, index) => <Box key={index} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          {(['minimum', 'maximum', 'percentage'] as const).map((key) => <Box key={key}>{numeric(`Age band ${index + 1} ${key}`, band[key],
            (next) => change('ages', value.ages.map((current, currentIndex) => currentIndex === index ? { ...current, [key]: next } : current)))}</Box>)}
          <Button disabled={disabled || value.ages.length === 1} onClick={() => change('ages', value.ages.filter((_current, currentIndex) => currentIndex !== index))}>Remove age band {index + 1}</Button>
        </Box>)}
        <Button disabled={disabled} onClick={() => change('ages', [...value.ages, { minimum: '', maximum: '', percentage: '' }])}>Add age band</Button>
      </AccordionDetails>
    </Accordion>
    </>}
    <Accordion defaultExpanded>
      <AccordionSummary>Pokémon generation settings</AccordionSummary>
      <AccordionDetails sx={{ display: 'grid', gap: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField select required size="small" label="Pokémon preferences" value={value.preferenceMode} disabled={disabled}
            sx={{ minWidth: 240 }} onChange={(event) => change('preferenceMode', event.target.value as PopulationBriefDraft['preferenceMode'])}>
            <MenuItem value="none">No type, generation or field preference</MenuItem><MenuItem value="custom">Choose preferences</MenuItem>
          </TextField>
          {numeric('Specialists (%)', value.specialist, (next) => change('specialist', next))}
          {numeric('Dual-type specialists (%)', value.dualType, (next) => change('dualType', next))}
        </Box>
        {value.preferenceMode === 'custom' && <Box sx={{ display: 'grid', gap: 2 }}>{(['types', 'generations', 'fields'] as const).map((kind) => <Autocomplete key={kind} multiple
          disabled={disabled} options={inspection.pokemonPreferences[kind]} value={inspection.pokemonPreferences[kind].filter((option) => value[kind].includes(option.id))}
          getOptionLabel={(option) => option.name} isOptionEqualToValue={(left, right) => left.id === right.id}
          onChange={(_event, options) => change(kind, options.map((option) => option.id))}
          renderInput={(params) => <TextField {...params} label={`Preferred ${kind}`} helperText="Empty means no preference. Existing soft preference rules apply." />} />)}</Box>}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField select required size="small" label="Owned roster size" value={value.rosterMode} disabled={disabled}
            sx={{ minWidth: 260 }} onChange={(event) => change('rosterMode', event.target.value as PopulationBriefDraft['rosterMode'])}>
            <MenuItem value="weighted">Existing weighted 6–24 distribution (peak 12)</MenuItem><MenuItem value="range">Explicit size range</MenuItem>
          </TextField>
          {value.rosterMode === 'range' && <>{numeric('Minimum owned Pokémon', value.rosterMinimum, (next) => change('rosterMinimum', next))}
            {numeric('Maximum owned Pokémon', value.rosterMaximum, (next) => change('rosterMaximum', next))}</>}
        </Box>
        <Typography variant="body2" color="text.secondary">Each exceptional category is drawn once per trainer. Choose its chance and count explicitly; 0% and a count of 0 disable it. Every rotation keeps six ordinary Pokémon.</Typography>
        {specialKinds.map((kind) => <Box key={kind} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {numeric(`${kind} chance (%)`, value.specials[kind].chance, (next) => change('specials', { ...value.specials, [kind]: { ...value.specials[kind], chance: next } }))}
          {numeric(`${kind} count when selected`, value.specials[kind].count, (next) => change('specials', { ...value.specials, [kind]: { ...value.specials[kind], count: next } }))}
        </Box>)}
      </AccordionDetails>
    </Accordion>
  </Box>;
}
