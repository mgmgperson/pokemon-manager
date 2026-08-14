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
  { id:11,  code: "coral_reef",        name: "Coral Reef",         description: "Shallow tropical sea with coral formations", defaultField: "Underwater Field" },
  { id:12,  code: "open_ocean",        name: "Open Ocean",         description: "Deep salt water far from shore", defaultField: "Underwater Field" },
  { id:13,  code: "seafloor",          name: "Seafloor",           description: "Sub-surface aquatic environment", defaultField: "Underwater Field" },
  { id:14,  code: "cliff_face",        name: "Cliff Face",         description: "Steep rocky escarpment overlooking lower ground", defaultField: "Cliffs Field" },
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
  { id:31,  code: "ancient_ruins",     name: "Ancient Ruins",      description: "Crumbling stone structures of past civilizations", defaultField: "Haunted Field" },
  { id:32,  code: "graveyard",         name: "Graveyard",          description: "Spooky cemetery filled with restless spirits", defaultField: "Haunted Field" },
  { id:33,  code: "city_streets",      name: "City Streets",       description: "Dense urban environment with traffic and lights", defaultField: "City Field" },
  { id:34,  code: "industrial_zone",   name: "Industrial Zone",    description: "Factories, warehouses, and air pollution", defaultField: "Factory Field" },
  { id:35,  code: "power_plant",       name: "Power Plant",        description: "High-voltage facility humming with electricity", defaultField: "Electirized Field" },
  { id:36,  code: "colosseum",         name: "Colosseum",          description: "Large battle arena with roaring crowds", defaultField: "Colosseum Field" },
  { id:37,  code: "park",              name: "Park",               description: "Protected wildlife reserve with lush scenery", defaultField: "Flower Garden Field" },
  { id:38,  code: "orchard",           name: "Orchard",            description: "Cultivated rows of fruit trees", defaultField: "Flower Garden Field" },
  { id:39,  code: "ranch",             name: "Ranch",              description: "Open fields for raising Pokémon or crops", defaultField: "Grassy Field" },
  { id:40,  code: "hot_spring",        name: "Hot Spring",         description: "Geothermal pools with steam and minerals", defaultField: "Misty Field" },
  { id:41,  code: "dimensional_rift",  name: "Dimensional Rift",   description: "Reality-warping pocket dimension", defaultField: "Dimensional Field" },  
  { id:42,  code: "outer_space",       name: "Outer Space",        description: "Zero-gravity cosmic expanse", defaultField: "New World Field" },
  { id:43,  code: "fairy_glade",       name: "Fairy Glade",        description: "Enchanted clearing with sparkling pollen", defaultField: "Fantasy Field" },
  { id:44,  code: "crystal_peak",      name: "Crystal Peak",       description: "Mountain summit studded with giant crystals", defaultField: "Crystal Cavern Field" },
  { id:45,  code: "lost_hotel",        name: "Lost Hotel",         description: "Derelict luxury hotel reclaimed by Pokémon", defaultField: "Lost Hotel Field" },
  { id:46,  code: "maritime_port",     name: "Maritime Port",      description: "Busy docks and cargo cranes", defaultField: "Water Surface Field" },
  { id:47,  code: "research_laboratory",name: "Research Laboratory",description: "High-tech facility for studying Pokémon", defaultField: "Factory Field" },
  { id: 48, code: "training_gym",      name: "Training Gym",       description: "High-energy facility for intense training", defaultField: "Pumped Field" },
  { id: 49, code: "toxic_wasteland",   name: "Toxic Wasteland",    description: "Hazardous area with corrosive substances", defaultField: "Corrosive Field" },
  { id: 50, code: "infernal_realm",    name: "Infernal Realm",     description: "Scorching dimension of eternal flames", defaultField: "Infernal Field" },
  { id: 51, code: "psychic_nexus",     name: "Psychic Nexus",      description: "Reality-bending zone of mental energy", defaultField: "Psychic Field" },
  { id: 52, code: "dragons_den",       name: "Dragon's Den",       description: "Ancient cavern home to powerful dragons", defaultField: "Draconid Den Field" },
  { id: 53, code: "hall_of_mirrors",   name: "Hall of Mirrors",    description: "Disorienting maze of reflective surfaces", defaultField: "Mirror Field" },
  { id: 54, code: "concert_arena",     name: "Concert Arena",      description: "Massive venue for musical performances", defaultField: "Concert Venue Field" },
  { id: 55, code: "bewitched_woods",   name: "Bewitched Woods",    description: "Eerie forest twisted by dark magic", defaultField: "Bewitched Woods Field" },
  { id: 56, code: "murkwater_marsh",   name: "Murkwater Marsh",    description: "Dark, polluted waters and thick fog", defaultField: "Murkwater Surface Field" },
  { id: 57, code: "smoky_heights",     name: "Smoky Heights",      description: "Area thick with mysterious fog or smoke", defaultField: "Smoky Field" },
  { id: 58, code: "starlight_arena",   name: "Starlight Arena",    description: "Open-air stadium under the stars", defaultField: "Starlight Arena Field" },
  { id: 59, code: "back_alley",        name: "Back Alley",         description: "Narrow urban passages between buildings", defaultField: "Back Alley Field" },
  { id: 60, code: "chess_court",       name: "Chess Court",        description: "Strategic battleground in black and white", defaultField: "Chess Field" },
  { id: 61, code: "deep_earth_core",   name: "Deep Earth Core",    description: "Far below the surface near the planet's core", defaultField: "Deep Earth Field" },
  { id: 62, code: "inverse_world",     name: "Inverse World",      description: "Dimension where everything is reversed", defaultField: "Inverse Field" },
  { id: 63, code: "glitch_zone",       name: "Glitch Zone",        description: "Corrupted space with unstable reality", defaultField: "Glitch Field" },
  { id: 64, code: "tricksters_lair",   name: "Trickster's Lair",   description: "Whimsical area full of pranks and illusions", defaultField: "Trickster Field" },
  { id: 65, code: "rainbow_valley",    name: "Rainbow Valley",     description: "Prismatic landscape under perpetual rainbows", defaultField: "Rainbow Field" },
  { id: 66, code: "ice_cave",          name: "Ice Cave",           description: "Frozen cavern with crystalline formations", defaultField: "Icy Field" },
  { id: 67, code: "fairy_meadow",      name: "Fairy Meadow",       description: "Misty clearing filled with fairy lights", defaultField: "Misty Field" },
  { id: 68, code: "enchanted_spring",  name: "Enchanted Spring",   description: "Magical water source shrouded in mist", defaultField: "Misty Field" },
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
  coordinates?: string;           // JSON array of coordinate pairs
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
        regionId: 1,                                  // Kanto
        description: 'A greater area of a town renowned for battling.',
        population: 1_538_589,
        travelTime: 1,
        accessibility: 1,
        defaultField: '11',
        terrainMix: {
            plains: 5,
            tall_grass: 15,
            forest: 15,
            lake: 3,
            pond: 5,
            beach: 5,
            city_streets: 5,
            park: 5,
            orchard: 5,
            ranch: 5,
            maritime_port: 5,
            research_laboratory: 1,
            glitch_zone: 1,
        },
        coordinates: '"[[0.3217291944391545,0.20703125],[0.36316892020567515,0.21571180555555555],[0.3777947057703295,0.2565104166666667],[0.3838887830889355,0.2886284722222222],[0.3826699676252142,0.3207465277777778],[0.3704818129880023,0.3389756944444444],[0.34488668824985713,0.3259548611111111],[0.32538564083031807,0.3181423611111111],[0.30710340887450005,0.28515625],[0.2973528851647306,0.2712673611111111],[0.3119786707293849,0.2582465277777778],[0.2961340697010093,0.24609375],[0.28272709960007614,0.2339409722222222],[0.30100933155589416,0.22352430555555555]]"'
    },
    {
        id: 2,
        name: 'Mount Hideaway',
        regionId: 1,                                  // Kanto
        description: 'A rugged mountain area near Pallet Town with mineral-rich soil.',
        population: 348_592,
        travelTime: 2,
        accessibility: 4,
        defaultField: '37',
        terrainMix: {
            forest: 5,
            pond: 1,
            beach: 2,
            cliff_face: 5,
            mountain: 50,
            cave: 15,
            ancient_ruins: 1,
        },
        coordinates: '"[[0.32233860217101507,0.20616319444444445],[0.3649971434012569,0.21397569444444445],[0.3796229289659112,0.2513020833333333],[0.43203199390592273,0.23567708333333334],[0.4381260712245286,0.20703125],[0.43446962483336504,0.1697048611111111],[0.4174062083412683,0.16883680555555555],[0.40643686916777755,0.1740451388888889],[0.38815463721195964,0.1818576388888889],[0.37840411350219005,0.1896701388888889],[0.3674347743286993,0.1870659722222222],[0.36621595886497815,0.1948784722222222],[0.3515901733003237,0.1931423611111111],[0.34062083412683297,0.19835069444444445],[0.32843267948962107,0.19661458333333334]]"'
    },
    {
        id: 3,
        name: 'Route 1',
        regionId: 1,                                  // Kanto
        description: 'A country road full of greenery and rough paths.',
        population: 483_783,
        travelTime: 2,
        accessibility: 1,
        defaultField: '24',
        terrainMix: {
            plains: 15,
            tall_grass: 30,
            forest: 70,
            pond: 1,
            beach: 10,
            park: 5,
            orchard: 5,
            fairy_meadow: 3,
        },
        coordinates: '"[[0.3794697511336591,0.253125],[0.4246006483648864,0.23973214285714287],[0.5092210806734376,0.2174107142857143],[0.5342938013574527,0.246875],[0.5505910698020626,0.28169642857142857],[0.5518447058362634,0.31651785714285713],[0.5205038049812445,0.340625],[0.48916290412622543,0.33705357142857145],[0.47286563568161566,0.33348214285714284],[0.460329275339608,0.33705357142857145],[0.4352565546555929,0.3352678571428571],[0.423973830347786,0.328125],[0.4001547456979716,0.33169642857142856],[0.38636474932176335,0.33705357142857145],[0.372574752945555,0.33973214285714287],[0.382603841219161,0.321875],[0.38511111328756253,0.2888392857142857]]"'
    },
    {
        id: 4,
        name: 'Terracotta Shore',
        regionId: 1,                                  // Kanto
        description: 'A shoreline along a range of steep cliffs',
        population: 1_295_895,
        travelTime: 1,
        accessibility: 2,
        defaultField: '5',
        terrainMix: {
            tall_grass: 5,
            forest: 5,
            pond: 1,
            cliff_face: 55,
            city_streets: 5,
        },
        coordinates: '"[[0.437137008706894,0.16919642857142858],[0.4396442807752955,0.20580357142857142],[0.43337610060429177,0.23616071428571428],[0.4647170014593107,0.228125],[0.5085942626563372,0.21651785714285715],[0.5449497076481592,0.19419642857142858],[0.5436960716139585,0.16473214285714285],[0.5186233509299433,0.13348214285714285],[0.4785069978355191,0.096875],[0.4647170014593107,0.11919642857142858],[0.46847790956191293,0.140625],[0.4634633654251099,0.15223214285714284],[0.4559415492199054,0.16026785714285716]]"'
    },
    {
        id: 5,
        name: 'Route 22',
        regionId: 1,                                  // Kanto
        description: 'A path to Victory Road that eventually becomes impassable.',
        population: 1_148_938,
        travelTime: 4,
        accessibility: 4,
        defaultField: '11',
        terrainMix: {
            plains: 20,
            tall_grass: 5,
            lake: 5,
            pond: 1,
        },
        coordinates: '"[[0.6226751417686063,0.08258928571428571],[0.638972410213216,0.13616071428571427],[0.6038706012555948,0.165625],[0.5462033436823599,0.17455357142857142],[0.5436960716139585,0.16294642857142858],[0.5161160788615418,0.13169642857142858],[0.4797606338697198,0.09598214285714286],[0.5436960716139585,0.109375]]"'
    },
    {
        id: 6,
        name: 'Greater Viridian',
        regionId: 1,                                  // Kanto
        description: 'The greater area of Viridian City, a beautiful city that is enveloped in green year-round.',
        population: 4_629_391,
        travelTime: 3,
        accessibility: 1,
        defaultField: '18',
        terrainMix: {
            plains: 5,
            tall_grass: 5,
            forest: 10,
            city_streets: 20,
            park: 5,
            back_alley: 5,
        },
        coordinates: '"[[0.6402260462474167,0.13794642857142858],[0.670313311068235,0.17544642857142856],[0.6715669471024357,0.228125],[0.6452405903842199,0.26473214285714286],[0.6151533255634016,0.28080357142857143],[0.5512178878191629,0.28526785714285713],[0.5349206193745532,0.2486607142857143],[0.5111015347247387,0.21651785714285715],[0.5436960716139585,0.19419642857142858],[0.5462033436823599,0.17455357142857142],[0.6038706012555948,0.16651785714285713],[0.6352115021106137,0.14508928571428573],[0.6352115021106137,0.19776785714285713],[0.6113924174607994,0.19508928571428572],[0.5950951490161895,0.1924107142857143],[0.5737833364347766,0.19776785714285713],[0.5650078841953714,0.215625],[0.5913342409135873,0.25223214285714285],[0.6226751417686063,0.2450892857142857],[0.6377187741790153,0.23169642857142858],[0.6402260462474167,0.20580357142857142],[0.6367929918110836,0.19835069444444445],[0.6343553608836412,0.1427951388888889]]"'
    },
    {
        id: 7,
        name: 'Viridian Central',
        regionId: 1,                                  // Kanto
        description: 'The nature-loving city where flowers bloom all year round.',
        population: 3_023_631,
        travelTime: 2,
        accessibility: 1,
        defaultField: '18',
        terrainMix: {
            city_streets: 70,
            industrial_zone: 3,
            colosseum: 1,
            training_gym: 1,
            hall_of_mirrors: 1,
            concert_arena: 1,
            back_alley: 35,
            carnival_grounds: 3,
        },
        coordinates: '"[[0.6352115021106137,0.19955357142857144],[0.5950951490161895,0.1924107142857143],[0.5750369724689774,0.19776785714285713],[0.5662615202295721,0.21473214285714284],[0.5913342409135873,0.2513392857142857],[0.6226751417686063,0.24419642857142856],[0.6377187741790153,0.23169642857142858],[0.6414796822816176,0.20491071428571428]]"'
    },
    {
        id: 8,
        name: 'Route 26',
        regionId: 1,                                  // Kanto
        description: 'An unimaginably difficult mountain road that gives the impression of a test.',
        population: 375_831,
        travelTime: 4,
        accessibility: 5,
        defaultField: '5',
        terrainMix: {
            forest: 5,
            cliff_face: 35,
            mountain: 50,
            canyon: 25,
            valley: 25,
        },
        coordinates: '"[[0.5430513209218348,0.10714285714285714],[0.47328348294128664,0.09161490683229814],[0.45802176838304176,0.07919254658385093],[0.43839956395101265,0.08540372670807453],[0.4144168696451992,0.08850931677018634],[0.4078761348345228,0.018633540372670808],[0.47982421775196304,0.017080745341614908],[0.5343303411742664,0.018633540372670808]]"'
    },
    {
        id: 9,
        name: 'Route 27',
        regionId: 1,                                  // Kanto
        description: 'A road that crosses from Johto to the Kanto region, like a new journey.',
        population: 738_483,
        travelTime: 3,
        accessibility: 4,
        defaultField: '31',
        terrainMix: {
            forest: 15,
            beach: 2,
            cliff_face: 5,
            valley: 15,
            mangrove: 5,
        },
        coordinates: '"[[0.4081230283911672,0.017973856209150325],[0.41500573558933185,0.08823529411764706],[0.3851806710639518,0.09313725490196079],[0.35764984227129337,0.08986928104575163],[0.3324132492113565,0.0915032679738562],[0.31635359908230576,0.07352941176470588],[0.30717665615141954,0.06045751633986928],[0.2888227702896473,0.05718954248366013],[0.2819400630914827,0.04084967320261438],[0.28652853455692573,0.0196078431372549]]"'
    },
    {
        id: 10,
        name: 'Tohjo Falls',
        regionId: 1,                                  // Kanto
        description: 'The Tohjo waterfall that links the Kanto and Johto regions.',
        population: 1_349_830,
        travelTime: 2,
        accessibility: 5,
        defaultField: '16',
        terrainMix: {
            waterfall: 10,
            mountain: 25,
            cave: 35,
            canyon: 5,
            plateau: 25,
            valley: 25,
            ancient_ruins: 1,
            dragons_den: 1,
        },
        coordinates: '"[[0.6149994038392751,0.08074534161490683],[0.5408710759849427,0.10869565217391304],[0.5321500962373742,0.018633540372670808],[0.6389820981450884,0.017080745341614908],[0.6433425880188728,0.05434782608695652]]"'
    },
    {
        id: 11,
        name: 'Route 28',
        regionId: 1,                                  // Kanto
        description: 'A vacant and hidden mountain road that continues to Mt. Silver.',
        population: 291_811,
        travelTime: 2,
        accessibility: 5,
        defaultField: '37',
        terrainMix: {
            tall_grass: 5,
            forest: 5,
            waterfall: 10,
            mountain: 50,
            cave: 5,
            canyon: 5,
            plateau: 25,
            valley: 25,
            ice_cave: 15,
        },
        coordinates: '"[[0.7086679093776885,0.017973856209150325],[0.6398408373960425,0.016339869281045753],[0.6444293088614855,0.05228758169934641],[0.6214869515342701,0.08006535947712418],[0.6352523659305993,0.11437908496732026],[0.6650774304559793,0.10784313725490197],[0.6857255520504733,0.07352941176470588],[0.6811370805850301,0.05228758169934641]]"'
    },
    {
        id: 12,
        name: 'Victory Road',
        regionId: 1,                                  // Kanto
        description: 'A cave that tests Trainers aiming to reach the Pokémon League at the summit.',
        population: 128_931,
        travelTime: 4,
        accessibility: 5,
        defaultField: '16',
        terrainMix: {
            mountain: 15,
            cave: 60,
            crystal_cavern: 35,
            canyon: 5,
            plateau: 25,
            valley: 20,
            ice_cave: 30,
        },
        coordinates: '"[[0.6880197877831947,0.07352941176470588],[0.7430814453685116,0.09477124183006536],[0.7706122741611701,0.08496732026143791],[0.7729065098938916,0.017973856209150325],[0.7109621451104101,0.016339869281045753],[0.6834313163177517,0.049019607843137254]]"'
    },
    {
        id: 13,
        name: 'Route 23',
        regionId: 1,                                  // Kanto
        description: 'A mountain path where only the strongest Trainers may pass.',
        population: 283_911,
        travelTime: 3,
        accessibility: 5,
        defaultField: '37',
        terrainMix: {
            mountain: 50,
            cave: 25,
            canyon: 5,
            plateau: 25,
            valley: 30,
            ice_cave: 15,
        },
        coordinates: '"[[0.6352523659305993,0.11437908496732026],[0.6673716661887008,0.10784313725490197],[0.6857255520504733,0.07352941176470588],[0.7407872096357901,0.09640522875816994],[0.7706122741611701,0.08496732026143791],[0.7889661600229424,0.12418300653594772],[0.7545526240321193,0.16339869281045752],[0.7155506165758532,0.15359477124183007],[0.6742543733868656,0.14705882352941177],[0.646723544594207,0.14869281045751634]]"'
    },
    {
        id: 14,
        name: 'Indigo Plateau',
        regionId: 1,                                  // Kanto
        description: 'A plateau where the Pokémon League stands towering above all else.',
        population: 1_201_289,
        travelTime: 4,
        accessibility: 4,
        defaultField: '2',
        terrainMix: {
            mountain: 25,
            cave: 5,
            snowfield: 5,
            glacier: 15,
            canyon: 10,
            plateau: 80,
            valley: 15,
            city_streets: 5,
            colosseum: 1,
            outer_space: 1,
            dragons_den: 1,
            ice_cave: 25,
        },
        coordinates: '"[[0.7912603957556639,0.12254901960784313],[0.7706122741611701,0.08660130718954248],[0.7729065098938916,0.016339869281045753],[0.9770934901061084,0.014705882352941176],[0.9770934901061084,0.11764705882352941],[0.8967952394608546,0.12418300653594772],[0.8646759392027531,0.12908496732026145],[0.8233796960137654,0.1388888888888889],[0.7545526240321193,0.16339869281045752]]"'
    },
    {
        id: 15,
        name: 'Fennel Valley',
        regionId: 1,                                  // Kanto
        description: 'A long, windy valley with troves of greenery.',
        population: 498_291,
        travelTime: 5,
        accessibility: 5,
        defaultField: '31',
        terrainMix: {
            forest: 10,
            waterfall: 10,
            mountain: 50,
            snowfield: 5,
            glacier: 5,
            canyon: 10,
            plateau: 15,
            valley: 70,
            hot_spring: 5,
            rainbow_valley: 15,
        },
        coordinates: '"[[0.7889661600229424,0.15196078431372548],[0.8119085173501577,0.19281045751633988],[0.8417335818755377,0.19117647058823528],[0.8807355893318038,0.18790849673202614],[0.9747992543733869,0.18137254901960784],[0.9770934901061084,0.11764705882352941],[0.8967952394608546,0.12254901960784313]]"'
    },
    {
        id: 16,
        name: 'Route 2 South',
        regionId: 1,                                  // Kanto
        description: 'A southern path that winds and bends around Viridian Forest.',
        population: 1_149_303,
        travelTime: 3,
        accessibility: 1,
        defaultField: '24',
        terrainMix: {
            plains: 20,
            tall_grass: 25,
            forest: 75,
            pond: 1,
            park: 5,
            orchard: 5,
        },
        coordinates: '"[[0.6490177803269286,0.14869281045751634],[0.671960137654144,0.17320261437908496],[0.671960137654144,0.22712418300653595],[0.646723544594207,0.2647058823529412],[0.6191927158015487,0.28104575163398693],[0.6834313163177517,0.2826797385620915],[0.7063736736449671,0.272875816993464],[0.7201390880412962,0.23039215686274508],[0.7270217952394609,0.19117647058823528],[0.7270217952394609,0.15849673202614378],[0.6857255520504733,0.14869281045751634]]"'
    },
    {
        id: 17,
        name: 'Viridian Forest',
        regionId: 1,                                  // Kanto
        description: 'A deep, shady forest filled with nature and Bug-type Pokémon.',
        population: 849_331,
        travelTime: 4,
        accessibility: 2,
        defaultField: '24',
        terrainMix: {
            tall_grass: 5,
            forest: 90,
            pond: 1,
            enchanted_spring: 5,
        },
        coordinates: '"[[0.7270217952394609,0.1568627450980392],[0.7568468597648408,0.16339869281045752],[0.7866719242902208,0.15196078431372548],[0.7981431029538285,0.1715686274509804],[0.7752007456266131,0.20098039215686275],[0.761435331230284,0.2434640522875817],[0.7499641525666763,0.2647058823529412],[0.7086679093776885,0.272875816993464],[0.7224333237740177,0.22712418300653595],[0.7293160309721824,0.1895424836601307]]"'
    },
    {
        id: 18,
        name: 'Route 2 North',
        regionId: 1,                                  // Kanto
        description: 'A northern path that winds and bends around Viridian Forest.',
        population: 1_194_822,
        travelTime: 3,
        accessibility: 1,
        defaultField: '24',
        terrainMix: {
            plains: 20,
            tall_grass: 25,
            forest: 85,
            pond: 1,
            orchard: 5,
        },
        coordinates: '"[[0.7981431029538285,0.17320261437908496],[0.7774949813593347,0.19934640522875818],[0.7522583882993977,0.2647058823529412],[0.7063736736449671,0.272875816993464],[0.7430814453685116,0.31209150326797386],[0.7889661600229424,0.29411764705882354],[0.8073200458847146,0.2647058823529412],[0.8142027530828793,0.22058823529411764],[0.8119085173501577,0.19281045751633988]]"'
    },
    {
        id: 19,
        name: 'Pewter Basin',
        regionId: 1,                                  // Kanto
        description: 'The stone city that rests at the foot of a great rocky mountain.',
        population: 3_919_283,
        travelTime: 4,
        accessibility: 2,
        defaultField: '18',
        terrainMix: {
            tall_grass: 5,
            mountain: 5,
            city_streets: 30,
            colosseum: 1,
            training_gym: 1,
            back_alley: 2,
        },
        coordinates: '"[[0.8112214481595666,0.19254658385093168],[0.8155819380333509,0.21739130434782608],[0.8090412032226746,0.2639751552795031],[0.850465857023625,0.2748447204968944],[0.900611490572144,0.2841614906832298],[0.918053450067281,0.2577639751552795],[0.918053450067281,0.21583850931677018],[0.9158732051303888,0.18633540372670807]]"'
    },
    {
        id: 20,
        name: 'Hollow Mountains West',
        regionId: 1,                                  // Kanto
        description: 'A long and winding mountain range.',
        population: 218_444,
        travelTime: 5,
        accessibility: 5,
        defaultField: '37',
        terrainMix: {
            cliff_face: 5,
            mountain: 90,
            cave: 40,
            snowfield: 5,
            glacier: 5,
            canyon: 15,
            crystal_peak: 15,
            deep_earth_core: 5,
            ice_cave: 5,
        },
        coordinates: '"[[0.9759463722397477,0.18137254901960784],[0.9162962431889876,0.18627450980392157],[0.9185904789217092,0.21405228758169934],[0.9185904789217092,0.2581699346405229],[0.8841769429308861,0.3088235294117647],[0.9759463722397477,0.31699346405228757]]"'
    },
    {
        id: 21,
        name: 'Route 3',
        regionId: 1,                                  // Kanto
        description: 'A grassy road near the mountainside with large fallen rocks all about.',
        population: 665_839,
        travelTime: 3,
        accessibility: 2,
        defaultField: '11',
        terrainMix: {
            plains: 50,
            tall_grass: 25,
            forest: 20,
            pond: 1,
            cliff_face: 10,
            valley: 25,
        },
        coordinates: '"[[0.8990894751935762,0.28431372549019607],[0.8830298250645254,0.30718954248366015],[0.8692644106681962,0.3562091503267974],[0.8233796960137654,0.38235294117647056],[0.7706122741611701,0.369281045751634],[0.7430814453685116,0.3137254901960784],[0.7912603957556639,0.29411764705882354],[0.8096142816174362,0.2630718954248366],[0.8440278176082593,0.27450980392156865]]"'
    },
    {
        id: 22,
        name: 'Mount Moon',
        regionId: 1,                                  // Kanto
        description: 'A mountain where shooting stars are said to fall.',
        population: 1_894_819,
        travelTime: 5,
        accessibility: 3,
        defaultField: '37',
        terrainMix: {
            cliff_face: 5,
            mountain: 85,
            cave: 35,
            crystal_cavern: 20,
            snowfield: 5,
            glacier: 5,
            canyon: 5,
            valley: 5,
            ancient_ruins: 10,
            city_streets: 5,
            crystal_peak: 15,
            starlight_arena: 10,
            deep_earth_core: 5,
            ice_cave: 5,
        },
        coordinates: '"[[0.9747992543733869,0.31862745098039214],[0.8853240607972469,0.3088235294117647],[0.8738528821336392,0.3545751633986928],[0.825673931746487,0.380718954248366],[0.8440278176082593,0.4493464052287582],[0.9059721823917407,0.4624183006535948],[0.9747992543733869,0.46405228758169936]]"'
    },
    {
        id: 23,
        name: 'Diglett Hills',
        regionId: 1,                                  // Kanto
        description: 'A tunnel dug by Diglett connecting Vermilion City to Pewter City.',
        population: 758_331,
        travelTime: 5,
        accessibility: 3,
        defaultField: '11',
        terrainMix: {
            plains: 25,
            tall_grass: 25,
            forest: 50,
            pond: 1,
            cave: 30,
        },
        coordinates: '"[[0.7043894462518523,0.2732919254658385],[0.6869474867567154,0.2826086956521739],[0.6324413633344121,0.281055900621118],[0.647703077892657,0.38198757763975155],[0.7087499361256366,0.39285714285714285],[0.7697967943586163,0.3695652173913043],[0.7436338551159107,0.31211180124223603]]"'
    },
    {
        id: 24,
        name: 'Route 4',
        regionId: 1,                                  // Kanto
        description: 'A one-way road down a hill from Mt. Moon that leads to Cerulean City.',
        population: 1_145_783,
        travelTime: 5,
        accessibility: 1,
        defaultField: '11',
        terrainMix: {
            plains: 50,
            tall_grass: 25,
            forest: 25,
            pond: 1,
            cliff_face: 5,
            valley: 25,
            orchard: 5,
        },
        coordinates: '"[[0.8325566389446516,0.4068627450980392],[0.8027315744192716,0.47058823529411764],[0.8142027530828793,0.4852941176470588],[0.8142027530828793,0.5147058823529411],[0.8027315744192716,0.5620915032679739],[0.8715586464009177,0.5620915032679739],[0.8967952394608546,0.5163398692810458],[0.9059721823917407,0.4624183006535948],[0.8440278176082593,0.45098039215686275]]"'
    },
    {
        id: 25,
        name: 'Hollow Mountains East',
        regionId: 1,                                  // Kanto
        description: 'A long and winding mountain range.',
        population: 348_211,
        travelTime: 5,
        accessibility: 5,
        defaultField: '37',
        terrainMix: {
            cliff_face: 5,
            mountain: 90,
            cave: 40,
            snowfield: 5,
            glacier: 5,
            canyon: 15,
            crystal_peak: 15,
            deep_earth_core: 5,
            ice_cave: 5,
        },
        coordinates: '"[[0.9082664181244623,0.46405228758169936],[0.8967952394608546,0.5163398692810458],[0.8738528821336392,0.5620915032679739],[0.9747992543733869,0.5833333333333334],[0.9747992543733869,0.46568627450980393]]"'
    },
    {
        id: 26,
        name: 'Cerulean Cave',
        regionId: 1,                                  // Kanto
        description: 'A cave that had collapsed once. It has been reconstructed.',
        population: 219_283,
        travelTime: 1,
        accessibility: 5,
        defaultField: '37',
        terrainMix: {
            mountain: 80,
            cave: 60,
        },
        coordinates: '"[[0.8646759392027531,0.5620915032679739],[0.8463220533409808,0.6045751633986928],[0.8738528821336392,0.6356209150326797],[0.9747992543733869,0.6437908496732027],[0.9770934901061084,0.5849673202614379]]"'
    },
    {
        id: 27,
        name: 'Cerulean Plains',
        regionId: 1,                                  // Kanto
        description: 'The town surrounded by waterways. The Water-type Gym is located here.',
        population: 4_895_822,
        travelTime: 5,
        accessibility: 1,
        defaultField: '11',
        terrainMix: {
            plains: 50,
            tall_grass: 10,
            forest: 5,
            riverbank: 5,
            pond: 15,
            city_streets: 30,
            colosseum: 1,
            park: 15,
            training_gym: 1,
            back_alley: 2,
        },
        coordinates: '"[[0.8646759392027531,0.5620915032679739],[0.80043733868655,0.5620915032679739],[0.766023802695727,0.5555555555555556],[0.7683180384284485,0.6062091503267973],[0.7797892170920562,0.6421568627450981],[0.7797892170920562,0.6683006535947712],[0.8210854602810439,0.684640522875817],[0.8577932320045885,0.6895424836601307],[0.8761471178663608,0.6372549019607843],[0.8463220533409808,0.6045751633986928]]"'
    },
    {
        id: 28,
        name: 'Route 24',
        regionId: 1,                                  // Kanto
        description: 'Crosses the waterway via the famous Nugget Bridge, just north of Cerulean City.',
        population: 689_411,
        travelTime: 2,
        accessibility: 2,
        defaultField: '11',
        terrainMix: {
            plains: 20,
            tall_grass: 25,
            forest: 35,
            riverbank: 10,
            pond: 10,
            mountain: 15,
            valley: 10,
            park: 5,
        },
        coordinates: '"[[0.86008746773731,0.6895424836601307],[0.8967952394608546,0.7238562091503268],[0.9747992543733869,0.7140522875816994],[0.9770934901061084,0.6454248366013072],[0.8807355893318038,0.6372549019607843]]"'
    },
    {
        id: 29,
        name: 'Frodo Lake',
        regionId: 1,                                  // Kanto
        description: 'A tranquil set of towns on a lake.',
        population: 1_123_728,
        travelTime: 3,
        accessibility: 1,
        defaultField: '24',
        terrainMix: {
            tall_grass: 5,
            forest: 65,
            lake: 50,
            pond: 1,
            lake_shore: 50,
            fairy_glade: 1,
            bewitched_woods: 15,
            enchanted_spring: 15,
        },
        coordinates: '"[[0.8038786922856324,0.5620915032679739],[0.7648766848293662,0.553921568627451],[0.7006380843131632,0.5212418300653595],[0.7258746773731001,0.4738562091503268],[0.7740536277602523,0.48856209150326796],[0.8015844565529108,0.4738562091503268],[0.8176441066819615,0.48366013071895425],[0.81534987094924,0.5147058823529411]]"'
    },
    {
        id: 30,
        name: 'Central Kantonian Range',
        regionId: 1,                                  // Kanto
        description: 'A series of mountains in Kanto\'s heartland',
        population: 481_322,
        travelTime: 5,
        accessibility: 4,
        defaultField: '37',
        terrainMix: {
            cliff_face: 5,
            mountain: 90,
            cave: 35,
            crystal_cavern: 20,
            canyon: 5,
            dimensional_rift: 1,
            inverse_world: 1,
        },
        coordinates: '"[[0.6834313163177517,0.3888888888888889],[0.6926082592486378,0.45588235294117646],[0.7247275595067393,0.4738562091503268],[0.7752007456266131,0.48856209150326796],[0.8027315744192716,0.4722222222222222],[0.8348508746773731,0.4035947712418301],[0.825673931746487,0.38235294117647056],[0.7729065098938916,0.369281045751634],[0.7109621451104101,0.39215686274509803]]"'
    },
    {
        id: 31,
        name: 'Route 25',
        regionId: 1,                                  // Kanto
        description: 'A path that winds through the forest and comes out overlooking the sea.',
        population: 318_762,
        travelTime: 4,
        accessibility: 2,
        defaultField: '11',
        terrainMix: {
            plains: 20,
            tall_grass: 25,
            forest: 35,
            riverbank: 5,
            pond: 1,
            mountain: 15,
            valley: 15,
            park: 5,
        },
        coordinates: '"[[0.9770934901061084,0.7156862745098039],[0.8967952394608546,0.7254901960784313],[0.8922067679954115,0.7810457516339869],[0.9013837109262977,0.8447712418300654],[0.9725050186406653,0.8513071895424836]]"'
    },
    {
        id: 32,
        name: 'Crimson City Shore',
        regionId: 1,                                  // Kanto
        description: 'A northern, rocky shore of Kanto, with a quaint city.',
        population: 1_428_233,
        travelTime: 2,
        accessibility: 1,
        defaultField: '34',
        terrainMix: {
            forest: 15,
            riverbank: 10,
            beach: 35,
            city_streets: 30,
            hot_spring: 5,
            maritime_port: 5,
            back_alley: 2,
        },
        coordinates: '"[[0.9725050186406653,0.8513071895424836],[0.9747992543733869,0.9117647058823529],[0.9541511327788931,0.9117647058823529],[0.9357972469171207,0.9150326797385621],[0.9128548895899053,0.9052287581699346],[0.8830298250645254,0.8921568627450981],[0.8623817034700315,0.869281045751634],[0.8990894751935762,0.8447712418300654]]"'
    },
    {
        id: 33,
        name: 'Cerulean Cape',
        regionId: 1,                                  // Kanto
        description: 'A shore with gentle breezes.',
        population: 1_283_923,
        travelTime: 2,
        accessibility: 3,
        defaultField: '34',
        terrainMix: {
            tall_grass: 5,
            forest: 25,
            pond: 1,
            beach: 35,
            hot_spring: 5,
            maritime_port: 5,
        },
        coordinates: '"[[0.8945010037281331,0.8055555555555556],[0.9013837109262977,0.8415032679738562],[0.8646759392027531,0.8676470588235294],[0.8486162890737023,0.8578431372549019],[0.8027315744192716,0.8464052287581699],[0.7889661600229424,0.8137254901960784],[0.8027315744192716,0.7826797385620915]]"'
    },
    {
        id: 34,
        name: 'Rifure Range',
        regionId: 1,                                  // Kanto
        description: 'A small range that starts the Northeast of Kanto.',
        population: 201_839,
        travelTime: 5,
        accessibility: 5,
        defaultField: '37',
        terrainMix: {
            mountain: 90,
            cave: 35,
            crystal_cavern: 5,
            canyon: 15,
            dimensional_rift: 1,
            inverse_world: 1,
        },
        coordinates: '"[[0.7797892170920562,0.6683006535947712],[0.8233796960137654,0.6862745098039216],[0.86008746773731,0.6895424836601307],[0.8967952394608546,0.7238562091503268],[0.8967952394608546,0.803921568627451],[0.8050258101519931,0.7826797385620915],[0.7706122741611701,0.7532679738562091],[0.7591410954975624,0.696078431372549]]"'
    },
    {
        id: 35,
        name: 'Route 9',
        regionId: 1,                                  // Kanto
        description: 'A road that forms a maze crossing a small, rocky mountain.',
        population: 1_184_393,
        travelTime: 5,
        accessibility: 2,
        defaultField: '11',
        terrainMix: {
            plains: 20,
            tall_grass: 25,
            forest: 20,
            riverbank: 10,
            pond: 1,
            canyon: 10,
            valley: 25,
        },
        coordinates: '"[[0.7741572842324005,0.6366459627329193],[0.7196511608100973,0.6521739130434783],[0.7131104259994209,0.6816770186335404],[0.7065696911887445,0.7018633540372671],[0.7196511608100973,0.7298136645962733],[0.7392733652421264,0.7950310559006211],[0.7872387538537533,0.812111801242236],[0.8025004684119982,0.782608695652174],[0.7697967943586163,0.7531055900621118],[0.7567153247372634,0.6972049689440993],[0.7785177741061847,0.6677018633540373]]"'
    },
    {
        id: 36,
        name: 'Kanto Power Plant',
        regionId: 1,                                  // Kanto
        description: 'The plant that generates all the energy for the Kanto region.',
        population: 432_397,
        travelTime: 1,
        accessibility: 3,
        defaultField: '8',
        terrainMix: {
            lake: 5,
            industrial_zone: 50,
            power_plant: 50,
        },
        coordinates: '"[[0.7224333237740177,0.7336601307189542],[0.6903140235159162,0.738562091503268],[0.6696659019214224,0.7647058823529411],[0.6444293088614855,0.7892156862745098],[0.7040794379122455,0.8186274509803921],[0.7407872096357901,0.795751633986928]]"'
    },
    {
        id: 37,
        name: 'Route 10',
        regionId: 1,                                  // Kanto
        description: 'The route runs along a canal and leads to the cavernous Rock Tunnel.',
        population: 576_768,
        travelTime: 3,
        accessibility: 4,
        defaultField: '10',
        terrainMix: {
            tall_grass: 5,
            forest: 5,
            riverbank: 20,
            graveyard: 10,
            lost_hotel: 5,
        },
        coordinates: '"[[0.8027315744192716,0.8447712418300654],[0.7889661600229424,0.8137254901960784],[0.7407872096357901,0.795751633986928],[0.7040794379122455,0.8186274509803921],[0.676548609119587,0.8349673202614379],[0.6673716661887008,0.8790849673202614],[0.6880197877831947,0.8676470588235294],[0.7178448523085748,0.8464052287581699],[0.7499641525666763,0.8366013071895425],[0.7774949813593347,0.8366013071895425]]"'
    },
    {
        id: 38,
        name: 'Greater Lavender',
        regionId: 1,                                  // Kanto
        description: 'The greater area of a solemn, quiet town. People come to visit their departed Pokémon.',
        population: 2_938_911,
        travelTime: 2,
        accessibility: 2,
        defaultField: '7',
        terrainMix: {
            plains: 5,
            tall_grass: 5,
            forest: 10,
            riverbank: 5,
            beach: 5,
            graveyard: 50,
            city_streets: 10,
            lost_hotel: 25,
            psychic_nexus: 1,
            bewitched_woods: 35,
            back_alley: 3,
        },
        coordinates: '"[[0.7040794379122455,0.8169934640522876],[0.6788428448523085,0.8333333333333334],[0.6673716661887008,0.880718954248366],[0.646723544594207,0.8709150326797386],[0.6283696587324348,0.8758169934640523],[0.6146042443361055,0.8643790849673203],[0.5962503584743333,0.8643790849673203],[0.5893676512761686,0.8382352941176471],[0.5733080011471179,0.8022875816993464],[0.6008388299397763,0.7843137254901961],[0.6421350731287641,0.7892156862745098]]"'
    },
    {
        id: 39,
        name: 'Route 8',
        regionId: 1,                                  // Kanto
        description: 'A short road that leads to the blocked-off Underground Path.',
        population: 1_485_922,
        travelTime: 4,
        accessibility: 2,
        defaultField: '11',
        terrainMix: {
            plains: 25,
            tall_grass: 25,
            forest: 5,
            pond: 1,
            canyon: 10,
            valley: 25,
            graveyard: 10,
        },
        coordinates: '"[[0.7178448523085748,0.6519607843137255],[0.6604889589905363,0.6633986928104575],[0.5985445942070547,0.6454248366013072],[0.5985445942070547,0.6879084967320261],[0.6031330656724978,0.7254901960784313],[0.5893676512761686,0.7549019607843137],[0.6008388299397763,0.7843137254901961],[0.6421350731287641,0.7892156862745098],[0.6903140235159162,0.7369281045751634],[0.7201390880412962,0.7320261437908496],[0.7063736736449671,0.7026143790849673]]"'
    },
    {
        id: 40,
        name: 'Route 5',
        regionId: 1,                                  // Kanto
        description: 'A placid sloping road connecting to the Underground Path.',
        population: 467_743,
        travelTime: 4,
        accessibility: 1,
        defaultField: '11',
        terrainMix: {
            plains: 25,
            tall_grass: 25,
            forest: 40,
            riverbank: 5,
            pond: 1,
            orchard: 5,
        },
        coordinates: '"[[0.7683180384284485,0.5555555555555556],[0.7040794379122455,0.5212418300653595],[0.7063736736449671,0.5686274509803921],[0.7201390880412962,0.5980392156862745],[0.7178448523085748,0.6503267973856209],[0.7774949813593347,0.6356209150326797],[0.7683180384284485,0.6062091503267973]]"'
    },
    {
        id: 41,
        name: 'Saffron Central',
        regionId: 1,                                  // Kanto
        description: 'The biggest city in Kanto, shining with a golden light.',
        population: 6_741_689,
        travelTime: 2,
        accessibility: 1,
        defaultField: '18',
        terrainMix: {
            city_streets: 70,
            industrial_zone: 3,
            colosseum: 5,
            training_gym: 1,
            psychic_nexus: 1,
            hall_of_mirrors: 1,
            concert_arena: 1,
            back_alley: 20,
            chess_court: 1,
        },
        coordinates: '"[[0.6742543733868656,0.5686274509803921],[0.6237811872669916,0.5588235294117647],[0.6237811872669916,0.5882352941176471],[0.6237811872669916,0.6274509803921569],[0.6581947232578147,0.6356209150326797],[0.6903140235159162,0.6143790849673203]]"'
    },
    {
        id: 42,
        name: 'Greater Saffron',
        regionId: 1,                                  // Kanto
        description: 'Greater area of a city with tall buildings tower overhead.',
        population: 6_283_177,
        travelTime: 4,
        accessibility: 2,
        defaultField: '18',
        terrainMix: {
            plains: 5,
            tall_grass: 5,
            forest: 10,
            riverbank: 5,
            city_streets: 20,
            park: 5,
            back_alley: 5,
            carnival_grounds: 3,
        },
        coordinates: '"[[0.7040794379122455,0.5473856209150327],[0.6581947232578147,0.5310457516339869],[0.5893676512761686,0.5343137254901961],[0.5893676512761686,0.5686274509803921],[0.5916618870088901,0.6176470588235294],[0.6008388299397763,0.6437908496732027],[0.6627831947232579,0.6617647058823529],[0.7132563808431316,0.6486928104575164],[0.7201390880412962,0.5980392156862745],[0.7063736736449671,0.5702614379084967],[0.7043894462518523,0.5481366459627329],[0.6760462620722547,0.5683229813664596],[0.6913079766304996,0.6133540372670807],[0.6607845475140097,0.6350931677018633],[0.6237203835868436,0.6288819875776398],[0.6215401386499515,0.5590062111801242],[0.6760462620722547,0.5667701863354038]]"'
    },
    {
        id: 43,
        name: 'Leaf Forest',
        regionId: 1,                                  // Kanto
        description: 'A small forest to the West of Saffron.',
        population: 471_822,
        travelTime: 4,
        accessibility: 2,
        defaultField: '24',
        terrainMix: {
            tall_grass: 5,
            forest: 75,
            pond: 1,
            orchard: 5,
            bewitched_woods: 15,
            enchanted_spring: 5,
        },
        coordinates: '"[[0.7247275595067393,0.4738562091503268],[0.7017852021795239,0.5212418300653595],[0.7040794379122455,0.545751633986928],[0.6604889589905363,0.5294117647058824],[0.6329581301978778,0.5310457516339869],[0.6559004875250932,0.477124183006536],[0.6903140235159162,0.45751633986928103]]"'
    },
    {
        id: 44,
        name: 'Route 7',
        regionId: 1,                                  // Kanto
        description: 'A short road that leads to the blocked-off Underground Path',
        population: 301_782,
        travelTime: 3,
        accessibility: 1,
        defaultField: '11',
        terrainMix: {
            plains: 25,
            tall_grass: 25,
            forest: 25,
            pond: 1,
            orchard: 5,
        },
        coordinates: '"[[0.6398408373960425,0.5081699346405228],[0.5847791798107256,0.49836601307189543],[0.5457771723544594,0.511437908496732],[0.5503656438199025,0.5620915032679739],[0.5916618870088901,0.5947712418300654],[0.5893676512761686,0.5343137254901961],[0.6329581301978778,0.5310457516339869]]"'
    },
    {
        id: 45,
        name: 'North Vermilion Forest',
        regionId: 1,                                  // Kanto
        description: 'The north of a large forest.',
        population: 681_741,
        travelTime: 4,
        accessibility: 3,
        defaultField: '24',
        terrainMix: {
            tall_grass: 15,
            forest: 80,
            riverbank: 5,
            pond: 1,
            fairy_meadow: 5,
            enchanted_spring: 5,
        },
        coordinates: '"[[0.5687195296816747,0.5784313725490197],[0.5480714080871809,0.5980392156862745],[0.5297175222254087,0.6535947712418301],[0.5480714080871809,0.6879084967320261],[0.6008388299397763,0.7140522875816994],[0.5985445942070547,0.6454248366013072],[0.5916618870088901,0.5947712418300654]]"'
    },
    {
        id: 46,
        name: 'Gardenia Hills',
        regionId: 1,                                  // Kanto
        description: 'A series of lush, rolling hills.',
        population: 667_518,
        travelTime: 2,
        accessibility: 2,
        defaultField: '24',
        terrainMix: {
            tall_grass: 25,
            forest: 25,
            park: 5,
            orchard: 5,
            enchanted_spring: 5,
        },
        coordinates: '"[[0.6490177803269286,0.38235294117647056],[0.6834313163177517,0.3888888888888889],[0.6903140235159162,0.45588235294117646],[0.6581947232578147,0.47549019607843135],[0.6398408373960425,0.5081699346405228],[0.6008388299397763,0.5],[0.6031330656724978,0.43300653594771243]]"'
    },
    {
        id: 47,
        name: 'Gringey Shore',
        regionId: 1,                                  // Kanto
        description: 'A coastline filled with factories and grime.',
        population: 1_747_897,
        travelTime: 3,
        accessibility: 3,
        defaultField: '18',
        terrainMix: {
            swamp: 5,
            city_streets: 20,
            industrial_zone: 15,
            power_plant: 15,
            toxic_wasteland: 5,
        },
        coordinates: '"[[0.5480714080871809,0.5098039215686274],[0.4861270433036995,0.4934640522875817],[0.49071551476914255,0.5081699346405228],[0.5090694006309149,0.5163398692810458],[0.49071551476914255,0.5212418300653595],[0.48842127903642096,0.545751633986928],[0.49071551476914255,0.5637254901960784],[0.5159521078290794,0.5751633986928104],[0.5457771723544594,0.5947712418300654],[0.5687195296816747,0.5784313725490197],[0.5503656438199025,0.5620915032679739]]"'
    },
    {
        id: 48,
        name: 'Greater Hop City',
        regionId: 1,                                  // Kanto
        description: 'The vast greater area around a city with large skyscrapers.',
        population: 2_187_312,
        travelTime: 4,
        accessibility: 2,
        defaultField: '11',
        terrainMix: {
            plains: 55,
            tall_grass: 25,
            forest: 20,
            pond: 1,
            beach: 3,
            city_streets: 15,
            park: 5,
            orchard: 5,
            ranch: 5,
            chess_court: 1,
        },
        coordinates: '"[[0.6146042443361055,0.28104575163398693],[0.6352523659305993,0.28104575163398693],[0.646723544594207,0.380718954248366],[0.6031330656724978,0.43137254901960786],[0.5710137654143963,0.4084967320261438],[0.5503656438199025,0.380718954248366],[0.5549541152853456,0.3627450980392157],[0.5618368224835102,0.3464052287581699],[0.5411887008890164,0.34477124183006536],[0.5205405792945226,0.3415032679738562],[0.5503656438199025,0.315359477124183],[0.5526598795526241,0.28594771241830064]]"'
    },
    {
        id: 49,
        name: 'Celadon Outskirts',
        regionId: 1,                                  // Kanto
        description: 'The outskirts of a city where people of many generations live together.',
        population: 3_113_371,
        travelTime: 3,
        accessibility: 2,
        defaultField: '18',
        terrainMix: {
            tall_grass: 10,
            forest: 10,
            city_streets: 20,
            park: 5,
            back_alley: 2,
        },
        coordinates: '"[[0.5687195296816747,0.4084967320261438],[0.6031330656724978,0.43137254901960786],[0.6008388299397763,0.5016339869281046],[0.5847791798107256,0.49673202614379086],[0.5503656438199025,0.5098039215686274],[0.4861270433036995,0.4918300653594771],[0.4975982219673072,0.47058823529411764],[0.5388944651562948,0.49019607843137253],[0.5572483510180671,0.4673202614379085],[0.5457771723544594,0.42810457516339867]]"'
    },
    {
        id: 50,
        name: 'Celadon Central',
        regionId: 1,                                  // Kanto
        description: 'A rich, rainbow colored city where people and Pokémon gather.',
        population: 1_889_712,
        travelTime: 2,
        accessibility: 1,
        defaultField: '18',
        terrainMix: {
            beach: 2,
            city_streets: 70,
            industrial_zone: 3,
            colosseum: 1,
            maritime_port: 5,
            training_gym: 1,
            back_alley: 15,
        },
        coordinates: '"[[0.5457771723544594,0.42810457516339867],[0.5113636363636364,0.41830065359477125],[0.4861270433036995,0.42483660130718953],[0.49071551476914255,0.43790849673202614],[0.493009750501864,0.4542483660130719],[0.4975982219673072,0.4673202614379085],[0.5388944651562948,0.48856209150326796],[0.5572483510180671,0.4673202614379085]]"'
    },
    {
        id: 51,
        name: 'Route 16',
        regionId: 1,                                  // Kanto
        description: 'The northern starting point of Cycling Road.',
        population: 938_712,
        travelTime: 1,
        accessibility: 1,
        defaultField: '34',
        terrainMix: {
            tall_grass: 5,
            forest: 5,
            beach: 30,
        },
        coordinates: '"[[0.5480714080871809,0.38235294117647056],[0.5274232864926871,0.3839869281045752],[0.5067751648981933,0.380718954248366],[0.4953039862345856,0.3937908496732026],[0.48842127903642096,0.40522875816993464],[0.4838328075709779,0.42320261437908496],[0.5113636363636364,0.4166666666666667],[0.5457771723544594,0.4264705882352941],[0.5710137654143963,0.4068627450980392]]"'
    },
    {
        id: 52,
        name: 'Cycling Road (Route 17)',
        regionId: 1,                                  // Kanto
        description: 'An easy path of Cycling Road running above the sea.',
        population: 89_171,
        travelTime: 5,
        accessibility: 2,
        defaultField: '35',
        terrainMix: {
            open_ocean: 50,
            seafloor: 10,
            maritime_port: 5,
        },
        coordinates: '"[[0.49874533983366787,0.39215686274509803],[0.20737740177803266,0.3937908496732026],[0.22114281617436193,0.4035947712418301],[0.49186263263550334,0.40522875816993464]]"'
    },
    {
        id: 53,
        name: 'Foca Island',
        regionId: 1,                                  // Kanto
        description: 'A large island in the middle of Vermilion Bay.',
        population: 151_455,
        travelTime: 1,
        accessibility: 3,
        defaultField: '35',
        terrainMix: {
            open_ocean: 50,
            seafloor: 1,
            city_streets: 50,
            maritime_port: 5,
            hall_of_mirrors: 10,
        },
        coordinates: '"[[0.35764984227129337,0.40522875816993464],[0.35764984227129337,0.41830065359477125],[0.3760037281330657,0.42483660130718953],[0.3782979638657872,0.4035947712418301]]"'
    },
    {
        id: 54,
        name: 'Vermilion Bay',
        regionId: 1,                                  // Kanto
        description: 'Vermilion Bay\'s water area and surrounding islands.',
        population: 65_719,
        travelTime: 5,
        accessibility: 4,
        defaultField: '35',
        terrainMix: {
            open_ocean: 100,
            seafloor: 50,
        },
        coordinates: '"[[0.4746558646400918,0.40522875816993464],[0.38059219959850876,0.40522875816993464],[0.3782979638657872,0.42483660130718953],[0.35764984227129337,0.41830065359477125],[0.35764984227129337,0.4035947712418301],[0.21999569830800114,0.4035947712418301],[0.25211499856610264,0.4215686274509804],[0.3025881846859765,0.4395424836601307],[0.3301190134786349,0.4673202614379085],[0.35994407800401496,0.5196078431372549],[0.42647691425293954,0.5310457516339869],[0.454007743045598,0.49673202614379086],[0.4654789217092056,0.4624183006535948],[0.48842127903642096,0.43790849673202614]]"'
    },
    {
        id: 55,
        name: 'Route 6',
        regionId: 1,                                  // Kanto
        description: 'A road running south of Saffron City connecting to the Underground Path.',
        population: 432_456,
        travelTime: 3,
        accessibility: 2,
        defaultField: '24',
        terrainMix: {
            plains: 25,
            tall_grass: 25,
            forest: 50,
            riverbank: 5,
            lake: 10,
            pond: 5,
            lake_shore: 5,
            orchard: 5,
            fairy_meadow: 5,
            enchanted_spring: 5,
        },
        coordinates: '"[[0.4953039862345856,0.5686274509803921],[0.49989245770002866,0.5947712418300654],[0.49071551476914255,0.6209150326797386],[0.5021866934327502,0.6568627450980392],[0.5480714080871809,0.6879084967320261],[0.5274232864926871,0.6535947712418301],[0.5480714080871809,0.5947712418300654]]"'
    },
    {
        id: 56,
        name: 'Greater Vermilion',
        regionId: 1,                                  // Kanto
        description: 'The greater area of a southern city that is bathed in orange by the setting sun.',
        population: 2_004_839,
        travelTime: 3,
        accessibility: 1,
        defaultField: '18',
        terrainMix: {
            plains: 5,
            tall_grass: 5,
            forest: 10,
            pond: 1,
            beach: 5,
            city_streets: 25,
            park: 5,
            back_alley: 5,
        },
        coordinates: '"[[0.4953039862345856,0.5686274509803921],[0.47006739317464874,0.5718954248366013],[0.4654789217092056,0.5980392156862745],[0.4494192715801548,0.619281045751634],[0.4058287926584456,0.6143790849673203],[0.39206337826211646,0.6454248366013072],[0.428771149985661,0.6617647058823529],[0.46777315744192716,0.673202614379085],[0.5044809291654717,0.6601307189542484],[0.48842127903642096,0.6225490196078431],[0.49989245770002866,0.5931372549019608]]"'
    },
    {
        id: 57,
        name: 'Vermilion Central',
        regionId: 1,                                  // Kanto
        description: 'The international port town where magnificent boats gather from across the world.',
        population: 1_563_022,
        travelTime: 1,
        accessibility: 1,
        defaultField: '18',
        terrainMix: {
            pond: 1,
            beach: 10,
            city_streets: 70,
            industrial_zone: 3,
            colosseum: 1,
            maritime_port: 5,
            training_gym: 1,
            back_alley: 20,
        },
        coordinates: '"[[0.47006739317464874,0.5702614379084967],[0.46777315744192716,0.5964052287581699],[0.4494192715801548,0.619281045751634],[0.42418267852021796,0.6160130718954249],[0.42647691425293954,0.5866013071895425],[0.43565385718382565,0.5702614379084967],[0.454007743045598,0.5604575163398693]]"'
    },
    {
        id: 58,
        name: 'Greater Porta Vista',
        regionId: 1,                                  // Kanto
        description: 'The greater area of a popular beachside resort town.',
        population: 2_189_431,
        travelTime: 2,
        accessibility: 2,
        defaultField: '34',
        terrainMix: {
            tall_grass: 5,
            riverbank: 5,
            beach: 45,
            city_streets: 20,
            carnival_grounds: 15,
        },
        coordinates: '"[[0.4058287926584456,0.6143790849673203],[0.3874749067966734,0.6078431372549019],[0.3668267852021795,0.6029411764705882],[0.3461786636076857,0.6062091503267973],[0.33700172067679957,0.5882352941176471],[0.31864783481502723,0.6029411764705882],[0.32782477774591334,0.6388888888888888],[0.3553556065385718,0.6535947712418301],[0.38288643533123023,0.6633986928104575],[0.39435761399483793,0.6454248366013072]]"'
    },
    {
        id: 59,
        name: 'North Safari Coast',
        regionId: 1,                                  // Kanto
        description: 'An amusement park outside Fuchsia City where many rare Pokémon can be observed in the wild.',
        population: 319_822,
        travelTime: 4,
        accessibility: 3,
        defaultField: '34',
        terrainMix: {
            plains: 1,
            cliff_face: 1,
            tall_grass: 1,
            forest: 1,
            rainforest: 1,
            swamp: 1,
            lake: 1,
            pond: 1,
            waterfall: 1,
            beach: 20,
            coral_reef: 1,
            open_ocean: 1,
            seafloor: 1,
            mountain: 1,
            crystal_cavern: 1,
            volcano: 1,
            taiga: 1,
            tundra: 1,
            snowfield: 1,
            glacier: 1,
            desert: 1,
            savanna: 1,
            canyon: 1,
            lake_shore: 1,
            mangrove: 1,
            wetlands: 1,
            ancient_ruins: 1,
            graveyard: 1,
            city_streets: 1,
            industrial_zone: 1,
            power_plant: 1,
            colosseum: 1,
            park: 1,
            orchard: 1,
            ranch: 1,
            hot_spring: 1,
            dimensional_rift: 1,
            outer_space: 1,
            fairy_glade: 1,
            crystal_peak: 1,
            lost_hotel: 1,
            maritime_port: 1,
            research_laboratory: 1,
            training_gym: 1,
            toxic_wasteland: 1,
            infernal_realm: 1,
            psychic_nexus: 1,
            dragons_den: 1,
            hall_of_mirrors: 1,
            concert_arena: 1,
            bewitched_woods: 1,
            murkwater_marsh: 1,
            smoky_heights: 1,
            starlight_arena: 1,
            back_alley: 1,
            chess_court: 1,
            deep_earth_core: 1,
            inverse_world: 1,
            glitch_zone: 1,
            tricksters_lair: 1,
            rainbow_valley: 1,
            ice_cave: 1,
            fairy_meadow: 1,
            enchanted_spring: 1,
            carnival_grounds: 1,
        },
        coordinates: '"[[0.33700172067679957,0.5882352941176471],[0.334707484944078,0.5686274509803921],[0.31864783481502723,0.5588235294117647],[0.3324132492113565,0.5424836601307189],[0.3324132492113565,0.5212418300653595],[0.32782477774591334,0.49836601307189543],[0.3209420705477488,0.4820261437908497],[0.3140593633495842,0.46078431372549017],[0.2773515916260396,0.44281045751633985],[0.28652853455692573,0.4869281045751634],[0.2911170060223688,0.5130718954248366],[0.29341124175509037,0.5359477124183006],[0.29341124175509037,0.5571895424836601],[0.3002939489532549,0.5866013071895425],[0.31864783481502723,0.5996732026143791]]"'
    },
    {
        id: 60,
        name: 'Route 11',
        regionId: 1,                                  // Kanto
        description: 'A grassy path with a gentle, refreshing breeze.',
        population: 591_822,
        travelTime: 2,
        accessibility: 2,
        defaultField: '31',
        terrainMix: {
            tall_grass: 20,
            forest: 10,
            pond: 1,
            cliff_face: 5,
            valley: 25,
        },
        coordinates: '"[[0.39435761399483793,0.6470588235294118],[0.38288643533123023,0.6633986928104575],[0.3966518497275595,0.7026143790849673],[0.4195942070547749,0.7418300653594772],[0.4517135073128764,0.761437908496732],[0.49071551476914255,0.75],[0.5067751648981933,0.7173202614379085],[0.5067751648981933,0.6633986928104575],[0.47006739317464874,0.673202614379085]]"'
    },
    {
        id: 61,
        name: 'South Diglett Hills',
        regionId: 1,                                  // Kanto
        description: 'A set of hills in a forest.',
        population: 381_378,
        travelTime: 3,
        accessibility: 3,
        defaultField: '24',
        terrainMix: {
            tall_grass: 15,
            forest: 75,
            pond: 1,
            cave: 30,
            fairy_meadow: 5,
        },
        coordinates: '"[[0.5090694006309149,0.6617647058823529],[0.5457771723544594,0.6879084967320261],[0.6008388299397763,0.7124183006535948],[0.6031330656724978,0.7254901960784313],[0.5893676512761686,0.7532679738562091],[0.6008388299397763,0.7843137254901961],[0.5733080011471179,0.8022875816993464],[0.5687195296816747,0.7875816993464052],[0.543482936621738,0.7859477124183006],[0.522834815027244,0.761437908496732],[0.49071551476914255,0.75],[0.5090694006309149,0.7156862745098039]]"'
    },
    {
        id: 62,
        name: 'Greater Gold Coast',
        regionId: 1,                                  // Kanto
        description: 'The greater area of a town with fine beaches.',
        population: 4_571_821,
        travelTime: 4,
        accessibility: 2,
        defaultField: '18',
        terrainMix: {
            tall_grass: 5,
            forest: 20,
            beach: 20,
            city_streets: 30,
            park: 5,
            back_alley: 5,
        },
        coordinates: '"[[0.543482936621738,0.7843137254901961],[0.5251290507599655,0.761437908496732],[0.49071551476914255,0.75],[0.45630197877831946,0.7598039215686274],[0.42418267852021796,0.7450980392156863],[0.41500573558933185,0.7663398692810458],[0.3760037281330657,0.7908496732026143],[0.37141525666762265,0.8104575163398693],[0.3530613708058503,0.8137254901960784],[0.34847289934040726,0.8284313725490197],[0.35994407800401496,0.8415032679738562],[0.38059219959850876,0.8398692810457516],[0.40124032119300257,0.8251633986928104],[0.41500573558933185,0.7973856209150327],[0.44712503584743335,0.7826797385620915],[0.4746558646400918,0.7826797385620915],[0.49071551476914255,0.7941176470588235],[0.5113636363636364,0.7875816993464052]]"'
    },
    {
        id: 63,
        name: 'Gold Coast Central',
        regionId: 1,                                  // Kanto
        description: 'A bustling city with a seaside resort.',
        population: 2_328_139,
        travelTime: 2,
        accessibility: 1,
        defaultField: '18',
        terrainMix: {
            beach: 50,
            city_streets: 70,
            colosseum: 1,
            concert_arena: 1,
            back_alley: 20,
        },
        coordinates: '"[[0.48842127903642096,0.795751633986928],[0.47695010037281327,0.7826797385620915],[0.44712503584743335,0.7826797385620915],[0.4172999713220533,0.795751633986928],[0.40124032119300257,0.8235294117647058],[0.42418267852021796,0.8218954248366013],[0.4425365643819903,0.8120915032679739],[0.4631846859764841,0.8088235294117647]]"'
    },
    {
        id: 64,
        name: 'Route 12',
        regionId: 1,                                  // Kanto
        description: 'An island bank known for its fishing.',
        population: 516_272,
        travelTime: 4,
        accessibility: 3,
        defaultField: '26',
        terrainMix: {
            swamp: 5,
            beach: 2,
            coral_reef: 5,
            wetlands: 5,
            murkwater_marsh: 5,
        },
        coordinates: '"[[0.582484944078004,0.8251633986928104],[0.5411887008890164,0.8186274509803921],[0.493009750501864,0.8235294117647058],[0.4631846859764841,0.8251633986928104],[0.3851806710639518,0.8382352941176471],[0.36223831373673643,0.8431372549019608],[0.3851806710639518,0.8529411764705882],[0.4195942070547749,0.8513071895424836],[0.4631846859764841,0.8496732026143791],[0.5159521078290794,0.8480392156862745],[0.5893676512761686,0.8398692810457516]]"'
    },
    {
        id: 65,
        name: 'Old Shore',
        regionId: 1,                                  // Kanto
        description: 'A long, old shore of Kanto.',
        population: 1_184_933,
        travelTime: 5,
        accessibility: 2,
        defaultField: '34',
        terrainMix: {
            plains: 5,
            tall_grass: 25,
            forest: 20,
            beach: 35,
            orchard: 5,
        },
        coordinates: '"[[0.39697491015006214,0.7763975155279503],[0.3795329506549251,0.7484472049689441],[0.36863172597046445,0.7251552795031055],[0.34028854179086687,0.7080745341614907],[0.31412560254816124,0.6987577639751553],[0.2879626633054557,0.7158385093167702],[0.3032243778637006,0.7220496894409938],[0.3184860924219455,0.7282608695652174],[0.3293873171064061,0.7360248447204969],[0.34246878672775893,0.7453416149068323],[0.3511897664753275,0.7562111801242236],[0.36209099115978816,0.7763975155279503],[0.36209099115978816,0.7872670807453416],[0.3729922158442488,0.7934782608695652]]"'
    },
    {
        id: 66,
        name: 'Route 13',
        regionId: 1,                                  // Kanto
        description: 'A difficult, narrow path where many Trainers await you.',
        population: 781_811,
        travelTime: 4,
        accessibility: 2,
        defaultField: '24',
        terrainMix: {
            plains: 5,
            tall_grass: 25,
            forest: 55,
            riverbank: 5,
            pond: 1,
            orchard: 5,
        },
        coordinates: '"[[0.42418267852021796,0.7450980392156863],[0.41500573558933185,0.7647058823529411],[0.3989460854602811,0.7761437908496732],[0.36912102093490107,0.7254901960784313],[0.3415901921422426,0.7075163398692811],[0.31635359908230576,0.6977124183006536],[0.32782477774591334,0.6405228758169934],[0.3553556065385718,0.6552287581699346],[0.38288643533123023,0.6617647058823529],[0.39435761399483793,0.6993464052287581]]"'
    },
    {
        id: 67,
        name: 'Bulbasaur Island',
        regionId: 1,                                  // Kanto
        description: 'An island off the coast of Southeast Kanto.',
        population: 178_232,
        travelTime: 1,
        accessibility: 3,
        defaultField: '48',
        terrainMix: {
            beach: 5,
            mangrove: 15,
            wetlands: 5,
            orchard: 5,
            fairy_glade: 35,
            murkwater_marsh: 15,
            fairy_meadow: 35,
        },
        coordinates: '"[[0.28423429882420415,0.7549019607843137],[0.2544092342988242,0.7483660130718954],[0.22687840550616578,0.7369281045751634],[0.22228993404072273,0.75],[0.23146687697160884,0.7630718954248366],[0.2245841697734442,0.7745098039215687],[0.23376111270433042,0.7875816993464052],[0.23376111270433042,0.8006535947712419],[0.21999569830800114,0.8169934640522876],[0.23834958416977348,0.826797385620915],[0.2567034700315457,0.8398692810457516],[0.2773515916260396,0.8349673202614379],[0.27276312016059645,0.8202614379084967],[0.2819400630914827,0.803921568627451],[0.2888227702896473,0.7892156862745098],[0.2819400630914827,0.7745098039215687]]"'
    },
    {
        id: 68,
        name: 'Route 14',
        regionId: 1,                                  // Kanto
        description: 'A pleasant coastal road where the breeze blows and waves roar.',
        population: 517_822,
        travelTime: 3,
        accessibility: 1,
        defaultField: '24',
        terrainMix: {
            plains: 5,
            tall_grass: 25,
            forest: 45,
            riverbank: 5,
            lake: 5,
            pond: 5,
            beach: 2,
            park: 5,
            orchard: 5,
            lost_hotel: 5,
            carnival_grounds: 5,
        },
        coordinates: '"[[0.31864783481502723,0.5996732026143791],[0.2681746486951534,0.6241830065359477],[0.25211499856610264,0.6535947712418301],[0.24293805563521653,0.7058823529411765],[0.28652853455692573,0.7173202614379085],[0.3140593633495842,0.6977124183006536],[0.32782477774591334,0.6405228758169934]]"'
    },
    {
        id: 69,
        name: 'Route 15',
        regionId: 1,                                  // Kanto
        description: 'A path that cuts through the row of trees to come out on the coastline.',
        population: 1_292_839,
        travelTime: 4,
        accessibility: 2,
        defaultField: '11',
        terrainMix: {
            plains: 5,
            tall_grass: 25,
            forest: 20,
            pond: 1,
            park: 5,
            ranch: 5,
        },
        coordinates: '"[[0.31864783481502723,0.5996732026143791],[0.270468884427875,0.6209150326797386],[0.25211499856610264,0.6552287581699346],[0.2245841697734442,0.6454248366013072],[0.21540722684255809,0.5294117647058824],[0.25211499856610264,0.5081699346405228],[0.2911170060223688,0.511437908496732],[0.2911170060223688,0.5571895424836601],[0.2979997132205334,0.5866013071895425]]"'
    },
    {
        id: 70,
        name: 'Laramie Canyon',
        regionId: 1,                                  // Kanto
        description: 'A canyon in the South of Kanto',
        population: 928_311,
        travelTime: 4,
        accessibility: 4,
        defaultField: '5',
        terrainMix: {
            beach: 10,
            cliff_face: 35,
            crystal_cavern: 10,
            desert: 3,
            canyon: 60,
            valley: 50,
            ancient_ruins: 5,
            ranch: 5,
        },
        coordinates: '"[[0.2544092342988242,0.6552287581699346],[0.24293805563521653,0.7058823529411765],[0.2245841697734442,0.704248366013072],[0.2039360481789504,0.696078431372549],[0.17640521938629194,0.6764705882352942],[0.17640521938629194,0.6601307189542484],[0.1580513335245196,0.6503267973856209],[0.16493404072268425,0.6323529411764706],[0.14658015486091192,0.6143790849673203],[0.1374032119300258,0.5915032679738562],[0.14428591912819044,0.5751633986928104],[0.21770146257527956,0.5702614379084967],[0.2245841697734442,0.6454248366013072]]"'
    },
    {
        id: 71,
        name: 'South Neon Shore',
        regionId: 1,                                  // Kanto
        description: 'A south shore of a bustling, lit-up city.',
        population: 1_367_838,
        travelTime: 4,
        accessibility: 3,
        defaultField: '34',
        terrainMix: {
            plains: 5,
            tall_grass: 5,
            pond: 1,
            beach: 10,
            city_streets: 5,
        },
        coordinates: '"[[0.21540722684255809,0.5294117647058824],[0.18558216231717806,0.5049019607843137],[0.14658015486091192,0.5016339869281046],[0.1374032119300258,0.5196078431372549],[0.14658015486091192,0.5343137254901961],[0.14428591912819044,0.5473856209150327],[0.15116862632635508,0.5620915032679739],[0.14658015486091192,0.5751633986928104],[0.21770146257527956,0.5686274509803921]]"'
    },
    {
        id: 72,
        name: 'Fuchsia Central',
        regionId: 1,                                  // Kanto
        description: 'A historic village that has become new.',
        population: 1_777_460,
        travelTime: 2,
        accessibility: 1,
        defaultField: '18',
        terrainMix: {
            tall_grass: 5,
            pond: 1,
            city_streets: 40,
            industrial_zone: 3,
            park: 5,
            training_gym: 1,
            back_alley: 2,
        },
        coordinates: '"[[0.2911170060223688,0.5098039215686274],[0.25211499856610264,0.5065359477124183],[0.21770146257527956,0.5277777777777778],[0.19475910524806428,0.5081699346405228],[0.20852451964439345,0.4493464052287582],[0.24293805563521653,0.45098039215686275],[0.2796458273587611,0.46405228758169936]]"'
    },
    {
        id: 73,
        name: 'Stone Shore',
        regionId: 1,                                  // Kanto
        description: 'The southern, beachy point.',
        population: 1_203_928,
        travelTime: 2,
        accessibility: 2,
        defaultField: '34',
        terrainMix: {
            plains: 5,
            tall_grass: 5,
            forest: 10,
            pond: 1,
            beach: 30,
        },
        coordinates: '"[[0.20623028391167197,0.45098039215686275],[0.16263980498996267,0.45588235294117646],[0.13510897619730422,0.4395424836601307],[0.116755090335532,0.44281045751633985],[0.10069544020648125,0.4722222222222222],[0.10298967593920272,0.48856209150326796],[0.13281474046458275,0.49019607843137253],[0.1488743905936335,0.5],[0.19475910524806428,0.5065359477124183]]"'
    },
    {
        id: 74,
        name: 'Matcha Shore',
        regionId: 1,                                  // Kanto
        description: 'A relaxing, breezy beach.',
        population: 2_183_743,
        travelTime: 2,
        accessibility: 2,
        defaultField: '11',
        terrainMix: {
            tall_grass: 25,
            pond: 1,
            beach: 10,
            city_streets: 10,
            park: 5,
            maritime_port: 5,
        },
        coordinates: '"[[0.2773515916260396,0.4395424836601307],[0.2819400630914827,0.46405228758169936],[0.24982076283338117,0.45098039215686275],[0.20852451964439345,0.4477124183006536],[0.18787639804989964,0.4215686274509804],[0.20623028391167197,0.39705882352941174],[0.24982076283338117,0.4215686274509804]]"'
    },
    {
        id: 75,
        name: 'Route 18',
        regionId: 1,                                  // Kanto
        description: 'The southern ending point of Cycling Road.',
        population: 702_202,
        travelTime: 2,
        accessibility: 1,
        defaultField: '34',
        terrainMix: {
            tall_grass: 5,
            forest: 5,
            pond: 1,
            beach: 30,
        },
        coordinates: '"[[0.18558216231717806,0.4199346405228758],[0.16493404072268425,0.42810457516339867],[0.13281474046458275,0.4362745098039216],[0.16263980498996267,0.4542483660130719],[0.21081875537711503,0.4493464052287582]]"'
    },
    {
        id: 76,
        name: 'Route 19',
        regionId: 1,                                  // Kanto
        description: 'A coastal road littered with rocks due to Cinnabar Island\'s volcano eruption.',
        population: 847_282,
        travelTime: 5,
        accessibility: 4,
        defaultField: '35',
        terrainMix: {
            beach: 30,
            coral_reef: 10,
            open_ocean: 100,
            seafloor: 50,
        },
        coordinates: '"[[0.1375257626598988,0.5201863354037267],[0.11572331329097751,0.5077639751552795],[0.10482208860651687,0.4891304347826087],[0.10046159873273264,0.4720496894409938],[0.11572331329097751,0.4409937888198758],[0.12008380316476175,0.41304347826086957],[0.1375257626598988,0.39751552795031053],[0.16804919177638866,0.3804347826086957],[0.18331090633463354,0.35714285714285715],[0.17458992658706507,0.33229813664596275],[0.1506072322812516,0.3245341614906832],[0.12008380316476175,0.3245341614906832],[0.09174061898516417,0.3307453416149068],[0.061217189868674304,0.33695652173913043],[0.043775230373537255,0.34782608695652173],[0.03723449556286085,0.36335403726708076],[0.06339743480556648,0.38354037267080743],[0.09174061898516417,0.38198757763975155],[0.10046159873273264,0.40217391304347827],[0.07865914936381135,0.41304347826086957],[0.06339743480556648,0.39906832298136646],[0.06339743480556648,0.38198757763975155],[0.035054250625968786,0.36335403726708076],[0.03287400568907661,0.38664596273291924],[0.03287400568907661,0.4083850931677019],[0.04159498543664519,0.43788819875776397],[0.043775230373537255,0.47360248447204967],[0.061217189868674304,0.5031055900621118],[0.08519988417448776,0.5357142857142857],[0.14188625253368303,0.546583850931677],[0.14624674240746738,0.532608695652174]]"'
    },
    {
        id: 77,
        name: 'Storm Isle',
        regionId: 1,                                  // Kanto
        description: 'A beach resort in the middle of Route 19.',
        population: 791_471,
        travelTime: 2,
        accessibility: 3,
        defaultField: '35',
        terrainMix: {
            beach: 50,
            open_ocean: 50,
            seafloor: 1,
            city_streets: 50,
            maritime_port: 5,
        },
        coordinates: '"[[0.0938127330083166,0.38235294117647056],[0.06398766848293658,0.38562091503267976],[0.06398766848293658,0.40032679738562094],[0.07545884714654427,0.4133986928104575],[0.09840120447375966,0.40522875816993464]]"'
    },
    {
        id: 78,
        name: 'Cinnabar-Waiko Islands',
        regionId: 1,                                  // Kanto
        description: 'The town at the foot of a volcano. ',
        population: 649_202,
        travelTime: 2,
        accessibility: 3,
        defaultField: '35',
        terrainMix: {
            beach: 50,
            coral_reef: 5,
            open_ocean: 50,
            seafloor: 50,
            volcano: 5,
            ancient_ruins: 10,
            city_streets: 10,
            power_plant: 5,
            maritime_port: 5,
            training_gym: 1,
            infernal_realm: 1,
            smoky_heights: 5,
            tricksters_lair: 1,
        },
        coordinates: '"[[0.12363779753369664,0.1781045751633987],[0.10757814740464577,0.1650326797385621],[0.08004731861198733,0.1650326797385621],[0.07775308287926586,0.1830065359477124],[0.06398766848293658,0.19444444444444445],[0.038751075422999715,0.20261437908496732],[0.04333954688844277,0.2173202614379085],[0.061693432750215105,0.22549019607843138],[0.05710496128477205,0.24183006535947713],[0.05939919701749352,0.2761437908496732],[0.06398766848293658,0.3022875816993464],[0.0938127330083166,0.3137254901960784],[0.116755090335532,0.29901960784313725],[0.13510897619730422,0.272875816993464],[0.11216661887008894,0.25980392156862747],[0.1374032119300258,0.24183006535947713],[0.1374032119300258,0.21895424836601307],[0.12363779753369664,0.20588235294117646]]"'
    },
    {
        id: 79,
        name: 'Route 20',
        regionId: 1,                                  // Kanto
        description: 'A popular path with swimmers.',
        population: 492_322,
        travelTime: 5,
        accessibility: 4,
        defaultField: '35',
        terrainMix: {
            beach: 30,
            coral_reef: 5,
            open_ocean: 100,
            seafloor: 50,
            cave: 10,
            crystal_cavern: 5,
            ancient_ruins: 5,
            ice_cave: 5,
        },
        coordinates: '"[[0.05710496128477205,0.28104575163398693],[0.02727989675939202,0.2973856209150327],[0.024985661026670436,0.3235294117647059],[0.03416260395755666,0.35947712418300654],[0.045633782621164354,0.34477124183006536],[0.06398766848293658,0.3349673202614379],[0.11904932606825347,0.3235294117647059],[0.1488743905936335,0.32189542483660133],[0.17411098365357036,0.33169934640522875],[0.17640521938629194,0.30392156862745096],[0.17869945511901353,0.272875816993464],[0.17411098365357036,0.25163398692810457],[0.1580513335245196,0.23202614379084968],[0.1396974476627474,0.24183006535947713],[0.11446085460281041,0.2581699346405229],[0.1374032119300258,0.27124183006535946],[0.12363779753369664,0.29411764705882354],[0.0938127330083166,0.31209150326797386],[0.06398766848293658,0.30392156862745096]]"'
    },
    {
        id: 80,
        name: 'Route 21',
        regionId: 1,                                  // Kanto
        description: 'A sea path warmed by the volcano on the horizon.',
        population: 217_821,
        travelTime: 5,
        accessibility: 4,
        defaultField: '35',
        terrainMix: {
            beach: 30,
            coral_reef: 10,
            open_ocean: 100,
            seafloor: 50,
        },
        coordinates: '"[[0.1374032119300258,0.2173202614379085],[0.180993690851735,0.1977124183006536],[0.21081875537711503,0.20588235294117646],[0.2475265271006596,0.2042483660130719],[0.27276312016059645,0.20261437908496732],[0.28423429882420415,0.23202614379084968],[0.3094708918841411,0.2565359477124183],[0.2979997132205334,0.27124183006535946],[0.26358617722971034,0.272875816993464],[0.2245841697734442,0.272875816993464],[0.2016418124462288,0.2647058823529412],[0.17869945511901353,0.2696078431372549],[0.17869945511901353,0.25],[0.1603455692572412,0.23202614379084968],[0.1396974476627474,0.24019607843137256]]"'
    },
    {
        id: 81,
        name: 'Sevii Islands',
        regionId: 1,                                  // Kanto
        description: 'A chain of nine large islands and several small islands surrounding them.',
        population: 87_483,
        travelTime: 5,
        accessibility: 5,
        defaultField: '35',
        terrainMix: {
            beach: 30,
            coral_reef: 30,
            open_ocean: 50,
            seafloor: 25,
            canyon: 5,
        },
        coordinates: '"[[0.12226404810165392,0.10403726708074534],[0.09174061898516417,0.09316770186335403],[0.052496210121105835,0.09316770186335403],[0.03069376075218455,0.10869565217391304],[0.03069376075218455,0.14751552795031056],[0.03723449556286085,0.17080745341614906],[0.06339743480556648,0.1956521739130435],[0.07865914936381135,0.18322981366459629],[0.08083939430070342,0.16459627329192547],[0.10264184366962481,0.16304347826086957],[0.1244442930385461,0.17546583850931677]]"'
    },
    {
        id: 82,
        name: 'Mandarin Island',
        regionId: 1,                                  // Kanto
        description: 'A large island in the South Orange Archipelago.',
        population: 743_833,
        travelTime: 5,
        accessibility: 5,
        defaultField: '35',
        terrainMix: {
            rainforest: 1,
            beach: 30,
            open_ocean: 50,
            seafloor: 1,
            city_streets: 10,
            rainbow_valley: 1,
        },
        coordinates: '"[[0.06857613994837974,0.0457516339869281],[0.05251648981932888,0.032679738562091505],[0.03645683969027813,0.04084967320261438],[0.03645683969027813,0.05718954248366013],[0.06398766848293658,0.06372549019607843],[0.08738012911137982,0.06521739130434782],[0.09174061898516417,0.04813664596273292],[0.08519988417448776,0.03260869565217391]]"'
    },
    {
        id: 83,
        name: 'East Orange',
        regionId: 1,                                  // Kanto
        description: 'East Orange Archipelago',
        population: 283_282,
        travelTime: 5,
        accessibility: 5,
        defaultField: '35',
        terrainMix: {
            rainforest: 1,
            beach: 50,
            coral_reef: 10,
            open_ocean: 75,
            seafloor: 25,
            mangrove: 5,
            maritime_port: 5,
        },
        coordinates: '"[[0.038751075422999715,0.058823529411764705],[0.03645683969027813,0.08169934640522876],[0.05251648981932888,0.09313725490196079],[0.08693002581015197,0.0915032679738562],[0.12134356180097505,0.10294117647058823],[0.14428591912819044,0.09477124183006536],[0.14658015486091192,0.07352941176470588],[0.13281474046458275,0.05555555555555555],[0.09610696874103819,0.049019607843137254],[0.08693002581015197,0.06535947712418301],[0.06398766848293658,0.06372549019607843]]"'
    },
    {
        id: 84,
        name: 'West Orange',
        regionId: 1,                                  // Kanto
        description: 'West Orange Archipelago',
        population: 478_143,
        travelTime: 5,
        accessibility: 5,
        defaultField: '35',
        terrainMix: {
            rainforest: 1,
            beach: 50,
            coral_reef: 5,
            open_ocean: 75,
            seafloor: 25,
            mangrove: 5,
            maritime_port: 5,
        },
        coordinates: '"[[0.0846357900774305,0.032679738562091505],[0.08004731861198733,0.016339869281045753],[0.14428591912819044,0.016339869281045753],[0.1603455692572412,0.029411764705882353],[0.15116862632635508,0.04738562091503268],[0.13281474046458275,0.05392156862745098],[0.0938127330083166,0.049019607843137254]]"'
    },
    {
        id: 85,
        name: 'North Orange',
        regionId: 1,                                  // Kanto
        description: 'North Orange Archipelago',
        population: 500_594,
        travelTime: 5,
        accessibility: 5,
        defaultField: '35',
        terrainMix: {
            rainforest: 1,
            beach: 50,
            coral_reef: 5,
            open_ocean: 75,
            seafloor: 25,
            mangrove: 5,
            maritime_port: 5,
        },
        coordinates: '"[[0.1603455692572412,0.029411764705882353],[0.19934757671350734,0.024509803921568627],[0.2245841697734442,0.04084967320261438],[0.23146687697160884,0.06372549019607843],[0.21770146257527956,0.08169934640522876],[0.2016418124462288,0.10130718954248366],[0.1718167479208489,0.10947712418300654],[0.14658015486091192,0.09640522875816994],[0.14658015486091192,0.07516339869281045],[0.13510897619730422,0.05555555555555555],[0.15575709779179814,0.04738562091503268]]"'
    }
];

export const defaultSpawnRules: SpawnRule[] = [
    {
        pokemonId: 1,                                  // Bulbasaur
        highSpawn:   ['forest', 'rainforest', 'orchard', 'park'],
        mediumSpawn: ['lake_shore', 'toxic_wasteland', 'tall_grass'],
        lowSpawn:    ['swamp', 'plains', 'ranch', 'wetlands'],
        baseSpawn: 'rare',
        time:   ['day'],
        season: ['spring', 'summer'],
        minLevel: 1,
        maxLevel: 15
    },
    {
        pokemonId: 2,                                  // Ivysaur
        highSpawn:   ['forest', 'rainforest', 'orchard', 'park'],
        mediumSpawn: ['lake_shore', 'toxic_wasteland', 'tall_grass'],
        lowSpawn:    ['swamp', 'plains', 'ranch', 'wetlands'],
        baseSpawn: 'very_rare',
        time:   ['day'],
        season: ['spring', 'summer'],
        minLevel: 16,
        maxLevel: 32
    },
    {
        pokemonId: 3,                                  // Venusaur
        highSpawn:   ['forest', 'rainforest', 'orchard', 'park'],
        mediumSpawn: ['lake_shore', 'toxic_wasteland', 'tall_grass'],
        lowSpawn:    ['swamp', 'plains', 'ranch', 'wetlands'],
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
        mediumSpawn: ['open_ocean', 'coral_reef', 'seafloor', 'swamp'],
        lowSpawn:    ['plains', 'tall_grass', 'ranch'],
        baseSpawn: 'rare',
        time:   ['day'],
        season: ['spring', 'summer'],
        minLevel: 1,
        maxLevel: 15
    },
    {
        pokemonId: 8,                                  // Wartortle
        highSpawn:   ['riverbank', 'lake', 'pond', 'beach'],
        mediumSpawn: ['open_ocean', 'coral_reef', 'seafloor', 'swamp'],
        lowSpawn:    ['plains', 'tall_grass', 'ranch'],
        baseSpawn: 'very_rare',
        time:   ['day'],
        season: ['spring', 'summer'],
        minLevel: 16,
        maxLevel: 35
    },
    {
        pokemonId: 9,                                  // Blastoise
        highSpawn:   ['riverbank', 'lake', 'pond', 'beach'],
        mediumSpawn: ['open_ocean', 'coral_reef', 'seafloor', 'swamp'],
        lowSpawn:    ['plains', 'tall_grass', 'ranch'],
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
        lowSpawn:    ['plains', 'ranch'],
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
        lowSpawn:    ['plains', 'ranch'],
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
        lowSpawn:    ['plains', 'ranch'],
        baseSpawn: 'uncommon',
        time:   ['day'],
        season: ['spring', 'summer', 'autumn'],
        minLevel: 11,
        maxLevel: 35
    },
    {
        pokemonId: 13,                                 // Weedle
        highSpawn:   ['forest', 'rainforest'],
        mediumSpawn: ['tall_grass', 'swamp', 'orchard', 'toxic_wasteland'],
        lowSpawn:    ['plains', 'ranch'],
        baseSpawn: 'common',
        time:   ['day', 'dawn'],
        season: ['spring', 'summer', 'autumn'],
        minLevel: 1,
        maxLevel: 6
    },
    {
        pokemonId: 14,                                 // Kakuna
        highSpawn:   ['forest', 'rainforest'],
        mediumSpawn: ['tall_grass', 'swamp', 'orchard', 'toxic_wasteland'],
        lowSpawn:    ['plains', 'ranch'],
        baseSpawn: 'common',
        time:   ['day', 'dusk'],
        season: ['spring', 'summer', 'autumn'],
        minLevel: 7,
        maxLevel: 10
    },
    {
        pokemonId: 15,                                 // Beedrill
        highSpawn:   ['forest', 'rainforest'],
        mediumSpawn: ['tall_grass', 'swamp', 'orchard', 'toxic_wasteland'],
        lowSpawn:    ['plains', 'ranch'],
        baseSpawn: 'uncommon',
        time:   ['day'],
        season: ['spring', 'summer', 'autumn'],
        minLevel: 11,
        maxLevel: 35
    }
    //TODO: Add more Pokemon
];