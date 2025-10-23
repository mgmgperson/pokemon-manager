import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper
} from '@mui/material';
import { FocusStat } from '../../../types/training';

interface FormState {
  name: string;
  focus_stat: FocusStat;
  base_duration: number;
  fatigue_cost: number;
  cost: number;
  description: string;
  trainer_id: number | null;
}

const AddTrainingProgram: React.FC = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<FormState>({
    name: '',
    focus_stat: 'hp',
    base_duration: 1,
    fatigue_cost: 1,
    cost: 1000,
    description: '',
    trainer_id: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch active trainer ID when component mounts
    const fetchActiveTrainer = async () => {
      try {
        const response = await fetch('http://localhost:5000/game_state/active-trainer');
        if (!response.ok) {
          throw new Error('Failed to fetch active trainer');
        }
        const data = await response.json();
        setFormState(prev => ({
          ...prev,
          trainer_id: data.data.active_trainer_id
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch active trainer');
      }
    };

    fetchActiveTrainer();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: any) => {
    setFormState(prev => ({
      ...prev,
      focus_stat: e.target.value as FocusStat
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/training/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      });

      if (!response.ok) {
        throw new Error('Failed to create training program');
      }

      navigate('/training');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create training program');
    } finally {
      setLoading(false);
    }
  };

  const focusStats: FocusStat[] = [
    'hp', 'attack', 'defense', 'special_attack', 
    'special_defense', 'speed', 'happiness', 'bond', 'move'
  ];

  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Create New Training Program
          </Typography>

          {error && (
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
          )}

          <form onSubmit={handleSubmit}>
            <Box display="grid" gap={3}>
              <TextField
                name="name"
                label="Program Name"
                value={formState.name}
                onChange={handleInputChange}
                required
                fullWidth
              />

              <FormControl fullWidth required>
                <InputLabel>Focus Stat</InputLabel>
                <Select
                  name="focus_stat"
                  value={formState.focus_stat}
                  onChange={handleSelectChange}
                  label="Focus Stat"
                >
                  {focusStats.map(stat => (
                    <MenuItem key={stat} value={stat}>
                      {stat.split('_').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                name="base_duration"
                label="Base Duration (days)"
                type="number"
                value={formState.base_duration}
                onChange={handleInputChange}
                required
                fullWidth
                inputProps={{ min: 1 }}
              />

              <TextField
                name="fatigue_cost"
                label="Fatigue Cost"
                type="number"
                value={formState.fatigue_cost}
                onChange={handleInputChange}
                required
                fullWidth
                inputProps={{ min: 1 }}
              />

              <TextField
                name="cost"
                label="Cost (₽)"
                type="number"
                value={formState.cost}
                onChange={handleInputChange}
                required
                fullWidth
                inputProps={{ min: 0 }}
              />

              <TextField
                name="description"
                label="Description"
                value={formState.description}
                onChange={handleInputChange}
                multiline
                rows={4}
                fullWidth
              />

              <Box mt={2}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || !formState.trainer_id}
                  fullWidth
                >
                  {loading ? 'Creating...' : 'Create Program'}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default AddTrainingProgram;
