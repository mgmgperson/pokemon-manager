import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import League from './components/league/League';
import RegionList from './components/regions/RegionList';
import RegionDetail from './components/regions/RegionDetail';
import TrainerList from './components/trainers/TrainerList';
import TrainerDetail from './components/trainers/TrainerDetail';
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

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="min-h-screen bg-[#121212]">
          <Navbar />
          <div className="main-content flex relative">
            <Sidebar />
            <div className="content flex-1 mt-[60px] ml-[185px] min-h-[calc(100vh-60px)] bg-[#121212]">
              <Routes>
                <Route path="/" element={<div className="text-white">Welcome to Pokemon Manager!</div>} />
                <Route path="/squad" element={<Squad />} />
                <Route path="/league" element={<League />} />
                <Route path="/regions" element={<RegionList />} />
                <Route path="/regions/:id" element={<RegionDetail />} />
                <Route path="/trainers" element={<TrainerList />} />
                <Route path="/trainers/:id" element={<TrainerDetail />} />
                <Route path="/trainers/:id/pokemon" element={<TrainerPokemon />} />
                <Route path="/trainers/:id/pokemon/:pokemonId" element={<TrainerPokemonDetail />} />
                <Route path="/trainers/:id/add_pokemon" element={<AddTrainerPokemon />} />
                <Route path="/trainers/:id/edit_pokemon/:pokemonId" element={<EditTrainerPokemon />} />
                <Route path="/trainers/:id/ratings" element={<TrainerDetail />} />
                <Route path="/add_trainer" element={<AddTrainer />} />
                <Route path="/edit_trainer/:id" element={<EditTrainer />} />
                <Route path="/edit_trainer/:id/field_ratings" element={<EditFieldRating />} />
                <Route path="/edit_trainer/:id/mental_ratings" element={<EditMentalRating />} />
                <Route path="/edit_trainer/:id/format_ratings" element={<EditFormatRating />} />
                <Route path="/cities/:id" element={<CityDetail />} />
                <Route path="/edit_city/:id" element={<EditCity />} />
                <Route path="/add_city" element={<AddCity />} />
                <Route path="/inbox" element={<MessageBox />} />
                <Route path="/items" element={<Items />} />
                <Route path="/finances" element={<FinanceList />} />
                <Route path="/shops/:id" element={<ShopDetail />} />
                <Route path="/shops/:id/sell" element={<ShopSell />} />
                <Route path="/locations/:id" element={<LocationDetail />} />
                <Route path="/edit_location/:id" element={<EditLocation />} />
                <Route path="/terrain-manager" element={<EditTerrainLocation />} />
                <Route path="/add_location" element={<AddLocation />} />
                <Route path="/edit_shop/:id" element={<EditShop />} />
                <Route path="/add_shop" element={<AddShop />} />
              </Routes>
            </div>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
