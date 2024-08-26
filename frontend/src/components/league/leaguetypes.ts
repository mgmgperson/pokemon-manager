export interface EliteFourMember {
    id: number;
    name: string;
}

export interface RegionEliteFour {
    region: string;
    eliteFour: EliteFourMember[];
}

export interface Champion {
    id: number;
    name: string;
    region: string;
}

export interface GrandChampion {
    id: number;
    name: string;
}

export interface LeagueData {
    grandChampion: GrandChampion;
    champions: Champion[];
    eliteFour: RegionEliteFour[];
}
