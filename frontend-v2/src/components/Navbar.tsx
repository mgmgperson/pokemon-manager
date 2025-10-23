import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, IconButton, Box, TextField, InputAdornment } from '@mui/material';
import { Menu as MenuIcon, Save as SaveIcon, CalendarToday as CalendarIcon, Search as SearchIcon } from '@mui/icons-material';

const Navbar: React.FC = () => {
  return (
    <AppBar position="fixed">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography variant="h6" component="div" sx={{ mr: 2 }}>
            Pokemon Manager
          </Typography>
        </Link>
        <Box sx={{ flexGrow: 1, mr: 2 }}>
          <TextField
            size="small"
            placeholder="Search..."
            variant="outlined"
            fullWidth
            slotProps={{
              htmlInput: {
                className: 'rounded',
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
          >
            Save
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<CalendarIcon />}
          >
            Calendar
          </Button>
          <Button
            variant="contained"
            color="primary"
          >
            Next
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;