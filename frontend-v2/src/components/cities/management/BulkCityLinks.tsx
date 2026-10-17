import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import type { BasicRegion } from '../../../types/region';
import { applyBulkLinkPreview, errorMessage, fetchBulkLinkPreview, formatPopulation, locationSignalLabels } from './cityManagementData';

interface Props { regions: BasicRegion[]; }
const previewKey = ['city-management', 'bulk-preview'];

export default function BulkCityLinks({ regions }: Props): React.JSX.Element {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const queryClient = useQueryClient();
  const previewQuery = useQuery({ queryKey: previewKey, queryFn: fetchBulkLinkPreview, enabled: false, retry: false });
  const preview = previewQuery.data;
  const mutation = useMutation({
    mutationFn: applyBulkLinkPreview,
    onSuccess: async (count) => {
      setConfirmOpen(false);
      setNotice(`Linked ${count} cities. Existing assignments and skipped cities were left unchanged.`);
      await queryClient.resetQueries({ queryKey: previewKey });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['city-management'] }),
        queryClient.invalidateQueries({ queryKey: ['cities'] }),
        queryClient.invalidateQueries({ queryKey: ['city'] }),
      ]);
    },
  });
  const canApply = !!preview?.links.length && !previewQuery.isFetching && !previewQuery.error && !mutation.isPending && !mutation.isError;
  const regionName = (id: number): string => regions.find((region) => region.id === id)?.name ?? `Region #${id}`;

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6">Bulk location linking</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Across all regions in this save: unique name/containment matches only. Existing links, nearest fallbacks, ambiguity,
        and population conflicts are skipped. Previewing makes no writes.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Button variant="outlined" disabled={previewQuery.isFetching || mutation.isPending} onClick={() => {
          mutation.reset(); setNotice(''); setConfirmOpen(false); void previewQuery.refetch();
        }}>{previewQuery.isFetching ? 'Preparing preview…' : 'Preview bulk links'}</Button>
        {preview && <Button variant="contained" disabled={!canApply} onClick={() => setConfirmOpen(true)}>Review bulk apply</Button>}
      </Box>
      {notice && <Alert severity="success">{notice}</Alert>}
      {previewQuery.error && <Alert severity="error">{errorMessage(previewQuery.error)}</Alert>}
      {mutation.error && !confirmOpen && <Alert severity="error">{errorMessage(mutation.error)} Refresh the preview before retrying.</Alert>}
      {preview && !previewQuery.error && <>
        <Typography variant="subtitle2" gutterBottom>{preview.links.length} proposed links · {preview.skipped.length} skipped cities</Typography>
        {preview.links.length === 0 ? <Alert severity="info">No unambiguous, within-budget cities are available to link.</Alert> :
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader aria-label="Proposed bulk city links">
              <TableHead><TableRow>
                <TableCell>City</TableCell><TableCell>Region</TableCell><TableCell align="right">Population</TableCell>
                <TableCell>Location</TableCell><TableCell>Match</TableCell><TableCell align="right">Remaining after batch</TableCell>
              </TableRow></TableHead>
              <TableBody>{preview.links.map((link) => <TableRow key={link.cityId}>
                <TableCell>{link.cityName} · #{link.cityId}</TableCell><TableCell>{regionName(link.regionId)}</TableCell>
                <TableCell align="right">{formatPopulation(link.population)}</TableCell><TableCell>{link.locationName} · #{link.locationId}</TableCell>
                <TableCell><Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {link.signals.map((signal) => <Chip key={signal} size="small" label={locationSignalLabels[signal]} />)}
                </Box></TableCell><TableCell align="right">{formatPopulation(link.remainingAfterBatch)}</TableCell>
              </TableRow>)}</TableBody>
            </Table>
          </TableContainer>}
        {!!preview.skipped.length && <Accordion sx={{ mt: 2 }}>
          <AccordionSummary aria-label="Show skipped city links"><Typography>Skipped cities ({preview.skipped.length}) — show reasons</Typography></AccordionSummary>
          <AccordionDetails>
            <TableContainer sx={{ maxHeight: 320 }}>
              <Table size="small" aria-label="Skipped city links">
                <TableHead><TableRow><TableCell>City</TableCell><TableCell>Region</TableCell><TableCell>Reason</TableCell></TableRow></TableHead>
                <TableBody>{preview.skipped.map((city) => <TableRow key={city.cityId}>
                  <TableCell>{city.cityName} · #{city.cityId}</TableCell><TableCell>{regionName(city.regionId)}</TableCell><TableCell>{city.reason}</TableCell>
                </TableRow>)}</TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>}
      </>}
      <Dialog open={confirmOpen} onClose={() => { if (!mutation.isPending) setConfirmOpen(false); }} disableEscapeKeyDown={mutation.isPending}>
        <DialogTitle>Confirm {preview?.links.length ?? 0} city location links</DialogTitle>
        <DialogContent>
          <Typography>Apply exactly the links shown in this preview? Only location assignments change. City names, populations,
            coordinates, trainer hometowns, stadiums, and gym leaders stay unchanged.</Typography>
          <Typography color="text.secondary" sx={{ mt: 2 }}>All links are rechecked and written in one transaction.
            If geography has changed since review, nothing is applied; generate a fresh preview.</Typography>
          {mutation.error && <Alert severity="error" sx={{ mt: 2 }}>{errorMessage(mutation.error)}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button disabled={mutation.isPending} onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!canApply} onClick={() => { if (preview) mutation.mutate(preview); }}>
            {mutation.isPending ? 'Applying…' : 'Confirm and apply bulk links'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
