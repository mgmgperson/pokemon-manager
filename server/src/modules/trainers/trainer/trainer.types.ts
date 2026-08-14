export type NumericValue = number | null;

export interface TrainerWriteInput {
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

export type FormatRatingWriteInput = {
  id: number;
  rating_id?: number;
} & Record<FormatRatingColumn, number>;
