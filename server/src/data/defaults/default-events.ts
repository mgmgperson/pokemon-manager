/* ========= Interfaces ========= */

export type EventType = 'story' | 'battle' | 'gift_pokemon' | 'tournament_ceremony' | 'system';

export interface EventTemplate {
  id: number;
  code: string;
  name: string;
  type: EventType;
  description?: string;
  defaultPayloadJson?: string;  // JSON string
  autoOpenOverlay?: 0 | 1;
}

export interface EventInstance {
  id: number;
  templateId?: number;
  type: EventType;
  title: string;
  subtitle?: string;
  status: 'scheduled' | 'active' | 'resolved' | 'canceled';
  startsAt: string;             // ISO
  endsAt?: string;
  priority?: number;
  payloadJson?: string;         // JSON string

  // soft refs
  matchId?: number;
  tournamentEventId?: number;
  gymLeaderId?: number;
  locationId?: number;
  regionId?: number;
  stadiumId?: number;
}

export type EventOptionKind = 'choice' | 'text' | 'reward';

export interface EventOption {
  id: number;
  eventId: number;
  kind: EventOptionKind;
  label?: string;
  body?: string;
  sortOrder?: number;
  conditionsJson?: string;   // JSON string
  effectsJson?: string;      // JSON string
}

/* ========= Defaults: Kanto Starter (Gift Pokémon) ========= */

export const defaultEventTemplates: EventTemplate[] = [
  {
    id: 1,
    code: 'gift_starter_kanto',
    name: 'Kanto Starter Selection',
    type: 'gift_pokemon',
    description: 'Choose one of three Pokémon to begin your journey.',
    defaultPayloadJson: JSON.stringify({
      professorName: 'Professor Oak',
      art: true,
      prompt: 'Choose wisely!'
    }),
    autoOpenOverlay: 1
  }
];

/* One concrete instance that can be spawned at game start */
export const defaultEventInstances: EventInstance[] = [
  {
    id: 1,
    templateId: 1,
    type: 'gift_pokemon',
    title: 'Choose Your Starter',
    subtitle: 'Professor Oak awaits.',
    status: 'active',
    startsAt: new Date().toISOString(),     // or a scripted world time
    priority: 100,
    payloadJson: JSON.stringify({
      ui: { showProfessor: true, showBallCapsules: true }
    })
  }
];

/* Options rendered inside the overlay */
export const defaultEventOptions: EventOption[] = [
  // Intro line
  {
    id: 1,
    eventId: 1,
    kind: 'text',
    body: 'Three faithful partners. Which will you take?'
  },
  // Bulbasaur
  {
    id: 2,
    eventId: 1,
    kind: 'choice',
    label: 'Bulbasaur (Lv. 5)',
    sortOrder: 1,
    effectsJson: JSON.stringify({
      effects: [
        { type: 'grant_pokemon', species_id: 1, level: 5, starter: true },
        { type: 'grant_item', item_id: 1, qty: 5 }, // Poké Ball
        { type: 'message', subject: 'A new journey!', body: 'Take good care of Bulbasaur.' }
      ]
    })
  },
  // Charmander
  {
    id: 3,
    eventId: 1,
    kind: 'choice',
    label: 'Charmander (Lv. 5)',
    sortOrder: 2,
    effectsJson: JSON.stringify({
      effects: [
        { type: 'grant_pokemon', species_id: 4, level: 5, starter: true },
        { type: 'grant_item', item_id: 1, qty: 5 },
        { type: 'message', subject: 'A new journey!', body: 'Charmander is raring to go!' }
      ]
    })
  },
  // Squirtle
  {
    id: 4,
    eventId: 1,
    kind: 'choice',
    label: 'Squirtle (Lv. 5)',
    sortOrder: 3,
    effectsJson: JSON.stringify({
      effects: [
        { type: 'grant_pokemon', species_id: 7, level: 5, starter: true },
        { type: 'grant_item', item_id: 1, qty: 5 },
        { type: 'message', subject: 'A new journey!', body: 'Squirtle was added to your party.' }
      ]
    })
  }
];
