import { Box, Button, Checkbox, FormControlLabel, IconButton, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { DeleteOutline, Place } from '@mui/icons-material';
import { namingStyleLabel, numericInput, type DraftMunicipality } from './municipalityData';

interface Props {
  cities: DraftMunicipality[];
  disabled: boolean;
  namingStyles: string[];
  defaultNamingStyle: string;
  nameWarnings: readonly (string | null)[];
  onEdit: (index: number, field: keyof DraftMunicipality, value: string | boolean) => void;
  onRemove: (index: number) => void;
  onReroll: (index: number) => void;
  onPlace: (index: number) => void;
}

export default function MunicipalityDraftTable({ cities, disabled, namingStyles, defaultNamingStyle, nameWarnings, onEdit, onRemove, onReroll, onPlace }: Props): React.JSX.Element {
  return <TableContainer sx={{ maxHeight: 520 }}><Table size="small" stickyHeader>
    <TableHead><TableRow><TableCell>#</TableCell><TableCell>Name</TableCell><TableCell>Population</TableCell>
      <TableCell>Position</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
    <TableBody>{cities.map((city, index) => <TableRow key={index}>
      <TableCell>{index + 1}</TableCell>
      {(['name', 'population'] as const).map((field) => <TableCell key={field}>
        <TextField size="small" value={city[field]} disabled={disabled}
          helperText={field === 'name' ? nameWarnings[index] : undefined} FormHelperTextProps={{ sx: { color: 'warning.main' } }}
          inputProps={{ 'aria-label': `City ${index + 1} ${field}`, maxLength: field === 'name' ? 200 : undefined }}
          sx={{ minWidth: field === 'name' ? 190 : 115 }} onChange={(event) => onEdit(index, field, event.target.value)} />
      </TableCell>)}
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Button size="small" startIcon={<Place />} disabled={disabled} onClick={() => onPlace(index)} aria-label={`Place city ${index + 1} on map`}>Place on map</Button>
        <Typography variant="caption" display="block">X: {numericInput(city.x).toFixed(4)} · Y: {numericInput(city.y).toFixed(4)}</Typography>
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField select size="small" label="Reroll style" value={city.rerollStyle ?? defaultNamingStyle} disabled={disabled} sx={{ minWidth: 185 }}
            SelectProps={{ inputProps: { 'aria-label': `City ${index + 1} reroll style` } }} onChange={(event) => onEdit(index, 'rerollStyle', event.target.value)}>
            {namingStyles.map((style) => <MenuItem key={style} value={style}>{style === 'mixed' ? 'Proposal mix' : namingStyleLabel(style)}</MenuItem>)}
          </TextField>
          <FormControlLabel label="Island on reroll" control={<Checkbox size="small" disabled={disabled} checked={city.islandName ?? false}
            inputProps={{ 'aria-label': `City ${index + 1} island on reroll` }} onChange={(_event, checked) => onEdit(index, 'islandName', checked)} />} />
          <Button size="small" disabled={disabled} onClick={() => onReroll(index)} aria-label={`Reroll city ${index + 1} name`}>Reroll name</Button>
          <IconButton size="small" disabled={disabled} onClick={() => onRemove(index)} aria-label={`Remove proposed city ${index + 1}`}><DeleteOutline /></IconButton>
        </Box>
      </TableCell>
    </TableRow>)}</TableBody>
  </Table></TableContainer>;
}
