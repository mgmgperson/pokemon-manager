import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="app-wrapper h-screen flex flex-col">
          <Navbar />
          <div className="main-content flex-1 flex relative">
            <Sidebar />
            <div className="content flex-1 ml-[200px] mt-[80px] p-6">
              <Routes>
                <Route path="/" element={<div className="text-white">Welcome to Pokemon Manager!</div>} />
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
