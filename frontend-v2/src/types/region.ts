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

export interface Region {
    id: number;
    name: string;
    population: number;
    cities: City[];
    champion: string | null;
    eliteFour: string[];
    gymLeaders: GymLeader[];
} 