import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import MetaNavbar from './components/meta/MetaNavbar';
import Sidebar from './components/Sidebar';
import MetaHome from './components/meta/Home';
import CreateLeague from './components/meta/CreateLeague';
import League from './components/league/League';
import RegionList from './components/regions/RegionList';
import RegionDetail from './components/regions/RegionDetail';
import TrainerList from './components/trainers/TrainerList';
import TrainerDetail from './components/trainers/TrainerDetail';
import TournamentList from './components/tournaments/TournamentList';
import TournamentDetail from './components/tournaments/TournamentDetail';
import PokedexList from './components/pokedex/PokedexList';
import AddTrainer from './components/trainers/edit/AddTrainer';
import EditTrainer from './components/trainers/edit/EditTrainer';
import EditFieldRating from './components/trainers/edit/EditFieldRating';
import EditMentalRating from './components/trainers/edit/EditMentalRating';
import EditFormatRating from './components/trainers/edit/EditFormatRating';
import TrainerPokemon from './components/trainers/pokemon/TrainerPokemon';
import TrainerPokemonDetail from './components/trainers/pokemon/TrainerPokemonDetail';
import AddTrainerPokemon from './components/trainers/pokemon/AddTrainerPokemon';
import EditTrainerPokemon from './components/trainers/pokemon/EditTrainerPokemon';
import Squad from './components/squad/Squad';
import CityDetail from './components/cities/CityDetail';
import EditCity from './components/cities/edit/EditCity';
import MessageBox from './components/messages/MessageBox';
import Items from './components/items/Items';
import FinanceList from './components/finances/FinanceList';
import ShopDetail from './components/shops/ShopDetail';
import ShopSell from './components/shops/ShopSell';
import LocationDetail from './components/locations/LocationDetail';
import EditLocation from './components/locations/edit/EditLocation';
import EditTerrainLocation from './components/locations/edit/EditTerrainLocation';
import AddCity from './components/cities/edit/AddCity';
import AddLocation from './components/locations/edit/AddLocation';
import EditShop from './components/shops/edit/EditShop';
import AddShop from './components/shops/edit/AddShop';
import TrainingCards from './components/training/TrainingCards';
import TrainingProgram from './components/training/TrainingProgram';
import AddTrainingProgram from './components/training/edit/AddTrainingProgram';
import Home from './components/home/Home';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

// Layout component for game routes
const GameLayout: React.FC = () => (
  <div className="min-h-screen bg-[#121212]">
    <Navbar />
    <div className="main-content flex relative">
      <Sidebar />
      <div className="content flex-1 mt-[60px] ml-[185px] min-h-[calc(100vh-60px)] bg-[#121212]">
        <Outlet />
      </div>
    </div>
  </div>
);

// Layout component for meta routes
const MetaLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#121212]">
    <MetaNavbar />
    <div className="content flex-1 mt-[60px] min-h-[calc(100vh-60px)] bg-[#121212]">
      {children}
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Meta routes */}
          <Route path="/" element={<MetaLayout><MetaHome /></MetaLayout>} />
          <Route path="/create_league" element={<MetaLayout><CreateLeague /></MetaLayout>} />

          {/* Game routes - all other routes */}
          <Route element={<GameLayout />}>
            <Route path="home" element={<Home />} />
            <Route path="squad" element={<Squad />} />
            <Route path="league" element={<League />} />
            <Route path="regions" element={<RegionList />} />
            <Route path="regions/:id" element={<RegionDetail />} />
            <Route path="tournaments" element={<TournamentList />} />
            <Route path="tournaments/:id" element={<TournamentDetail />} />
            <Route path="pokedex" element={<PokedexList />} />
            <Route path="trainers" element={<TrainerList />} />
            <Route path="trainers/:id" element={<TrainerDetail />} />
            <Route path="trainers/:id/pokemon" element={<TrainerPokemon />} />
            <Route path="trainers/:id/pokemon/:pokemonId" element={<TrainerPokemonDetail />} />
            <Route path="trainers/:id/add_pokemon" element={<AddTrainerPokemon />} />
            <Route path="trainers/:id/edit_pokemon/:pokemonId" element={<EditTrainerPokemon />} />
            <Route path="trainers/:id/ratings" element={<TrainerDetail />} />
            <Route path="add_trainer" element={<AddTrainer />} />
            <Route path="edit_trainer/:id" element={<EditTrainer />} />
            <Route path="edit_trainer/:id/field_ratings" element={<EditFieldRating />} />
            <Route path="edit_trainer/:id/mental_ratings" element={<EditMentalRating />} />
            <Route path="edit_trainer/:id/format_ratings" element={<EditFormatRating />} />
            <Route path="cities/:id" element={<CityDetail />} />
            <Route path="edit_city/:id" element={<EditCity />} />
            <Route path="add_city" element={<AddCity />} />
            <Route path="inbox" element={<MessageBox />} />
            <Route path="items" element={<Items />} />
            <Route path="finances" element={<FinanceList />} />
            <Route path="shops/:id" element={<ShopDetail />} />
            <Route path="shops/:id/sell" element={<ShopSell />} />
            <Route path="locations/:id" element={<LocationDetail />} />
            <Route path="edit_location/:id" element={<EditLocation />} />
            <Route path="terrain-manager" element={<EditTerrainLocation />} />
            <Route path="add_location" element={<AddLocation />} />
            <Route path="edit_shop/:id" element={<EditShop />} />
            <Route path="add_shop" element={<AddShop />} />
            <Route path="training" element={<TrainingCards />} />
            <Route path="training/programs/:id" element={<TrainingProgram />} />
            <Route path="training/add" element={<AddTrainingProgram />} />
            {/* Default route redirects to squad */}
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
