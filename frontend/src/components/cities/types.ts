// Types for city components
export interface Stadium {
    id: number;
    name: string;
    type: string;
    capacity: number;
}

export interface GymLeader {
    id: number;
    name: string;
    badge: string;
    type: string;
}

export interface Region {
    id: number;
    name: string;
}

export interface City {
    id: number;
    name: string;
    population: number;
    description: string;
    x_coordinate: number;
    y_coordinate: number;
    region: Region;
    stadiums: Stadium[];
    gymLeaders: GymLeader[];
}
