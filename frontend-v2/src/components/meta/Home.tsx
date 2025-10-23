import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import { PlayArrow as PlayIcon, Add as AddIcon } from '@mui/icons-material';

interface SaveSlot {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  lastPlayedAt: string | null;
  path: string;
}

const MetaHome: React.FC = () => {
  const navigate = useNavigate();
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSaves = async () => {
      try {
        const response = await fetch('http://localhost:5000/meta/saves');
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

    fetchSaves();
  }, []);

  const handlePlay = async (save: SaveSlot) => {
    try {
        await fetch('http://localhost:5000/meta/activate-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: save.code, path: save.path })
        });
        navigate('/home');          // load main UI
    } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load save');
    }
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
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Last Played</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {saveSlots.map((save) => (
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MetaHome;
