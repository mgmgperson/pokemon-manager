import { GameState } from './gamestate';
import { Region } from './region';
import { Pokemon } from './pokemon';

export interface HomeData {
  gameState: GameState;
  currentRegion: Region;
  trainerPokemon: Pokemon[];
}

export interface TrainerAround {
  id: number;
  fname: string;
  lname: string;
  title: string;
  pwtr_rating: number;
  region_name: string;
}

export interface NextEvent {
  id: number;
  title: string;
  date: string;
  type: 'tournament' | 'battle' | 'training' | 'other';
  description?: string;
}
