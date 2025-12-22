export interface TournamentTemplate {
    id: number;
    name: string;
    description: string;
    region_id: number | null;
    region_name: string | null;
    frequency: string;
    start_month: number | null;
    team_type: string;
    default_rule_set_id: number | null;
    default_rule_set_name: string | null;
}

export interface StageTemplate {
    id: number;
    seq: number;
    stage_type: string;
    participants: number | null;
    groups: number | null;
    best_of: number;
    rule_set_id: number | null;
    rule_set_name: string | null;
}

export interface QualificationRule {
    id: number;
    criterion_type: string;
    value: string;
    notes: string | null;
}

export interface Prize {
    id: number;
    position: number;
    prize_type: string;
    value: number;
}

export interface Badge {
    id: number;
    code: string;
    name: string;
    category: string;
    description: string | null;
    region_id: number | null;
    region_name: string | null;
    tournament_template_id: number | null;
    tournament_name: string | null;
}

export interface TournamentDetail extends TournamentTemplate {
    stages: StageTemplate[];
    qualifications: QualificationRule[];
    prizes: Prize[];
    badges: Badge[];
}

export interface TournamentEvent {
    id: number;
    edition_label: string;
    start_date: string;
    end_date: string | null;
    status: string;
}

export interface StageEvent {
    id: number;
    status: string;
    seq: number;
    stage_type: string;
    participants: number | null;
    groups: number | null;
    best_of: number;
}

export interface TournamentParticipant {
    participant_id: number;
    seed: number | null;
    stage_event_id: number;
    trainer_id: number;
    fname: string;
    lname: string | null;
    pwtr_rating: number;
}

export interface TournamentEventDetail extends TournamentEvent {
    template_id: number;
    tournament_name: string;
    stages: StageEvent[];
    participants: TournamentParticipant[];
}

export interface Match {
    match_id: number;
    seq: number;
    round: number | null;
    group_label: string | null;
    stage_seq: number;
    stage_type: string;
    winner_id: number | null;
    participant1_id: number;
    trainer1_fname: string;
    trainer1_lname: string | null;
    participant2_id: number;
    trainer2_fname: string;
    trainer2_lname: string | null;
    stadium_id: number | null;
    stadium_name: string | null;
    city_name: string | null;
}
