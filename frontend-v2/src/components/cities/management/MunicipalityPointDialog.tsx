import { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import type { MapPoint } from './cityManagementData';
import CityLocationMap, { type CityMapMarker } from './CityLocationMap';

interface Props {
  cityName: string;
  regionName: string;
  locationName: string;
  polygon: MapPoint[];
  point: MapPoint | null;
  otherCities: CityMapMarker[];
  disabled: boolean;
  onClose: () => void;
  onConfirm: (point: MapPoint) => void;
}

export default function MunicipalityPointDialog({ cityName, regionName, locationName, polygon, point,
  otherCities, disabled, onClose, onConfirm }: Props): React.JSX.Element {
  const [selectedPoint, setSelectedPoint] = useState(point);
  const [placementError, setPlacementError] = useState<string | null>(null);
  const placeCity = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (disabled) return;
    const map = event.currentTarget.querySelector('svg');
    const boundary = map?.querySelector('polygon');
    if (!map || !boundary) return;
    const rectangle = map.getBoundingClientRect();
    if (rectangle.width <= 0 || rectangle.height <= 0) return;
    const x = (event.clientX - rectangle.left) / rectangle.width;
    const screenY = (event.clientY - rectangle.top) / rectangle.height;
    if (x < 0 || x > 1 || screenY < 0 || screenY > 1) return;
    // Use the rendered polygon for hit-testing; backend review remains authoritative.
    if (!boundary.isPointInFill(new DOMPoint(x * 100, screenY * 100))) {
      setPlacementError('Choose a point inside the blue location boundary.');
      return;
    }
    setPlacementError(null);
    setSelectedPoint({ x, y: 1 - screenY });
  };
  return <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
    <DialogTitle>Place {cityName || 'proposed city'} on map</DialogTitle>
    <DialogContent>
      <Typography color="text.secondary" sx={{ mb: 2 }}>Click inside the blue location boundary to move the red city point. This only edits the unsaved proposal.</Typography>
      {placementError && <Alert severity="warning" sx={{ mb: 1 }}>{placementError}</Alert>}
      <Box onClick={placeCity} sx={{ '& svg': { cursor: disabled ? 'default' : 'crosshair' } }}>
        <CityLocationMap cityName={cityName} regionName={regionName} locationName={locationName}
          point={selectedPoint} polygon={polygon} additionalPoints={otherCities} />
      </Box>
      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
        {selectedPoint ? `X: ${selectedPoint.x.toFixed(4)} · Y: ${selectedPoint.y.toFixed(4)}` : 'No point selected.'}
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" disabled={disabled || selectedPoint === null} onClick={() => { if (selectedPoint) onConfirm(selectedPoint); }}>Use this position</Button>
    </DialogActions>
  </Dialog>;
}
