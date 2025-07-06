import { LocationTerrain } from './terrain';
import { LocationShop } from './shop';

export interface Location {
    id: number;
    name: string;
    region_id: number;
    region_name: string;
    description: string;
    population: number;
    travel_time: number;
    accessibility: number;
    area_coordinates: string;  // JSON array of coordinate pairs
    parent_location_id: number | null;  // For sub-zones or nested areas
    parent_location_name: string | null;
    terrain_types: string[];
    sub_locations: string[];
    shops: LocationShop[];
}

// Extended interface for editing that includes terrain details
export interface EditableLocation extends Location {
    terrains: LocationTerrain[];
}

export interface AccessibilityLabel {
    label: string;
    color: 'success' | 'info' | 'warning' | 'error' | 'default';
}

export const getAccessibilityLabel = (level: number): AccessibilityLabel => {
    switch (level) {
        case 1: return { label: 'Easy Access', color: 'success' };
        case 2: return { label: 'Moderate', color: 'info' };
        case 3: return { label: 'Challenging', color: 'warning' };
        case 4: return { label: 'Difficult', color: 'error' };
        case 5: return { label: 'Very Difficult', color: 'error' };
        default: return { label: 'Unknown', color: 'default' };
    }
};

export const getTravelTimeLabel = (level: number): string => {
    switch (level) {
        case 1: return 'Very Quick';
        case 2: return 'Quick';
        case 3: return 'Moderate';
        case 4: return 'Long';
        case 5: return 'Very Long';
        default: return 'Unknown';
    }
};
