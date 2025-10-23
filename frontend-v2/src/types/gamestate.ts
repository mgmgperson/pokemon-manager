export interface GameState {
  id: number;
  active_trainer_id: number;
  active_location_id: number;
  trainer_fname: string;
  trainer_lname: string;
  location_name: string;
  region_name: string;
  current_date: string;
  current_time: string;
}
