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
                <Route path="/league" element={<League />} />
                <Route path="/regions" element={<RegionList />} />
                <Route path="/regions/:id" element={<RegionDetail />} />
                <Route path="/trainers" element={<TrainerList />} />
                <Route path="/trainers/:id" element={<TrainerDetail />} />
                {/* Add more routes here */}
              </Routes>
            </div>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
