export interface Terrain {
  id: number;
  code: string;
  name: string;
  description: string;
  defaultField?: string; // matches one of your field codes, e.g. "Forest Field"
}

export const defaultTerrains: Terrain[] = [
  { id: 1,  code: "plains",            name: "Plains",             description: "Open grassland with scattered shrubs", defaultField: "Grassy Field" },
  { id: 2,  code: "tall_grass",        name: "Tall Grass",         description: "Dense knee-high grass - classic wild encounter zone", defaultField: "Grassy Field" },
  { id: 3,  code: "forest",            name: "Forest",             description: "Temperate woodland with broadleaf canopy", defaultField: "Forest Field" },
  { id: 4,  code: "rainforest",        name: "Rainforest",         description: "Humid jungle teeming with life", defaultField: "Forest Field" },
  { id: 5,  code: "swamp",             name: "Swamp",              description: "Water-logged ground and thick mud", defaultField: "Swamp Field" },
  { id: 6,  code: "riverbank",         name: "Riverbank",          description: "Fresh-water edge with reeds and mud flats", defaultField: "Water Surface Field" },
  { id: 7,  code: "lake",              name: "Lake",               description: "Large inland body of water", defaultField: "Water Surface Field" },
  { id: 8,  code: "pond",              name: "Pond",               description: "Small calm water body", defaultField: "Water Surface Field" },
  { id: 9,  code: "waterfall",         name: "Waterfall",          description: "Steep water cascade and surrounding spray zone", defaultField: "Waterfall Field" },
  { id:10,  code: "beach",             name: "Beach",              description: "Sandy shoreline with gentle surf", defaultField: "Ashen Beach Field" },
  { id:11,  code: "reef",              name: "Coral Reef",         description: "Shallow tropical sea with coral formations", defaultField: "Underwater Field" },
  { id:12,  code: "ocean",             name: "Open Ocean",         description: "Deep salt water far from shore", defaultField: "Underwater Field" },
  { id:13,  code: "underwater",        name: "Seafloor",           description: "Sub-surface aquatic environment", defaultField: "Underwater Field" },
  { id:14,  code: "cliff",             name: "Cliff Face",         description: "Steep rocky escarpment overlooking lower ground", defaultField: "Cliffs Field" },
  { id:15,  code: "mountain",          name: "Mountain",           description: "High-altitude rocky slopes", defaultField: "Snowy Mountain Field" },
  { id:16,  code: "cave",              name: "Cave",               description: "Subterranean passages and chambers", defaultField: "Dark Cavern Field" },
  { id:17,  code: "crystal_cavern",    name: "Crystal Cavern",     description: "Glittering crystal-lined caverns", defaultField: "Crystal Cavern Field" },
  { id:18,  code: "volcano",           name: "Volcano",            description: "Active volcanic cone and lava tubes", defaultField: "Volcanic Field" },
  { id:19,  code: "taiga",             name: "Taiga",              description: "Boreal coniferous forest", defaultField: "Taiga Field" },
  { id:20,  code: "tundra",            name: "Tundra",             description: "Treeless permafrost plain", defaultField: "Icy Field" },
  { id:21,  code: "snowfield",         name: "Snowfield",          description: "Permanent snow cover with harsh winds", defaultField: "Snowy Mountain Field" },
  { id:22,  code: "glacier",           name: "Glacier",            description: "Slow-moving river of ice", defaultField: "Frozen Dimensional Field" },
  { id:23,  code: "desert",            name: "Desert",             description: "Arid dunes and scorching sun", defaultField: "Desert Field" },
  { id:24,  code: "savanna",           name: "Savanna",            description: "Dry grassland with scattered trees", defaultField: "Grassy Field" },
  { id:25,  code: "canyon",            name: "Canyon",             description: "Deep gorge carved by erosion", defaultField: "Cliffs Field" },
  { id:26,  code: "plateau",           name: "Plateau",            description: "Elevated flat-topped highland", defaultField: "Windy Field" },
  { id:27,  code: "valley",            name: "Valley",             description: "Low-lying land between hills or mountains", defaultField: "Valley of Winds Field" },
  { id:28,  code: "lake_shore",        name: "Lake Shore",         description: "Forest surrounding a tranquil lake", defaultField: "Forest Field" },
  { id:29,  code: "mangrove",          name: "Mangrove",           description: "Tidal wetlands with mangrove roots", defaultField: "Swarm Field" },
  { id:30,  code: "wetlands",          name: "Wetlands",           description: "Flood-prone grass and reeds", defaultField: "Swamp Field" },
  { id:31,  code: "ruins",             name: "Ancient Ruins",      description: "Crumbling stone structures of past civilizations", defaultField: "Haunted Field" },
  { id:32,  code: "graveyard",         name: "Graveyard",          description: "Spooky cemetery filled with restless spirits", defaultField: "Haunted Field" },
  { id:33,  code: "urban_core",        name: "City Streets",       description: "Dense urban environment with traffic and lights", defaultField: "City Field" },
  { id:34,  code: "industrial_zone",   name: "Industrial Zone",    description: "Factories, warehouses, and air pollution", defaultField: "Factory Field" },
  { id:35,  code: "power_plant",       name: "Power Plant",        description: "High-voltage facility humming with electricity", defaultField: "Electirized Field" },
  { id:36,  code: "stadium",           name: "Colosseum",          description: "Large battle arena with roaring crowds", defaultField: "Colosseum Field" },
  { id:37,  code: "park",              name: "Park",               description: "Protected wildlife reserve with lush scenery", defaultField: "Flower Garden Field" },
  { id:38,  code: "orchard",           name: "Orchard",            description: "Cultivated rows of fruit trees", defaultField: "Flower Garden Field" },
  { id:39,  code: "farm",              name: "Ranch",              description: "Open fields for raising Pokémon or crops", defaultField: "Grassy Field" },
  { id:40,  code: "hot_spring",        name: "Hot Spring",         description: "Geothermal pools with steam and minerals", defaultField: "Misty Field" },
  { id:41,  code: "dimension_rift",    name: "Dimensional Rift",   description: "Reality-warping pocket dimension", defaultField: "Dimensional Field" },  
  { id:42,  code: "space",             name: "Outer Space",        description: "Zero-gravity cosmic expanse", defaultField: "New World Field" },
  { id:43,  code: "fairy_glade",       name: "Fairy Glade",        description: "Enchanted clearing with sparkling pollen", defaultField: "Fantasy Field" },
  { id:44,  code: "crystal_peak",      name: "Crystal Peak",       description: "Mountain summit studded with giant crystals", defaultField: "Crystal Cavern Field" },
  { id:45,  code: "lost_hotel",        name: "Lost Hotel",         description: "Derelict luxury hotel reclaimed by Pokémon", defaultField: "Lost Hotel Field" },
  { id:46,  code: "maritime_port",     name: "Maritime Port",      description: "Busy docks and cargo cranes", defaultField: "Water Surface Field" },
  { id:47,  code: "research_lab",      name: "Research Laboratory",description: "High-tech facility for studying Pokémon", defaultField: "Factory Field" },
  { id: 48, code: "gym",               name: "Training Gym",       description: "High-energy facility for intense training", defaultField: "Pumped Field" },
  { id: 49, code: "toxic_waste",       name: "Toxic Wasteland",    description: "Hazardous area with corrosive substances", defaultField: "Corrosive Field" },
  { id: 50, code: "hellscape",         name: "Infernal Realm",     description: "Scorching dimension of eternal flames", defaultField: "Infernal Field" },
  { id: 51, code: "psychic_zone",      name: "Psychic Nexus",      description: "Reality-bending zone of mental energy", defaultField: "Psychic Field" },
  { id: 52, code: "dragon_lair",       name: "Dragon's Den",       description: "Ancient cavern home to powerful dragons", defaultField: "Draconid Den Field" },
  { id: 53, code: "mirror_maze",       name: "Hall of Mirrors",    description: "Disorienting maze of reflective surfaces", defaultField: "Mirror Field" },
  { id: 54, code: "concert_hall",      name: "Concert Arena",      description: "Massive venue for musical performances", defaultField: "Concert Venue Field" },
  { id: 55, code: "cursed_forest",     name: "Bewitched Woods",    description: "Eerie forest twisted by dark magic", defaultField: "Bewitched Woods Field" },
  { id: 56, code: "murky_swamp",       name: "Murkwater Marsh",    description: "Dark, polluted waters and thick fog", defaultField: "Murkwater Surface Field" },
  { id: 57, code: "smog_zone",         name: "Smoky Heights",      description: "Area thick with mysterious fog or smoke", defaultField: "Smoky Field" },
  { id: 58, code: "observatory",       name: "Starlight Arena",    description: "Open-air stadium under the stars", defaultField: "Starlight Arena Field" },
  { id: 59, code: "alleyway",          name: "Back Alley",         description: "Narrow urban passages between buildings", defaultField: "Back Alley Field" },
  { id: 60, code: "chess_court",       name: "Chess Court",        description: "Strategic battleground in black and white", defaultField: "Chess Field" },
  { id: 61, code: "underground",       name: "Deep Earth Core",    description: "Far below the surface near the planet's core", defaultField: "Deep Earth Field" },
  { id: 62, code: "inverse_realm",     name: "Inverse World",      description: "Dimension where everything is reversed", defaultField: "Inverse Field" },
  { id: 63, code: "glitch_zone",       name: "Glitch Zone",        description: "Corrupted space with unstable reality", defaultField: "Glitch Field" },
  { id: 64, code: "funhouse",          name: "Trickster's Lair",   description: "Whimsical area full of pranks and illusions", defaultField: "Trickster Field" },
  { id: 65, code: "rainbow_valley",    name: "Rainbow Valley",     description: "Prismatic landscape under perpetual rainbows", defaultField: "Rainbow Field" },
  { id: 66, code: "ice_cave",          name: "Ice Cave",           description: "Frozen cavern with crystalline formations", defaultField: "Icy Field" },
  { id: 67, code: "fairy_meadow",      name: "Fairy Meadow",       description: "Misty clearing filled with fairy lights", defaultField: "Misty Field" },
  { id: 68, code: "fairy_spring",      name: "Enchanted Spring",   description: "Magical water source shrouded in mist", defaultField: "Misty Field" },
  { id: 69, code: "carnival_grounds",  name: "Carnival Grounds",   description: "Festive area with rides and attractions", defaultField: "Big Top Field" }
];

export interface SpawnRule {
  pokemonId: number;
  highSpawn: string[];                 // terrain codes
  mediumSpawn: string[];
  lowSpawn: string[];
  baseSpawn: 'common' | 'uncommon' | 'rare' | 'event' | 'very_rare';
  time?: ('day' | 'night' | 'dawn' | 'dusk')[];
  season?: ('spring' | 'summer' | 'autumn' | 'winter')[];
  minLevel: number;
  maxLevel: number;
}

export interface Location {
  id: number;
  name: string;
  regionId: number;
  description?: string;
  population?: number;
  travelTime?: number;                 // 1-5 scale
  accessibility?: number;              // 1-5 scale
  defaultField?: string;               // e.g. 'Grassy Field'
  /** % breakdown of each terrain present (keys = defaultTerrains codes) */
  terrainMix: Record<string, number>;
}

export interface RegionGenerationSpawn {
  regionId: number;
  generation: number;
  rate: number;               // relative weight
}



export const defaultLocations: Location[] = [
    {
        id: 1,
        name: 'Greater Pallet',
        regionId: 1,                                   // Kanto
        description: 'Pallet Town and the surrounding peninsula.',
        population: 1_500_000,
        travelTime: 2,
        accessibility: 1,
        defaultField: 'Grassy Field',
        terrainMix: {
            plains: 20,
            forest: 65,
            lake_shore: 15,
            riverbank: 10,
            beach: 5,
            park: 5,
            research_lab: 1,
            orchard: 5,
        }
    }
];

export const defaultSpawnRules: SpawnRule[] = [
    {
        pokemonId: 1,                                  // Bulbasaur
        highSpawn:   ['forest', 'rainforest', 'orchard', 'park'],
        mediumSpawn: ['lake_shore', 'toxic_waste', 'tall_grass'],
        lowSpawn:    ['swamp', 'plains', 'farm', 'wetlands'],
        baseSpawn: 'rare',
        time:   ['day'],
        season: ['spring', 'summer'],
        minLevel: 1,
        maxLevel: 15
    },
    {
        pokemonId: 2,                                  // Ivysaur
        highSpawn:   ['forest', 'rainforest', 'orchard', 'park'],
        mediumSpawn: ['lake_shore', 'toxic_waste', 'tall_grass'],
        lowSpawn:    ['swamp', 'plains', 'farm', 'wetlands'],
        baseSpawn: 'very_rare',
        time:   ['day'],
        season: ['spring', 'summer'],
        minLevel: 16,
        maxLevel: 32
    },
    {
        pokemonId: 3,                                  // Venusaur
        highSpawn:   ['forest', 'rainforest', 'orchard', 'park'],
        mediumSpawn: ['lake_shore', 'toxic_waste', 'tall_grass'],
        lowSpawn:    ['swamp', 'plains', 'farm', 'wetlands'],
        baseSpawn: 'very_rare',
        time:   ['day'],
        season: ['spring', 'summer'],
        minLevel: 33,
        maxLevel: 50
    },
    {
        pokemonId: 4,                                  // Charmander
        highSpawn:   ['volcano', 'mountain'],
        mediumSpawn: ['canyon', 'plains', 'savanna', 'tall_grass'],
        lowSpawn:    ['forest', 'valley', 'park'],
        baseSpawn: 'rare',
        time:   ['day'],
        season: ['summer'],
        minLevel: 1,
        maxLevel: 15
    },
    {
        pokemonId: 5,                                  // Charmeleon
        highSpawn:   ['volcano', 'mountain'],
        mediumSpawn: ['canyon', 'plains', 'savanna', 'tall_grass'],
        lowSpawn:    ['forest', 'valley', 'park'],
        baseSpawn: 'very_rare',
        time:   ['day'],
        season: ['summer'],
        minLevel: 16,
        maxLevel: 35
    },
    {
        pokemonId: 6,                                  // Charizard
        highSpawn:   ['volcano', 'mountain'],
        mediumSpawn: ['canyon', 'plains', 'savanna', 'tall_grass'],
        lowSpawn:    ['forest', 'valley', 'park'],
        baseSpawn: 'very_rare',
        time:   ['day'],
        season: ['summer'],
        minLevel: 36,
        maxLevel: 50
    },
    {
        pokemonId: 7,                                  // Squirtle
        highSpawn:   ['riverbank', 'lake', 'pond', 'beach'],
        mediumSpawn: ['ocean', 'reef', 'underwater', 'swamp'],
        lowSpawn:    ['plains', 'tall_grass', 'farm'],
        baseSpawn: 'rare',
        time:   ['day'],
        season: ['spring', 'summer'],
        minLevel: 1,
        maxLevel: 15
    },
    {
        pokemonId: 8,                                  // Wartortle
        highSpawn:   ['riverbank', 'lake', 'pond', 'beach'],
        mediumSpawn: ['ocean', 'reef', 'underwater', 'swamp'],
        lowSpawn:    ['plains', 'tall_grass', 'farm'],
        baseSpawn: 'very_rare',
        time:   ['day'],
        season: ['spring', 'summer'],
        minLevel: 16,
        maxLevel: 35
    },
    {
        pokemonId: 9,                                  // Blastoise
        highSpawn:   ['riverbank', 'lake', 'pond', 'beach'],
        mediumSpawn: ['ocean', 'reef', 'underwater', 'swamp'],
        lowSpawn:    ['plains', 'tall_grass', 'farm'],
        baseSpawn: 'very_rare',
        time:   ['day'],
        season: ['spring', 'summer'],
        minLevel: 36,
        maxLevel: 50
    },
    {
        pokemonId: 10,                                 // Caterpie
        highSpawn:   ['forest', 'rainforest'],
        mediumSpawn: ['tall_grass', 'swamp', 'orchard', 'park'],
        lowSpawn:    ['plains', 'farm'],
        baseSpawn: 'common',
        time:   ['day', 'dawn'],
        season: ['spring', 'summer', 'autumn'],
        minLevel: 1,
        maxLevel: 6
    },
    {
        pokemonId: 11,                                 // Metapod
        highSpawn:   ['forest', 'rainforest'],
        mediumSpawn: ['tall_grass', 'swamp', 'orchard', 'park'],
        lowSpawn:    ['plains', 'farm'],
        baseSpawn: 'common',
        time:   ['day', 'dusk'],
        season: ['spring', 'summer', 'autumn'],
        minLevel: 7,
        maxLevel: 10
    },
    {
        pokemonId: 12,                                 // Butterfree
        highSpawn:   ['forest', 'rainforest'],
        mediumSpawn: ['tall_grass', 'swamp', 'orchard', 'park'],
        lowSpawn:    ['plains', 'farm'],
        baseSpawn: 'uncommon',
        time:   ['day'],
        season: ['spring', 'summer', 'autumn'],
        minLevel: 11,
        maxLevel: 35
    },
    {
        pokemonId: 13,                                 // Weedle
        highSpawn:   ['forest', 'rainforest'],
        mediumSpawn: ['tall_grass', 'swamp', 'orchard', 'toxic_waste'],
        lowSpawn:    ['plains', 'farm'],
        baseSpawn: 'common',
        time:   ['day', 'dawn'],
        season: ['spring', 'summer', 'autumn'],
        minLevel: 1,
        maxLevel: 6
    },
    {
        pokemonId: 14,                                 // Kakuna
        highSpawn:   ['forest', 'rainforest'],
        mediumSpawn: ['tall_grass', 'swamp', 'orchard', 'toxic_waste'],
        lowSpawn:    ['plains', 'farm'],
        baseSpawn: 'common',
        time:   ['day', 'dusk'],
        season: ['spring', 'summer', 'autumn'],
        minLevel: 7,
        maxLevel: 10
    },
    {
        pokemonId: 15,                                 // Beedrill
        highSpawn:   ['forest', 'rainforest'],
        mediumSpawn: ['tall_grass', 'swamp', 'orchard', 'toxic_waste'],
        lowSpawn:    ['plains', 'farm'],
        baseSpawn: 'uncommon',
        time:   ['day'],
        season: ['spring', 'summer', 'autumn'],
        minLevel: 11,
        maxLevel: 35
    }
    //TODO: Add more Pokemon
];