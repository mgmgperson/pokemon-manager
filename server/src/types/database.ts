export interface TrainerRow {
    id: number;
    fname: string | null;
    lname: string | null;
    region_id: number | null;
    birthdate: string | null; // stored as TEXT (ISO 8601)
    pwtr_rating: number | null;
    peak_rating: number | null;
    peak_rank: number | null;
    active_status: boolean | null;
  }
  
export interface PokemonRow {
    id: number;
    trainer_id: number;
    species_id: number;
    pokemon_id: number | null;
    level: number | null;
  
    ot_name: string | null;
    ot_id: number | null;
  
    nickname: string | null;
    attack: number | null;
    defense: number | null;
    special_attack: number | null;
    special_defense: number | null;
    speed: number | null;
    hp: number | null;
    happiness: number | null;
  
    iv_hp: number | null;
    iv_attack: number | null;
    iv_defense: number | null;
    iv_special_attack: number | null;
    iv_special_defense: number | null;
    iv_speed: number | null;
  
    ev_hp: number | null;
    ev_attack: number | null;
    ev_defense: number | null;
    ev_special_attack: number | null;
    ev_special_defense: number | null;
    ev_speed: number | null;
  
    nature_id: number | null;
    ability_id: number | null;
  
    gender: string | null;
    shiny: boolean | null;
    pokeball_id: number | null;
    held_item_id: number | null;
    experience_points: number | null;
    is_gigantamax: boolean | null;
    is_mega: boolean | null;
    date_met_at: string | null;
    location_met_at: string | null;
    level_met_at: number | null;
  
    current_hp: number | null;
    current_strength: number | null;
    status_id: number | null;
    battles_won: number | null;
    battles_lost: number | null;
    kills: number | null;
    deaths: number | null;
  
    training_efficiency: number | null;
  }
  
  