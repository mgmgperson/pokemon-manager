export type NumericValue = number | null;

export const TRAINER_TITLE_FILTERS = [
  'all',
  'champion',
  'elite_four',
  'gym_leader',
  'none',
] as const;

export type TrainerTitleFilter = (typeof TRAINER_TITLE_FILTERS)[number];

export const TRAINER_STATUS_FILTERS = ['all', 'active', 'inactive', 'unknown'] as const;

export type TrainerStatusFilter = (typeof TRAINER_STATUS_FILTERS)[number];

export const TRAINER_MISSING_DATA_FILTERS = [
  'birthdate',
  'region',
  'hometown',
  'active_status',
  'pwtr_rating',
  'peak_rating',
  'peak_rank',
  'rating',
  'general_rating',
  'no_pokemon',
  'low_pokemon_count',
  'pokemon_details',
] as const;

export type TrainerMissingDataFilter = (typeof TRAINER_MISSING_DATA_FILTERS)[number];

export const TRAINER_SORT_FIELDS = [
  'rank',
  'name',
  'pwtr_rating',
  'region_name',
  'title',
  'birthdate',
  'age',
  'peak_rating',
  'peak_rank',
  'active_status',
] as const;

export type TrainerSortField = (typeof TRAINER_SORT_FIELDS)[number];

export type SortOrder = 'asc' | 'desc';

const GENERAL_RATING_COLUMNS = [
  'overall_rating',
  'typing_rating',
  'mixed_rating',
  'special_rating',
] as const;

export type GeneralRatingColumn = (typeof GENERAL_RATING_COLUMNS)[number];

export interface TrainerListInput {
  page: number;
  pageSize: number;
  search?: string;
  regionId?: number;
  hometownCityId?: number;
  title: TrainerTitleFilter;
  status: TrainerStatusFilter;
  sortBy: TrainerSortField;
  sortOrder: SortOrder;
  missing: TrainerMissingDataFilter[];
}

export interface TrainerOptionsInput {
  search?: string;
  ids: number[];
}

export interface TrainerWriteInput {
  estimated_peak_ability?: NumericValue;
  estimated_peak_ability_year?: NumericValue;
  fname?: string | null;
  lname?: string | null;
  region_id?: NumericValue;
  birthdate?: string | null;
  pwtr_rating?: NumericValue;
  peak_rating?: NumericValue;
  peak_rank?: NumericValue;
  active_status?: boolean | number | null;
}

export const FIELD_RATING_COLUMNS = [
  'pumped_field_rating',
  'windy_field_rating',
  'corrosive_field_rating',
  'desert_field_rating',
  'cliffs_field_rating',
  'swarm_field_rating',
  'haunted_field_rating',
  'factory_field_rating',
  'infernal_field_rating',
  'watersurface_field_rating',
  'grassy_field_rating',
  'electirized_field_rating',
  'psychic_field_rating',
  'icy_field_rating',
  'draconidden_field_rating',
  'darkcavern_field_rating',
  'misty_field_rating',
  'city_field_rating',
  'mirror_field_rating',
  'concertvenue_field_rating',
  'crystalcavern_field_rating',
  'waterfall_field_rating',
  'volcanic_field_rating',
  'forest_field_rating',
  'flowergarden_field_rating',
  'swamp_field_rating',
  'bewitchedwoods_field_rating',
  'murkwatersurface_field_rating',
  'smoky_field_rating',
  'frozendimensional_field_rating',
  'valleyofwinds_field_rating',
  'losthotel_field_rating',
  'taiga_field_rating',
  'ashenbeach_field_rating',
  'underwater_field_rating',
  'starlightarena_field_rating',
  'snowymountain_field_rating',
  'bigtop_field_rating',
  'backalley_field_rating',
  'neutral_field_rating',
  'chess_field_rating',
  'deepearth_field_rating',
  'inverse_field_rating',
  'glitch_field_rating',
  'dimensional_field_rating',
  'colosseum_field_rating',
  'trickster_field_rating',
  'fantasy_field_rating',
  'rainbow_field_rating',
  'newworld_field_rating',
] as const;

export type FieldRatingColumn = (typeof FIELD_RATING_COLUMNS)[number];

export type FieldRatingWriteInput = {
  id: number;
  rating_id?: number;
} & Record<FieldRatingColumn, NumericValue>;

export const MENTAL_RATING_COLUMNS = [
  'planning_rating',
  'risk_rating',
  'prediction_rating',
  'clutch_rating',
  'consistency_rating',
  'motivation_rating',
  'pokemon_knowledge_rating',
  'trainer_knowledge_rating',
  'training_rating',
  'conditioning_rating',
  'determination_rating',
  'facilities_rating',
  'attack_rating',
  'defense_rating',
  'speed_rating',
  'gimmick_rating',
] as const;

export type MentalRatingColumn = (typeof MENTAL_RATING_COLUMNS)[number];

export type MentalRatingWriteInput = {
  id: number;
  rating_id?: number;
} & Record<MentalRatingColumn, NumericValue>;

export const FORMAT_RATING_COLUMNS = [
  'singles_rating',
  'doubles_rating',
  'tag_battle_rating',
  'battle_factory_rating',
  'rotation_rating',
  'sixes_rating',
  'threes_rating',
  'twos_rating',
] as const;

export type FormatRatingColumn = (typeof FORMAT_RATING_COLUMNS)[number];

export type TrainerRatingMetric =
  | GeneralRatingColumn
  | FormatRatingColumn
  | MentalRatingColumn
  | FieldRatingColumn;

export type TrainerRatingMetricGroup = 'General' | 'Format' | 'Mental' | 'Field';

export interface TrainerRatingMetricOption {
  value: TrainerRatingMetric;
  group: TrainerRatingMetricGroup;
}

function metricOptions<Column extends TrainerRatingMetric>(
  columns: readonly Column[],
  group: TrainerRatingMetricGroup
): TrainerRatingMetricOption[] {
  return columns.map((value) => ({ value, group }));
}

export const TRAINER_RATING_METRIC_OPTIONS: readonly TrainerRatingMetricOption[] = [
  ...metricOptions(GENERAL_RATING_COLUMNS, 'General'),
  ...metricOptions(FORMAT_RATING_COLUMNS, 'Format'),
  ...metricOptions(MENTAL_RATING_COLUMNS, 'Mental'),
  ...metricOptions(FIELD_RATING_COLUMNS, 'Field'),
];

export const TRAINER_RATING_METRICS = TRAINER_RATING_METRIC_OPTIONS.map(({ value }) => value);

export const TRAINER_RATING_LEADERBOARD_SORT_FIELDS = [
  'rank',
  'name',
  'pwtr_rating',
  'region_name',
  'title',
  'birthdate',
  'age',
  'peak_rating',
  'peak_rank',
  'metric',
] as const;

export type TrainerRatingLeaderboardSortField =
  (typeof TRAINER_RATING_LEADERBOARD_SORT_FIELDS)[number];

export interface TrainerRatingLeaderboardInput {
  page: number;
  pageSize: number;
  metric: TrainerRatingMetric;
  sortBy: TrainerRatingLeaderboardSortField;
  sortOrder: SortOrder;
}

export type FormatRatingWriteInput = {
  id: number;
  rating_id?: number;
} & Record<FormatRatingColumn, number>;
