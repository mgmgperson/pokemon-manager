import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import trainerRoutes from './routes/trainers';
import regionRoutes from './routes/regions';
import cityRoutes from './routes/cities';
import locationRoutes from './routes/locations';
import leagueRoutes from './routes/league';
import pokemonRoutes from './routes/pokemon';
import pokemonEntityRoutes from './routes/pokemonentity';
import pokemonSpeciesRoutes from './routes/pokemon-species';
import natureRoutes from './routes/nature';
import gamestateRoutes from './routes/gamestate';
import apiRoutes from './routes/api';
import generateRoutes from './routes/generate';
import battleRoutes from './routes/battle';
import messageRoutes from './routes/messages';
import itemRoutes from './routes/items';
import financeRoutes from './routes/finances';
import shopRoutes from './routes/shops';
import terrainRoutes from './routes/terrains';

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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
