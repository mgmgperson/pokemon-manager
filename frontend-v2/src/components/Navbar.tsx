import React from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Box, TextField, InputAdornment } from '@mui/material';
import { Menu as MenuIcon, Save as SaveIcon, CalendarToday as CalendarIcon, Search as SearchIcon } from '@mui/icons-material';

const Navbar: React.FC = () => {
  return (
    <AppBar position="fixed" className="bg-blue-600">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ mr: 2 }}>
          Pokemon Manager
        </Typography>
        <Box sx={{ flexGrow: 1, mr: 2 }}>
          <TextField
            size="small"
            placeholder="Search..."
            variant="outlined"
            fullWidth
            slotProps={{
              htmlInput: {
                className: 'bg-white rounded',
              },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon className="text-white" />
                  </InputAdornment>
                ),
              }
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<SaveIcon />}
            className="bg-green-500 hover:bg-green-600"
          >
            Save
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<CalendarIcon />}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Calendar
          </Button>
          <Button
            variant="contained"
            color="primary"
            className="bg-blue-500 hover:bg-blue-600"
          >
            Next
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 