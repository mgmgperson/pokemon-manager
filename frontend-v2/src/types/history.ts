export interface TravelLog {
    id: number;
    trainer_id: number;
    from_location_id: number;
    to_location_id: number;
    departure_time: string;
    arrival_time: string;
    notes: string;
    from_location_name: string;
    to_location_name: string;
    from_region_name: string;
    to_region_name: string;
}

export interface MatchHistory {
    match_id: number;
    round: number;
    scheduled_at: string;
    winner_id: number | null;
    stadium_name: string;
    stadium_type: string;
    city_name: string;
    region_name: string;
    tournament_edition: string;
    tournament_name: string;
    participant_a_id: number;
    participant_b_id: number;
    trainer_a_fname: string;
    trainer_a_lname: string;
    trainer_b_fname: string;
    trainer_b_lname: string;
    winner_fname: string | null;
    winner_lname: string | null;
}

export interface RecentPokemon {
    id: number;
    pokemon_id: number;
    species_id: number;
    nickname: string | null;
    level: number;
    level_met_at: number;
    date_met_at: string;
    location_met_at: string;
    ot_name: string;
    ot_id: number;
    gender: string | null;
    shiny: boolean;
    pokeball_id: number | null;
}
