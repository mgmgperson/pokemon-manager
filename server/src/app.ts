import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import trainerRoutes from './routes/trainers';
import regionRoutes from './routes/regions';
import cityRoutes from './routes/cities';
import leagueRoutes from './routes/league';
import pokemonRoutes from './routes/pokemon';
import apiRoutes from './routes/api';
import generateRoutes from './routes/generate';
import battleRoutes from './routes/battle';

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/trainers', trainerRoutes);
app.use('/regions', regionRoutes);
app.use('/cities', cityRoutes);
app.use('/league', leagueRoutes);
app.use('/pokemon', pokemonRoutes);
app.use('/api', apiRoutes);
app.use('/randomize', generateRoutes);
app.use('/battle', battleRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
