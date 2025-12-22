import { Location } from './location';

export interface City {
    id: number;
    name: string;
    population: number;
    x_coordinate: number;
    y_coordinate: number;
}

export interface GymLeader {
    id: number;
    name: string;
    type: string;
    city_id: number;
    city_name: string;
}

export interface ChampionInfo {
    id: number;
    name: string;
}

export interface EliteFourMember {
    id: number;
    name: string;
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
    champion: ChampionInfo | null;
    eliteFour: EliteFourMember[];
    gymLeaders: GymLeader[];
    locations: Location[];
}