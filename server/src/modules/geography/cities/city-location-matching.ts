export interface MapPoint {
  x: number;
  y: number;
}

export interface MatchableLocation {
  id: number;
  name: string;
  region_id: number;
  population: number | null;
  polygon: MapPoint[] | null;
}

export interface LocationCandidate {
  locationId: number;
  locationName: string;
  signals: Array<'exact-name' | 'inside-polygon' | 'nearest-polygon'>;
  distance: number | null;
}

export function isMapPoint(point: MapPoint): boolean {
  return [point.x, point.y].every((value) => Number.isFinite(value) && value >= 0 && value <= 1);
}

export function mapPointsOverlap(left: MapPoint, right: MapPoint): boolean {
  return Math.abs(left.x - right.x) < 1e-8 && Math.abs(left.y - right.y) < 1e-8;
}

export function isLocationPolygon(polygon: readonly MapPoint[]): boolean {
  if (polygon.length < 3 || !polygon.every(isMapPoint)) return false;
  const area = polygon.reduce((total, point, index) => {
    const next = polygon[(index + 1) % polygon.length];
    return total + point.x * next.y - next.x * point.y;
  }, 0);
  return Math.abs(area) > 1e-12;
}

export function cityMapPoint(city: { x_coordinate: number | null; y_coordinate: number | null }): MapPoint | null {
  if (city.x_coordinate === null || city.y_coordinate === null) return null;
  const point = { x: city.x_coordinate, y: city.y_coordinate };
  return isMapPoint(point) ? point : null;
}

export function parseLocationPolygon(value: unknown): MapPoint[] | null {
  try {
    // Legacy saves encode the [y, x] array inside a second JSON string.
    for (let depth = 0; depth < 2 && typeof value === 'string'; depth += 1) {
      value = JSON.parse(value);
    }
    if (!Array.isArray(value) || value.length < 3) return null;
    const polygon: MapPoint[] = [];
    for (const pair of value) {
      if (!Array.isArray(pair) || pair.length !== 2 || typeof pair[0] !== 'number' || typeof pair[1] !== 'number') {
        return null;
      }
      const point = { x: pair[1], y: pair[0] };
      if (!isMapPoint(point)) return null;
      polygon.push(point);
    }
    return isLocationPolygon(polygon) ? polygon : null;
  } catch {
    return null;
  }
}

function segmentDistanceSquared(point: MapPoint, start: MapPoint, end: MapPoint): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const projection = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared
  ));
  return (point.x - start.x - projection * dx) ** 2 + (point.y - start.y - projection * dy) ** 2;
}

export function pointInsidePolygon(point: MapPoint, polygon: readonly MapPoint[]): boolean {
  let inside = false;
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    if (segmentDistanceSquared(point, start, end) < 1e-20) return true;
    if ((start.y > point.y) !== (end.y > point.y)
      && point.x < (end.x - start.x) * (point.y - start.y) / (end.y - start.y) + start.x) {
      inside = !inside;
    }
  }
  return inside;
}

export function findCityLocationCandidates(
  city: { name: string; region_id: number; point: MapPoint | null },
  locations: readonly MatchableLocation[]
): LocationCandidate[] {
  const candidates = locations.filter((location) => location.region_id === city.region_id).map((location) => {
    const signals: LocationCandidate['signals'] = [];
    if (location.name.trim().toLowerCase() === city.name.trim().toLowerCase()) signals.push('exact-name');
    let distance: number | null = null;
    const point = city.point;
    const polygon = location.polygon;
    if (point && polygon) {
      const inside = pointInsidePolygon(point, polygon);
      if (inside) signals.push('inside-polygon');
      distance = inside ? 0 : Math.sqrt(Math.min(...polygon.map((vertex, index) =>
        segmentDistanceSquared(point, vertex, polygon[(index + 1) % polygon.length])
      )));
    }
    return { locationId: location.id, locationName: location.name, signals, distance };
  });
  const matches = candidates.filter((candidate) => candidate.signals.length > 0);
  if (matches.length > 0) {
    return matches.sort((left, right) => Number(right.signals.includes('exact-name'))
      - Number(left.signals.includes('exact-name')) || left.locationId - right.locationId);
  }
  const nearest = candidates.filter((candidate) => candidate.distance !== null)
    .sort((left, right) => left.distance! - right.distance! || left.locationId - right.locationId);
  return nearest.filter((candidate) => candidate.distance === nearest[0]?.distance)
    .map((candidate) => ({ ...candidate, signals: ['nearest-polygon'] }));
}
