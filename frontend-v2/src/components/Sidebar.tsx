import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton } from '@mui/material';
import { 
  Home as HomeIcon,
  Inbox as InboxIcon,
  Group as GroupIcon,
  FitnessCenter as TrainingIcon,
  AccountBalance as FinanceIcon,
  Person as PersonIcon,
  AutoStories as PokedexIcon,
  Map as MapIcon,
  EmojiEvents as LeagueIcon,
  SportsEsports as TournamentIcon,
  History as HistoryIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const menuItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/home' },
  { text: 'Inbox', icon: <InboxIcon />, path: '/inbox' },
  { text: 'Squad', icon: <GroupIcon />, path: '/squad' },
  { text: 'Training', icon: <TrainingIcon />, path: '/training' },
  { text: 'Item Bag', icon: <InventoryIcon />, path: '/items' },
  { text: 'Finances', icon: <FinanceIcon />, path: '/finances' },
  { text: 'PWTR', icon: <PersonIcon />, path: '/trainers' },
  { text: 'Pokedex', icon: <PokedexIcon />, path: '/dex' },
  { text: 'Regions', icon: <MapIcon />, path: '/regions' },
  { text: 'League', icon: <LeagueIcon />, path: '/league' },
  { text: 'Tournaments', icon: <TournamentIcon />, path: '/tournaments' },
  { text: 'History', icon: <HistoryIcon />, path: '/history' },
];

const Sidebar: React.FC = () => {
  return (
    <Drawer
      variant="permanent"
      classes={{
        paper: 'bg-gray-800 text-white',
      }}
      sx={{
        '& .MuiDrawer-paper': {
          marginTop: '56px',
          zIndex: 1,
        }
      }}
    >
      <List className="mt-[56px]">
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              className="hover:bg-gray-700"
            >
              <ListItemIcon className="text-white">
                {item.icon}
              </ListItemIcon>
              <ListItemText className="text-white" primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar; 