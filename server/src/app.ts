import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import trainerRoutes from './modules/trainers/trainer/trainer.routes';
import regionRoutes from './modules/geography/regions/region.routes';
import cityRoutes from './modules/geography/cities/city.routes';
import locationRoutes from './modules/geography/locations/location.routes';
import leagueRoutes from './modules/competitions/league/league.routes';
import pokemonRoutes from './modules/trainers/pokemon/pokemon.routes';
import pokemonEntityRoutes from './modules/reference-data/pokemon/pokemon-entity.routes';
import pokemonSpeciesRoutes from './modules/reference-data/pokemon/pokemon-species.routes';
import natureRoutes from './modules/reference-data/natures/nature.routes';
import gamestateRoutes from './modules/gameplay/game-state/game-state.routes';
import apiRoutes from './modules/simulation/simulation-info/simulation-info.routes';
import generateRoutes from './modules/world-generation/randomizer/randomizer.routes';
import battleRoutes from './modules/battling/singles/singles.routes';
import messageRoutes from './modules/gameplay/messages/message.routes';
import itemRoutes from './modules/gameplay/items/item.routes';
import financeRoutes from './modules/gameplay/finances/finance.routes';
import shopRoutes from './modules/gameplay/shops/shop.routes';
import terrainRoutes from './modules/geography/terrains/terrain.routes';
import metaRoutes from './modules/save-management/saves/save.routes';
import trainingRoutes from './modules/gameplay/training/training.routes';
import createLeagueRoutes from './modules/save-management/league-creation/league-creation.routes';
import tournamentRoutes from './modules/competitions/tournaments/tournament.routes';
import historyRoutes from './modules/gameplay/history/history.routes';
import badgeRoutes from './modules/competitions/badges/badge.routes';
import simRoutes from './modules/simulation/world-simulation/simulation.routes';

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/trainers', trainerRoutes);
app.use('/regions', regionRoutes);
app.use('/cities', cityRoutes);
app.use('/locations', locationRoutes);
app.use('/league', leagueRoutes);
app.use('/pokemon', pokemonRoutes);
app.use('/pokemon-entity', pokemonEntityRoutes);
app.use('/pokemon-species', pokemonSpeciesRoutes);
app.use('/natures', natureRoutes);
app.use('/game_state', gamestateRoutes);
app.use('/api', apiRoutes);
app.use('/randomize', generateRoutes);
app.use('/battle', battleRoutes);
app.use('/messages', messageRoutes);
app.use('/items', itemRoutes);
app.use('/finances', financeRoutes);
app.use('/shops', shopRoutes);
app.use('/terrains', terrainRoutes);
app.use('/meta', metaRoutes);
app.use('/training', trainingRoutes);
app.use('/create-league', createLeagueRoutes);
app.use('/tournaments', tournamentRoutes);
app.use('/history', historyRoutes);
app.use('/badges', badgeRoutes);
app.use('/sim', simRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


//todo: change package.json to esm + tsx?
//todo: split routes + controllers files
