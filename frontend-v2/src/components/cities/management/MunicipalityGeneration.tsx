import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Autocomplete, Box, Button, CircularProgress, Paper, TextField } from '@mui/material';
import type { BasicRegion } from '../../../types/region';
import { errorMessage } from './cityManagementData';
import { fetchGenerationLocations } from './municipalityData';
import MunicipalityEditor from './MunicipalityEditor';

export default function MunicipalityGeneration({ regions }: { regions: BasicRegion[] }): React.JSX.Element {
  const [regionId, setRegionId] = useState<number | null>(null);
  const [locationId, setLocationId] = useState<number | null>(null);
  const locationsQuery = useQuery({ queryKey: ['city-management', 'generation-locations', regionId],
    queryFn: () => fetchGenerationLocations(regionId!), enabled: regionId !== null, retry: false });
  const locations = locationsQuery.data ?? [];
  const regionName = regions.find((region) => region.id === regionId)?.name ?? 'Unknown';
  return <Box>
    <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <Autocomplete options={regions} value={regions.find((region) => region.id === regionId) ?? null}
        getOptionLabel={(region) => region.name} isOptionEqualToValue={(left, right) => left.id === right.id}
        onChange={(_event, region) => { setRegionId(region?.id ?? null); setLocationId(null); }}
        sx={{ minWidth: 220, flex: 1 }} renderInput={(params) => <TextField {...params} label="Generation region" />} />
      <Autocomplete options={locations} value={locations.find((location) => location.id === locationId) ?? null}
        getOptionLabel={(location) => `${location.name} · #${location.id}`} isOptionEqualToValue={(left, right) => left.id === right.id}
        onChange={(_event, location) => setLocationId(location?.id ?? null)} disabled={regionId === null || locationsQuery.isFetching}
        sx={{ minWidth: 260, flex: 2 }} renderInput={(params) => <TextField {...params} label="Generation location" />} />
    </Paper>
    {locationsQuery.isLoading && <CircularProgress aria-label="Loading generation locations" />}
    {locationsQuery.error && <Alert severity="error" action={<Button onClick={() => void locationsQuery.refetch()}>Retry</Button>}>{errorMessage(locationsQuery.error)}</Alert>}
    {regionId === null && <Alert severity="info">Choose a region and one authored location. Changing location discards its unsaved draft.</Alert>}
    {regionId !== null && !locationsQuery.isFetching && !locationsQuery.error && locations.length === 0
      && <Alert severity="info">This region has no authored locations. Create locations with their populations and polygons first.</Alert>}
    {locationId !== null && <MunicipalityEditor key={locationId} locationId={locationId} regionName={regionName} />}
  </Box>;
}
