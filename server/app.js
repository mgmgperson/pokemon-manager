const express = require('express');
const cors = require('cors');
const trainerRoutes = require('./routes/trainers');
const regionRoutes = require('./routes/regions');
const leagueRoutes = require('./routes/league');
const pokemonRoutes = require('./routes/pokemon');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/trainers', trainerRoutes);
app.use('/regions', regionRoutes);
app.use('/league', leagueRoutes);
app.use('/pokemon', pokemonRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
