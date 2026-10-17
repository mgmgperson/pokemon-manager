import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Autocomplete, Box, Button, CircularProgress, Paper, Tab, Tabs, TextField, Typography } from '@mui/material';
import { errorMessage, fetchCities, fetchCityLocationReview, fetchRegions } from './cityManagementData';
import CityLocationEditor from './CityLocationEditor';
import BulkCityLinks from './BulkCityLinks';
import MunicipalityGeneration from './MunicipalityGeneration';

export default function CityManagement(): React.JSX.Element {
  const [regionId, setRegionId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [tab, setTab] = useState<'links' | 'generation'>('links');
  const regionsQuery = useQuery({ queryKey: ['city-management', 'regions'], queryFn: fetchRegions, retry: false });
  const citiesQuery = useQuery({ queryKey: ['city-management', 'cities'], queryFn: fetchCities, retry: false });
  const reviewQuery = useQuery({
    queryKey: ['city-management', 'review', cityId],
    queryFn: () => fetchCityLocationReview(cityId!),
    enabled: cityId !== null && tab === 'links',
    retry: false,
  });
  const regions = regionsQuery.data ?? [];
  const cities = (citiesQuery.data ?? []).filter((city) => city.region_id === regionId)
    .sort((left, right) => left.name.localeCompare(right.name) || left.id - right.id);
  const error = regionsQuery.error ?? citiesQuery.error;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>City Management</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Review city location assignments or generate municipalities inside authored locations. Nothing is saved until explicit confirmation.
      </Typography>
      {error && <Alert severity="error" action={<Button onClick={() => {
        void regionsQuery.refetch(); void citiesQuery.refetch();
      }}>Retry</Button>}>{errorMessage(error)}. Select a save first if none is active.</Alert>}
      {(regionsQuery.isLoading || citiesQuery.isLoading) && <CircularProgress aria-label="Loading cities and regions" />}
      {!error && regionsQuery.data && citiesQuery.data && <>
        <Tabs value={tab} onChange={(_event, value: 'links' | 'generation') => setTab(value)} sx={{ mb: 2 }}>
          <Tab value="links" label="City links" /><Tab value="generation" label="Generate municipalities" />
        </Tabs>
        {tab === 'generation' ? <MunicipalityGeneration regions={regions} /> : <>
        <BulkCityLinks regions={regions} />
        <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Autocomplete options={regions} value={regions.find((region) => region.id === regionId) ?? null}
            getOptionLabel={(region) => region.name} isOptionEqualToValue={(left, right) => left.id === right.id}
            onChange={(_event, region) => { setRegionId(region?.id ?? null); setCityId(null); }}
            sx={{ minWidth: 220, flex: 1 }} renderInput={(params) => <TextField {...params} label="Region" />} />
          <Autocomplete options={cities} value={cities.find((city) => city.id === cityId) ?? null}
            getOptionLabel={(city) => `${city.name} · #${city.id}`} isOptionEqualToValue={(left, right) => left.id === right.id}
            onChange={(_event, city) => setCityId(city?.id ?? null)} disabled={regionId === null}
            sx={{ minWidth: 260, flex: 2 }} renderInput={(params) => <TextField {...params} label="City" />} />
        </Paper>
        {regionId !== null && cities.length === 0 && <Alert severity="info">This region has no cities.</Alert>}
        {cityId === null && cities.length > 0 && <Alert severity="info">Choose a city to review its location.</Alert>}
        {reviewQuery.isLoading && <CircularProgress aria-label="Loading city location review" />}
        {cityId !== null && reviewQuery.error && <Alert severity="error"
          action={<Button onClick={() => void reviewQuery.refetch()}>Retry</Button>}>{errorMessage(reviewQuery.error)}</Alert>}
        {cityId !== null && !reviewQuery.error && reviewQuery.data && <CityLocationEditor key={cityId}
          review={reviewQuery.data} regionName={regions.find((region) => region.id === reviewQuery.data.city.region_id)?.name ?? 'Unknown'} />}
        </>}
      </>}
    </Box>
  );
}
