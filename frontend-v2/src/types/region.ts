import { Location } from './location';

export interface City {
    id: number;
    name: string;
    population: number;
    x_coordinate: number;
    y_coordinate: number;
}

export interface GymLeader {
    name: string;
    type: string;
    city_name: string;
}

// Basic region type used in location editing
export interface BasicRegion {
    id: number;
    name: string;
}

// Full region type with all details
export interface Region {
    id: number;
    name: string;
    population: number;
    cities: City[];
    champion: string | null;
    eliteFour: string[];
    gymLeaders: GymLeader[];
    locations: Location[];
}