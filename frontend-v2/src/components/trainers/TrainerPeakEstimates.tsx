import { Box, TextField, Typography } from '@mui/material';

interface Estimates { ability: number | null | undefined; year: number | null | undefined; }

export function TrainerPeakEstimateFields({ ability, year, onAbility, onYear, disabled = false }: Estimates & {
  onAbility: (value: number | null) => void; onYear: (value: number | null) => void; disabled?: boolean;
}): React.JSX.Element {
  return <>
    <TextField label="Estimated peak ability (0–99)" type="number" value={ability ?? ''} disabled={disabled}
      slotProps={{ htmlInput: { min: 0, max: 99, step: 1 } }}
      onChange={(event) => onAbility(event.target.value === '' ? null : Number(event.target.value))}
      helperText="Optional ability estimate, separate from official PWTR." />
    <TextField label="Estimated peak year" type="number" value={year ?? ''} disabled={disabled}
      slotProps={{ htmlInput: { step: 1 } }}
      onChange={(event) => onYear(event.target.value === '' ? null : Number(event.target.value))}
      helperText="Optional; within their lifetime through the save year. Unknown is fine." />
  </>;
}

export function TrainerPeakEstimateSummary({ ability, year }: Estimates): React.JSX.Element {
  return <Box sx={{ mt: 2 }}>
    <Typography variant="subtitle2" color="text.secondary">Estimated peak ability</Typography>
    <Typography>{ability == null ? 'Unknown' : `${ability} / 99`}</Typography>
    <Typography variant="subtitle2" color="text.secondary">Estimated peak year</Typography>
    <Typography>{year ?? 'Unknown'}</Typography>
    <Typography variant="caption" color="text.secondary">Estimates; separate from official PWTR records.</Typography>
  </Box>;
}
