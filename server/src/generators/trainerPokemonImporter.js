/*
const pokemonSchema = {
    pokemonID: String,
    owner: String,
    species: String,
    baseForm: String,
    nickname: String,
    level: Number,
    nature: String,
    hp: Number,
    atk: Number,
    def: Number,
    spa: Number,
    spd: Number,
    spe: Number,
    moves: [movesSchema],
    ability: String,
    gender: String,
    happiness: Number,
    origin: String,
    isShiny: Boolean,
    clutchRating: Number,
}

const formatRatingSchema = {
    singlesRating: Number,
    doublesRating: Number,
    tagBattleRating: Number,
    battleFactoryRating: Number,
    rotationRating: Number,
    sixesRating: Number,
    threesRating: Number,
    twosRating: Number,
}

const mentalRatingSchema = {
    clutchRating: Number,
    consistencyRating: Number,

}

const ratingSchema = {
    player: String,
    year: Number,
    overallRating: Number,
    formatRatings: formatRatingSchema,
    fieldRatings: fieldRatingSchema,
    mentalRatings: mentalRatingSchema,
}

const playerSchema = {
    trainerID: String,
    fName: String,
    lName: String,
    birthdate: Date,
    pastRatings: [ratingSchema],
    currentRating: ratingSchema,
    pokemonOwned: [pokemonSchema],
    hometowns: [String],
    region: String,
    totalRecord: String,
    tourRecord: String,
    tours: [String],
    pwtrRating: Number,
    pwtrRanking: Number,
    eliteFourYears: [Number], 
    gymLeaderYears: [Number], 
    championYears: [Number],
    eliteFour: String,
    gymLeader: String,
    champion: String,
    gender: String,
    activeStatus: Boolean,
}

*/

const { MongoClient, Decimal128 } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'Pokenotes';
const client = new MongoClient(url);

const db = client.db(dbName);
const speciesCollection = db.collection('species');
const learnsetsCollection = db.collection('learnsets');
const typeChartCollection = db.collection('typechart');
const viabilityCollection = db.collection('viability');
const playersCollection = db.collection('players');

const fields = [
    'Pumped Field',
    'Windy Field',
    'Corrosive Field',
    'Desert Field',
    'Cliffs Field',
    'Swarm Field',
    'Haunted Field',
    'Factory Field',
    'Infernal Field',
    'Water Surface Field',
    'Grassy Field',
    'Electirized Field',
    'Psychic Field',
    'Icy Field',
    'Draconid Den Field',
    'Dark Cavern Field',
    'Misty Field',
    'City Field',
    'Mirror Field',
    'Concert Venue Field',
    'Crystal Cavern Field',
    'Waterfall Field',
    'Volcanic Field',
    'Forest Field',
    'Flower Garden Field',
    'Swamp Field',
    'Bewitched Woods Field',
    'Murkwater Surface Field',
    'Smoky Field',
    'Frozen Dimensional Field',
    'Valley of Winds Field',
    'Lost Hotel Field',
    'Taiga Field',
    'Ashen Beach Field',
    'Underwater Field',
    'Starlight Arena Field',
    'Snowy Mountain Field',
    'Big Top Field',
    'Back Alley Field',
    'Neutral Field',
    'Chess Field',
    'Deep Earth Field',
    'Inverse Field',
    'Glitch Field',
    'Dimensional Field',
    'Colosseum Field',
    'Trickster Field',
    'Fantasy Field',
    'Rainbow Field',
    'New World Field'
]

const fs = require('fs');
const path = require('path');

const fieldAverages = {};
const fieldStdDeviations = {};

async function processTrainerPokemon() {
    try {
        await client.connect();

        for (const field of fields) {
            const mongoFieldName = formatFieldName(field);
            const allRatings = await viabilityCollection.find(
                { [`fieldRatings.${mongoFieldName}`]: { $exists: true } },
                { projection: { [`fieldRatings.${mongoFieldName}`]: 1 } }
            ).toArray();
            const ratings = allRatings.map(doc => parseFloat(doc.fieldRatings[mongoFieldName].toString()) || 0);
            fieldAverages[mongoFieldName] = calculateAverage(ratings);
            fieldStdDeviations[mongoFieldName] = calculateStandardDeviation(ratings);
        }
        //console.log(fieldAverages);
        //console.log(fieldStdDeviations);

        const fileContent = fs.readFileSync(path.join(__dirname, 'trainerPokemon.txt'), 'utf8');

        const parts = fileContent.split('//');
        const trainerParts = parts[1].trimStart();

        const sections = trainerParts.split('\n\n'); // Split by empty line

        for (const section of sections) {
            const lines = section.split('\n');
            const trainerLine = lines[0];
            const [trainerName, ratings] = trainerLine.split(':');
            let [fName, lName] = trainerName.trim().split(' ');
            const pokemonLines = lines.slice(1); // All lines after the first line

            if(lName === 'von'){
                fName = 'Caitlin';
                lName = 'von Braila';
            }
            if(lName === 'de'){
                fName = 'Arjen';
                lName = 'de Bruyn';
            }

            const trainer = await playersCollection.findOne({ fName, lName });
            if (!trainer) {
                console.log(`Trainer not found: ${trainerName}`);
                continue;
            }

            const pokemonArray = await processPokemonList(pokemonLines);
            console.log(`\n\nProcessing ${trainerName}...`);
            console.log(pokemonArray);

            let p70to75 = 0;
            let p75to80 = 0;
            let p80to85 = 0;
            let p85to90 = 0;
            let p90to95 = 0;
            let p95to100 = 0;
            let higher = 0;
            for(const pokemon of pokemonArray){
                if(pokemon.level >= 70 && pokemon.level < 75){
                    p70to75++;
                }
                else if(pokemon.level >= 75 && pokemon.level < 80){
                    p75to80++;
                }
                else if(pokemon.level >= 80 && pokemon.level < 85){
                    p80to85++;
                }
                else if(pokemon.level >= 85 && pokemon.level < 90){
                    p85to90++;
                }
                else if(pokemon.level >= 90 && pokemon.level < 95){
                    p90to95++;
                }
                else if(pokemon.level >= 95 && pokemon.level <= 100){
                    p95to100++;
                }
                else if (pokemon.level > 100){
                    higher++;
                }
            }
            console.log(`\n70-75: ${p70to75}`);
            console.log(`75-80: ${p75to80}`);
            console.log(`80-85: ${p80to85}`);
            console.log(`85-90: ${p85to90}`);
            console.log(`90-95: ${p90to95}`);
            console.log(`95-100: ${p95to100}`);
            console.log(`>100: ${higher}`);
            console.log(`Total: ${pokemonArray.length}`);
            console.log();

            const ratingsArray = ratings.trim().split(',').map(Number);

            // Create a new rating object for the year 2036
            const newRating = {
                year: 2036,
                overall: ratingsArray[0],
                typing: ratingsArray[1],
                mixed: ratingsArray[2],
                special: ratingsArray[3]
                // Add other fields as needed
            };
            console.log(newRating);

            // Generate ratings
            const fieldRatings = await generateRatings(pokemonArray, newRating);

            const avgRating = Object.values(fieldRatings).reduce((a, b) => a + b, 0) / Object.values(fieldRatings).length;
            console.log(`\nAverage rating: ${avgRating}`);
            console.log('\nFields with ratings above 83:');
            for (const field in fieldRatings) {
                if (fieldRatings[field] >= 83 && fieldRatings[field] < 90) {
                    console.log(`${field}: ${fieldRatings[field]}`);
                }
            }

            // Print fields with ratings above 90
            console.log('\nFields with ratings above 90:');
            for (const field in fieldRatings) {
                if (fieldRatings[field] >= 90) {
                    console.log(`${field}: ${fieldRatings[field]}`);
                }
            }

            //console.log(fieldRatings);

            const existingRatingIndex = trainer.ratings ? trainer.ratings.findIndex(r => r.year === 2036) : -1;
            newRating.fieldRatings = fieldRatings;
            newRating.averageFieldRating = avgRating;

            if (existingRatingIndex >= 0) {
                // Update the existing rating for 2036
                const updatePath = `ratings.${existingRatingIndex}`;
                await playersCollection.updateOne(
                    { _id: trainer._id },
                    { 
                        $set: { 
                            [updatePath]: newRating,
                            pokemonOwned: pokemonArray
                        }
                    }
                );
            } else {
                // Add a new rating for 2036
                if (!trainer.ratings) {
                    trainer.ratings = [];
                }
                await playersCollection.updateOne(
                    { _id: trainer._id },
                    { 
                        $set: { pokemonOwned: pokemonArray },
                        $push: { ratings: newRating }
                    }
                );
            }

            //Start importing ratings


        }
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await client.close();
    }
}

async function processPokemonList(pokemonLines) {
    const pokemonArray = [];


    for (const line of pokemonLines) {
        let [pokemonName, levelPart] = line.split('(');

        pokemonName = pokemonName.trim();
        const viablemon = await viabilityCollection.findOne({ _id: pokemonName });
        if (!viablemon) {
            console.log(`Viablemon not found: ${pokemonName}`);
        }

        if (pokemonName && levelPart) {
            const level = parseInt(levelPart.replace(')', ''), 10);
            const pokemonData = {
                // Fill in the pokemonSchema fields here
                species: viablemon.species,
                level: level,
                baseForm: viablemon.baseFormName,
                // Add other fields as needed
            };
            pokemonArray.push(pokemonData);
        }
    }

    return pokemonArray;
}

//generate ratings for each field
async function generateRatings(pokemonOwned, trainerRating) {
    const pokemonFrequency = {};
    const averageTopRatings = {};
    const stdDevFactors = {};
    const fieldSpecificRatings = {};
    const justRatings = {};


    const trainerFieldRatings = {};

    let i = 0;
    for(const field of fields){
        const mongoFieldName = formatFieldName(field);

        const pokemonRatings = await Promise.all(pokemonOwned.map(async pokemon => {
            const pokemonData = await viabilityCollection.findOne({ species: pokemon.species });
            let rating = getPokemonRating(pokemonData, mongoFieldName, pokemon.level);
            let species = pokemon.species;

            const baseForm = pokemon.species !== pokemon.baseForm;

            if(baseForm){
                const baseFormData =  await viabilityCollection.findOne({ species: pokemon.baseForm });

                let baseFormRating = getPokemonRating(baseFormData, mongoFieldName, pokemon.level);

                if(baseFormRating > rating){
                    //console.log(`${pokemon.species} is not viable in ${field} at level ${pokemon.level}.`);
                    species = pokemon.baseForm;                                
                    rating = baseFormRating;
                }
            }

            return {
                species: species,
                rating: rating,
                level: pokemon.level
            };
        }));
        
        //const topRatings = pokemonRatings.sort((a, b) => b.rating - a.rating).slice(0, 6);

        const topRatings = await getTopRatings(pokemonRatings, mongoFieldName);

        for(const pokemon of topRatings){
            if(!pokemonFrequency[pokemon.species]){
                pokemonFrequency[pokemon.species] = 1;
            } else {
                pokemonFrequency[pokemon.species]++;
            }
        }

        //console.log(field);
        //console.log(topRatings);

        //ratings for each field for each pokemon, only numbers
        justRatings[mongoFieldName] = topRatings.map(pokemon => pokemon.rating);

        //average of top 6 ratings for each field
        averageTopRatings[mongoFieldName] = calculateAverage(justRatings[mongoFieldName]);

        const deviationFromAverage = averageTopRatings[mongoFieldName] - fieldAverages[mongoFieldName];
        stdDevFactors[mongoFieldName] = deviationFromAverage / fieldStdDeviations[mongoFieldName];
        
        fieldSpecificRatings[mongoFieldName] = getFieldSpecificRating(trainerRating, i);

        
        //console.log(pokemonRatings);
        i++;
    }

    const topRating = Object.values(averageTopRatings).sort((a, b) => b - a)[0];
    //console.log(topRating);

    for(const field of fields){
        const mongoFieldName = formatFieldName(field);

        //console.log(field);
        trainerFieldRatings[mongoFieldName] = calculateTrainerFieldRating(averageTopRatings[mongoFieldName], fieldSpecificRatings[mongoFieldName], stdDevFactors[mongoFieldName], trainerRating.overall, topRating);

        if(field === 'Neutral Field'){
            trainerFieldRatings[mongoFieldName] = trainerRating.overall;
        }

        if(field === 'Inverse Field'){
            trainerFieldRatings[mongoFieldName] = (trainerRating.special+trainerFieldRatings[mongoFieldName])/2;
        }
        trainerFieldRatings[mongoFieldName] = Math.round(trainerFieldRatings[mongoFieldName]);

    }

    const pokemonFrequencyArray = Object.entries(pokemonFrequency);

    // Sort the array by frequency
    pokemonFrequencyArray.sort((a, b) => b[1] - a[1]);

    // If you want to convert it back to an object
    const sortedPokemonFrequency = Object.fromEntries(pokemonFrequencyArray);

    console.log(sortedPokemonFrequency);

    console.log("\nUnused Pokemon:");
    for(const pokemon in pokemonOwned){
        if(!pokemonFrequency[pokemonOwned[pokemon].species]){
            console.log(pokemonOwned[pokemon].species);
        }
    }


    return trainerFieldRatings;
}

function getPokemonRating(pokemonData, mongoFieldName, level) {
    const rating = pokemonData && pokemonData.fieldRatings && pokemonData.fieldRatings[mongoFieldName]
        ? parseFloat(pokemonData.fieldRatings[mongoFieldName].toString())
        : 0;
    const levelAdjustmentFactor = level / 100;
    return rating * levelAdjustmentFactor;
}

async function getTopRatings(pokemonRatings, mongoFieldName) {
    let selectedPokemons = new Set();
    let hasMega = false;

    let sortedRatings = pokemonRatings.sort((a, b) => b.rating - a.rating);

    //console.log(mongoFieldName);
    //console.log(sortedRatings);
    for (const pokemon of sortedRatings) {
        let isMega = (pokemon.species.endsWith('mega') && pokemon.species !== 'yanmega') || (pokemon.species.endsWith('gmax'));
        let baseForm = isMega ? pokemon.species.slice(0, -4) : pokemon.species;

        if(pokemon.species === 'charizardmegax' || pokemon.species === 'charizardmegay'){
            isMega = true;
            baseForm = 'charizard';
        }

        if (isMega) {
            if (hasMega) {
                // If already have a mega or the base form is selected, consider the base form for future selection
                const pokemonData = await viabilityCollection.findOne({ species: baseForm });
                
                //console.log(pokemonData);
                let rating = getPokemonRating(pokemonData, mongoFieldName, pokemon.level);
                sortedRatings.push({ species: baseForm, rating: rating, level: pokemon.level});

                sortedRatings = sortedRatings.sort((a, b) => b.rating - a.rating);

                //console.log("Mega Re-Sort");
                //console.log(sortedRatings);
                continue;
            }
            hasMega = true;
        } 

        selectedPokemons.add(pokemon.species);
        if (selectedPokemons.size === 6) break; // Stop if the team is full
    }

    //console.log(selectedPokemons);
    //console.log(sortedRatings);

    return Array.from(selectedPokemons).map(species => {
        return sortedRatings.find(pokemon => pokemon.species === species);
    });
}

function calculateAverage(ratings) {
    const sum = ratings.reduce((a, b) => a + b, 0);
    return sum / ratings.length;
}

function calculateStandardDeviation(ratings) {
    const mean = calculateAverage(ratings);
    const squareDiffs = ratings.map(rating => Math.pow(rating - mean, 2));
    return Math.sqrt(calculateAverage(squareDiffs));
}

function formatFieldName(fieldName) {
    return fieldName.toLowerCase().replace(/ /g, '').replace('field', 'FieldRating');
}

function getFieldSpecificRating(trainerRating, fieldIndex) {
    if(fieldIndex >= 0 && fieldIndex <= 19){
        return trainerRating.typing;
    }
    else if(fieldIndex >= 20 && fieldIndex <= 36){
        return trainerRating.mixed;
    }
    else if(fieldIndex >= 37 && fieldIndex <= 49){
        return trainerRating.special;
    }
    else {
        return 0;
    }
}

function calculateTrainerFieldRating(averageTopRating, fieldSpecificRating, stdDevFactor, overallRating, maxAverageRating){
    const normalizedAverageTopRating = (averageTopRating / maxAverageRating) * 99;

    // Amplify the standard deviation factor
    const amplifiedStdDevFactor = stdDevFactor * 50; // Amplify by a factor of 50
    //console.log(stdDevFactor);
    //console.log(`Stdev top rating: ${amplifiedStdDevFactor}`);

    // Define weights for each component
    const weightAverageTopRating = 0.30; // 40% weight
    const weightFieldSpecificRating = 0.30; // 30% weight
    const weightOverallRating = 0.25; // 20% weight
    const weightStdDevFactor = 0.20; // 10% weight

    // Calculate weighted sum
    let fieldRating = (normalizedAverageTopRating * weightAverageTopRating) +
                      (fieldSpecificRating * weightFieldSpecificRating) +
                      (overallRating * weightOverallRating) +
                      (amplifiedStdDevFactor * weightStdDevFactor);

    // Ensure the final rating is within 0-99
    fieldRating = Math.max(0, Math.min(fieldRating, 99));

    return fieldRating;
}

processTrainerPokemon().catch(console.error);

/*
To use, surround trainerPokemon.txt with // and run as so.

//
Trainer Name: Ratings (Overall, Typing, Mixed, Special)
Pokemon (Level)
... etc
//


*/