import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  CircularProgress,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { TrainingProgram } from '../../types/training';

const TrainingCards: React.FC = () => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        // First, get the active trainer ID from game state
        const stateResponse = await fetch('http://localhost:5000/game_state/active-trainer');
        if (!stateResponse.ok) {
          throw new Error('Failed to fetch game state');
        }
        const stateData = await stateResponse.json();
        const trainerId = stateData.data.active_trainer_id;

        // Then fetch the training programs for this trainer
        const programsResponse = await fetch(`http://localhost:5000/training/programs/${trainerId}`);
        if (!programsResponse.ok) {
          throw new Error('Failed to fetch training programs');
        }
        const programsData = await programsResponse.json();
        setPrograms(programsData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  const getFocusStatColor = (focusStat: string) => {
    const colors: Record<string, string> = {
      hp: '#FF5959',
      attack: '#F5AC78',
      defense: '#FAE078',
      'special-attack': '#9DB7F5',
      'special-defense': '#A7DB8D',
      speed: '#FA92B2',
      happiness: '#FFB6C1',
      bond: '#DDA0DD',
      move: '#B8860B',
    };
    return colors[focusStat] || '#777777';
  };

  const formatDuration = (days: number) => {
    return `${days}d`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Training Programs
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/training/add')}
        >
          Create New Program
        </Button>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {programs.map((program) => (
          <Card
            key={program.id}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                boxShadow: 6
              }
            }}
          >
            <CardActionArea
              onClick={() => navigate(`/training/programs/${program.id}`)}
              sx={{ flexGrow: 1 }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {program.name}
                </Typography>
                <Chip
                  label={program.focus_stat.replace('_', ' ')}
                  size="small"
                  sx={{
                    mb: 2,
                    backgroundColor: getFocusStatColor(program.focus_stat),
                    color: 'white'
                  }}
                />
                <Typography variant="body2" color="text.secondary" paragraph>
                  {program.description || 'No description available'}
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Duration: {formatDuration(program.base_duration)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cost: ₽{program.cost}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Fatigue Cost: {program.fatigue_cost}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default TrainingCards;