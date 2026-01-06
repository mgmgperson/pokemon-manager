export interface Badge {
    id: number;
    code: string;
    name: string;
    category: string;
    image: string | null;
    description: string;
    region_id: number | null;
    region_name: string | null;
    tournament_template_id: number | null;
    tournament_name: string | null;
    trainer_count?: number;
}

export interface BadgeDetailInfo {
    id: number;
    code: string;
    name: string;
    category: string;
    image: string | null;
    description: string;
    region_id: number | null;
    region_name: string | null;
    tournament_template_id: number | null;
    tournament_name: string | null;
    tournament_team_type: string | null;
    tournament_frequency: string | null;
    tournament_start_month: number | null;
}

export interface BadgeTrainer {
    trainer_id: number;
    fname: string;
    lname: string;
    pwtr_rating: number | null;
    peak_rating: number | null;
    peak_rank: number | null;
    region_id: number;
    region_name: string;
    awarded_at: string;
    notes: string | null;
    event_edition: string | null;
}

export interface BadgeDetail {
    badge: BadgeDetailInfo;
    trainers: BadgeTrainer[];
}
