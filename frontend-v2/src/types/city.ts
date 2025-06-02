export interface Stadium {
    id: number;
    name: string;
    type: string | null;
    capacity: number;
}

export interface GymLeader {
    id: number;
    trainer_id: number;
    name: string;
    badge: string | null;
    type: string;
}

export interface City {
    id: number;
    name: string;
    population: number;
    description: string | null;
    x_coordinate: number;
    y_coordinate: number;
    region: {
        id: number;
        name: string;
    };
    stadiums: Stadium[];
    gymLeaders: GymLeader[];
}
