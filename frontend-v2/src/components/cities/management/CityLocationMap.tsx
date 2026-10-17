import { Alert, Box, Paper, Typography } from '@mui/material';
import type { MapPoint } from './cityManagementData';

export interface CityMapMarker { name: string; point: MapPoint; proposed: boolean; }

interface Props {
  regionName: string;
  cityName: string;
  point: MapPoint | null;
  locationName?: string;
  polygon?: MapPoint[] | null;
  additionalPoints?: CityMapMarker[];
}

export default function CityLocationMap({ regionName, cityName, point, locationName, polygon, additionalPoints }: Props): React.JSX.Element {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {regionName} · {cityName}{locationName ? ` / ${locationName}` : ''}
      </Typography>
      <Box sx={{ position: 'relative' }}>
        <img src={`/regions/${regionName.toLowerCase()}.png`} alt={`${regionName} map`}
          style={{ width: '100%', display: 'block' }} />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img"
          aria-label={`${cityName} point and ${locationName ?? 'selected location'} boundary`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {polygon && <polygon points={polygon.map(({ x, y }) => `${x * 100},${(1 - y) * 100}`).join(' ')}
            fill="#60a5fa" fillRule="evenodd" fillOpacity={0.25} stroke="#60a5fa" strokeWidth={0.4} />}
          {point && <circle cx={point.x * 100} cy={(1 - point.y) * 100} r={0.8} fill="#ef4444" stroke="white" strokeWidth={0.2}>
            <title>{cityName}</title>
          </circle>}
          {additionalPoints?.map((city, index) => <circle key={index} cx={city.point.x * 100} cy={(1 - city.point.y) * 100}
            r={city.proposed ? 0.8 : 0.6} fill={city.proposed ? '#fb923c' : '#94a3b8'} stroke="white" strokeWidth={0.2}>
            <title>{city.name}</title>
          </circle>)}
        </svg>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {point && additionalPoints && 'Red: selected city · '}
        {additionalPoints ? 'Orange: proposed cities · Grey: existing cities' : 'Red point: city'} · Blue boundary: selected location
      </Typography>
      {!point && !additionalPoints && <Alert severity="warning" sx={{ mt: 1 }}>The city has missing or invalid coordinates; no point is shown.</Alert>}
      {locationName && !polygon && <Alert severity="warning" sx={{ mt: 1 }}>
        {additionalPoints ? 'A valid location polygon is required for generation.' : 'No valid location polygon. Manual linking is still possible.'}
      </Alert>}
    </Paper>
  );
}
