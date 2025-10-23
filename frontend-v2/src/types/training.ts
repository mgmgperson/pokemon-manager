export type FocusStat = 'hp' | 'attack' | 'defense' | 'special_attack' | 
    'special_defense' | 'speed' | 'happiness' | 'bond' | 'move';

export interface TrainingProgram {
    id: number;
    name: string;
    focus_stat: FocusStat;
    base_duration: number;
    fatigue_cost: number;
    cost: number;
    trainer_id: number;
    description: string | null;
}

export interface TrainingSession {
    id: number;
    pokemon_id: number;
    program_id: number;
    start_time: string | null;
    end_time: string | null;
    success: boolean | null;
    fatigue: number;
    notes: string | null;
    pokemon_name: string;
    program_name?: string;
}

// API Response types
export interface TrainingProgramsResponse {
    message: string;
    data: TrainingProgram[];
}

export interface TrainingProgramResponse {
    message: string;
    data: TrainingProgram;
}

export interface TrainingSessionsResponse {
    message: string;
    data: TrainingSession[];
}

export interface TrainingSessionResponse {
    message: string;
    data: TrainingSession;
}