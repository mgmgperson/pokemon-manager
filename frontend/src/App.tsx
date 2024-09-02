import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Import React Query modules
import Trainers from './routes/Trainers';
import Regions from './routes/Regions';
import InactiveTrainers from './routes/InactiveTrainers';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import RegionDetail from './components/regions/RegionDetail';
import Pokedex from './components/pokedex/Pokedex';
import League from './components/league/League';
import PokemonDetail from './components/pokedex/PokemonDetail';
import BattleSimulator from './debug/BattleSimulator';
import TrainerDetail from './components/trainers/TrainerDetail';
import EditTrainer from './components/trainers/EditTrainer';
import FieldRatingEdit from './components/trainers/EditFieldRating';
import MentalRatingEdit from './components/trainers/EditMentalRating';
import FormatRatingEdit from './components/trainers/EditFormatRating';
import TrainerPokemon from './components/trainers/TrainerPokemon';
import TrainerPokemonDetail from './components/trainers/TrainerPokemonDetail';
import AddTrainer from './components/trainers/AddTrainer';
import EditTrainerPokemon from './components/trainers/EditTrainerPokemon';
import AddPokemon from './components/trainers/AddPokemon';
import './App.scss';
import 'bootstrap/dist/css/bootstrap.min.css';

const queryClient = new QueryClient();

const App: React.FC = () => {
    const location = useLocation();
    const showSidebar = true;

    return (
        <QueryClientProvider client={queryClient}>
            <div className="app-wrapper h-100 d-flex flex-column">
                <Navbar />
                <div className="main-content h-100 d-flex">
                  <Sidebar />
                  <div className="content h-100 w-100 d-flex flex-column">
                      <Routes>
                          <Route path="/inactive_trainers" element={<InactiveTrainers />} />
                          <Route path="/trainers" element={<Trainers />} />
                          <Route path="/regions" element={<Regions />} />
                          <Route path="/regions/:id" element={<RegionDetail />} />
                          <Route path="/dex" element={<Pokedex />} />
                          <Route path="/dex/pokemon/:id" element={<PokemonDetail />} />
                          <Route path="/league" element={<League />} />
                          <Route path="/" element={<div><h1>Welcome to the Trainer Management System</h1></div>} />
                          <Route path="/battle_simulator" element={<BattleSimulator />} />
                          <Route path="/trainers/:id" element={<TrainerDetail />} />
                          <Route path="/add_trainer/" element={<AddTrainer />} />
                          <Route path="/edit_trainer/:id" element={<EditTrainer />} />
                          <Route path="/edit_trainer/:id/field_ratings" element={<FieldRatingEdit />} />
                          <Route path="/edit_trainer/:id/mental_ratings" element={<MentalRatingEdit />} />
                          <Route path="/edit_trainer/:id/format_ratings" element={<FormatRatingEdit />} />
                          <Route path="/trainers/:id/pokemon" element={<TrainerPokemon />} />
                          <Route path="/trainers/:id/pokemon/:pokemonId" element={<TrainerPokemonDetail />} />
                          <Route path="/trainers/:id/edit_pokemon/:pokemonId" element={<EditTrainerPokemon />} />
                          <Route path="/trainers/:id/add_pokemon" element={<AddPokemon />} />
                      </Routes>
                  </div>
                </div>
            </div>
        </QueryClientProvider>
    );
};

export default App;
