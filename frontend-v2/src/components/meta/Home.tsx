import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TableSortLabel,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { RenameDialog, CloneDialog, DeleteDialog } from './SaveManagementDialogs';

interface SaveSlot {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  lastPlayedAt: string | null;
  path: string;
}

type Order = 'asc' | 'desc';
type SaveSlotKey = keyof SaveSlot;

const API_BASE = 'http://localhost:5000';

const MetaHome: React.FC = () => {
  const navigate = useNavigate();
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting state
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<SaveSlotKey>('createdAt');

  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSave, setSelectedSave] = useState<SaveSlot | null>(null);

  // Dialog states
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchSaves = async () => {
    try {
      const response = await fetch(`${API_BASE}/meta/saves`);
      if (!response.ok) {
        throw new Error('Failed to fetch save slots');
      }
      const data = await response.json();
      setSaveSlots(data.saves);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaves();
  }, []);

  const handleRequestSort = (property: SaveSlotKey) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedSaveSlots = useMemo(() => {
    if (!saveSlots) return [];
    
    return [...saveSlots].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      
      // Handle null values
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return order === 'asc' ? 1 : -1;
      if (bValue === null) return order === 'asc' ? -1 : 1;
      
      // Compare values
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
      }
    });
  }, [saveSlots, order, orderBy]);

  const handlePlay = async (save: SaveSlot) => {
    try {
      await fetch(`${API_BASE}/meta/activate-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: save.code, path: save.path }),
      });
      navigate('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load save');
    }
  };

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, save: SaveSlot) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedSave(save);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Action handlers
  const handleRenameClick = () => {
    handleMenuClose();
    setRenameDialogOpen(true);
  };

  const handleExportClick = async () => {
    handleMenuClose();
    if (!selectedSave) return;

    try {
      // Create a hidden link and trigger download
      const link = document.createElement('a');
      link.href = `${API_BASE}/meta/saves/${selectedSave.id}/export`;
      link.download = `${selectedSave.name}.sqlite`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export save');
    }
  };

  const handleCloneClick = () => {
    handleMenuClose();
    setCloneDialogOpen(true);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  // API action handlers for dialogs
  const handleRenameConfirm = async (newName: string) => {
    if (!selectedSave) return;

    const response = await fetch(`${API_BASE}/meta/saves/${selectedSave.id}/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to rename save');
    }

    // Refresh the list
    await fetchSaves();
  };

  const handleCloneConfirm = async () => {
    if (!selectedSave) return;

    const response = await fetch(`${API_BASE}/meta/saves/${selectedSave.id}/clone`, {
      method: 'POST',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to clone save');
    }

    // Refresh the list
    await fetchSaves();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSave) return;

    const response = await fetch(`${API_BASE}/meta/saves/${selectedSave.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete save');
    }

    // Refresh the list
    await fetchSaves();
  };

  if (loading) {
    return (
      <Box p={4}>
        <Typography>Loading save slots...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          component={Link}
          to="/create_league"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          Create New League
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="!text-white">
                <TableSortLabel
                  active={orderBy === 'code'}
                  direction={orderBy === 'code' ? order : 'asc'}
                  onClick={() => handleRequestSort('code')}
                  className="!text-white"
                >
                  Code
                </TableSortLabel>
              </TableCell>
              <TableCell className="!text-white">
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleRequestSort('name')}
                  className="!text-white"
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell className="!text-white">
                <TableSortLabel
                  active={orderBy === 'createdAt'}
                  direction={orderBy === 'createdAt' ? order : 'asc'}
                  onClick={() => handleRequestSort('createdAt')}
                  className="!text-white"
                >
                  Created
                </TableSortLabel>
              </TableCell>
              <TableCell className="!text-white">
                <TableSortLabel
                  active={orderBy === 'lastPlayedAt'}
                  direction={orderBy === 'lastPlayedAt' ? order : 'asc'}
                  onClick={() => handleRequestSort('lastPlayedAt')}
                  className="!text-white"
                >
                  Last Played
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
              <TableCell width={48}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedSaveSlots.map((save) => (
              <TableRow key={save.id}>
                <TableCell>{save.code}</TableCell>
                <TableCell>{save.name}</TableCell>
                <TableCell>{new Date(save.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  {save.lastPlayedAt ? new Date(save.lastPlayedAt).toLocaleString() : 'Never'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<PlayIcon />}
                    onClick={() => handlePlay(save)}
                  >
                    Play
                  </Button>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, save)}
                    aria-label="more options"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleRenameClick}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExportClick}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCloneClick}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Clone</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <RenameDialog
        open={renameDialogOpen}
        save={selectedSave}
        onClose={() => setRenameDialogOpen(false)}
        onConfirm={handleRenameConfirm}
      />
      <CloneDialog
        open={cloneDialogOpen}
        save={selectedSave}
        onClose={() => setCloneDialogOpen(false)}
        onConfirm={handleCloneConfirm}
      />
      <DeleteDialog
        open={deleteDialogOpen}
        save={selectedSave}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
};

export default MetaHome;
