import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

const MetaNavbar: React.FC = () => {
  return (
    <AppBar position="fixed">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link 
            to="/" 
            style={{ 
              color: 'inherit', 
              textDecoration: 'none'
            }}
          >
            Pokemon Manager
          </Link>
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default MetaNavbar;
