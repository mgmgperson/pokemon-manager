import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { TrainingProgram, TrainingSession } from '../../types/training';
import { Pokemon } from '../../types/pokemon';

interface SessionWithPokemon extends TrainingSession {
  pokemon: Pokemon;
}

const TrainingProgramDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [sessions, setSessions] = useState<SessionWithPokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availablePokemon, setAvailablePokemon] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<number | ''>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch program details
        const programResponse = await fetch(`http://localhost:5000/training/programs/detail/${id}`);
        if (!programResponse.ok) throw new Error('Failed to fetch program details');
        const programData = await programResponse.json();
        setProgram(programData.data);

        // Fetch trainer's Pokemon
        const pokemonResponse = await fetch(`http://localhost:5000/trainers/${programData.data.trainer_id}/pokemon`);
        if (!pokemonResponse.ok) throw new Error('Failed to fetch trainer Pokemon');
        const pokemonData = await pokemonResponse.json();
        setAvailablePokemon(pokemonData.data);

        // Fetch sessions for this program
        const sessionsResponse = await fetch(`http://localhost:5000/training/sessions/program/${id}`);
        if (!sessionsResponse.ok) throw new Error('Failed to fetch training sessions');
        const sessionsData = await sessionsResponse.json();
        
        // For each session, fetch the Pokemon details
        const sessionsWithPokemon = await Promise.all(
          sessionsData.data.map(async (session: TrainingSession) => {
            const pokemonResponse = await fetch(`http://localhost:5000/pokemon/${session.pokemon_id}`);
            if (!pokemonResponse.ok) throw new Error('Failed to fetch Pokemon details');
            const pokemonData = await pokemonResponse.json();
            return {
              ...session,
              pokemon: pokemonData.data
            };
          })
        );

        setSessions(sessionsWithPokemon);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddPokemon = async () => {
    if (!selectedPokemon || !program) return;

    try {
      const response = await fetch('http://localhost:5000/training/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pokemon_id: selectedPokemon,
          program_id: program.id,
          start_time: null,
          end_time: null,
          success: null,
          fatigue: 0,
          notes: null
        })
      });

      if (!response.ok) throw new Error('Failed to add Pokemon to training');

      // Refresh the sessions list
      const sessionsResponse = await fetch(`http://localhost:5000/training/sessions/program/${id}`);
      if (!sessionsResponse.ok) throw new Error('Failed to fetch updated sessions');
      const sessionsData = await sessionsResponse.json();

      // Update sessions with Pokemon details
      const updatedSessions = await Promise.all(
        sessionsData.data.map(async (session: TrainingSession) => {
          const pokemonResponse = await fetch(`http://localhost:5000/pokemon/${session.pokemon_id}`);
          if (!pokemonResponse.ok) throw new Error('Failed to fetch Pokemon details');
          const pokemonData = await pokemonResponse.json();
          return {
            ...session,
            pokemon: pokemonData.data
          };
        })
      );

      setSessions(updatedSessions);
      setSelectedPokemon('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add Pokemon');
    }
  };

  const handleStartTraining = async (sessionId: number) => {
    try {
      // First get the current game date
      const gameStateResponse = await fetch('http://localhost:5000/game_state/home');
      if (!gameStateResponse.ok) throw new Error('Failed to fetch game state');
      const gameStateData = await gameStateResponse.json();
      const currentGameDate = `${gameStateData.data.current_date} ${gameStateData.data.current_time}`;

      // Update the training session with the game's current date
      const response = await fetch(`http://localhost:5000/training/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_time: currentGameDate,
          success: null,
          fatigue: 0,
          notes: null
        })
      });

      if (!response.ok) throw new Error('Failed to start training');

      // Refresh sessions
      const sessionsResponse = await fetch(`http://localhost:5000/training/sessions/program/${id}`);
      if (!sessionsResponse.ok) throw new Error('Failed to fetch updated sessions');
      const sessionsData = await sessionsResponse.json();

      const updatedSessions = await Promise.all(
        sessionsData.data.map(async (session: TrainingSession) => {
          const pokemonResponse = await fetch(`http://localhost:5000/pokemon/${session.pokemon_id}`);
          if (!pokemonResponse.ok) throw new Error('Failed to fetch Pokemon details');
          const pokemonData = await pokemonResponse.json();
          return {
            ...session,
            pokemon: pokemonData.data
          };
        })
      );

      setSessions(updatedSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start training');
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/training/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete training session');

      // Remove the session from the list
      setSessions(prev => prev.filter(session => session.id !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    }
  };

  const renderStatBars = (pokemon: Pokemon) => {
    const stats: Record<string, number> = {
      hp: pokemon.hp,
      attack: pokemon.attack,
      defense: pokemon.defense,
      'special-attack': pokemon.special_attack,
      'special-defense': pokemon.special_defense,
      speed: pokemon.speed,
    };

    return Object.entries(stats).map(([stat, value]) => {
      const percentage = (value / 500) * 100;
      const hue = (value / 500) * 180;
      const color = `hsl(${hue}, 100%, 50%)`;
      const displayName = stat.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');

      return (
        <div key={stat} className="stat-bar-container mb-2">
          <div className="flex items-center gap-2">
            <span className="stat-label w-24 text-sm text-gray-400">{displayName}</span>
            <div className="stat-bar flex-1 bg-gray-700 rounded" style={{ height: '8px' }}>
              <div
                className="stat-bar-fill rounded"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color,
                  height: '100%',
                }}
              />
            </div>
            <span className="stat-value w-12 text-sm text-gray-400 text-right">{value}</span>
          </div>
        </div>
      );
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !program) {
    return (
      <Box p={3}>
        <Typography color="error">{error || 'Program not found'}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h4" gutterBottom>
          {program.name}
        </Typography>
        <Chip 
          label={program.focus_stat.replace('_', ' ')}
          sx={{ mb: 2 }}
        />
        <Typography variant="body1" paragraph>
          {program.description || 'No description available'}
        </Typography>
        <Box display="flex" gap={2}>
          <Typography variant="body2" color="text.secondary">
            Duration: {program.base_duration} days
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fatigue Cost: {program.fatigue_cost}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cost: ₽{program.cost}
          </Typography>
        </Box>
      </Paper>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Training Sessions
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Add Pokemon</InputLabel>
            <Select
              value={selectedPokemon}
              label="Add Pokemon"
              onChange={(e) => setSelectedPokemon(e.target.value as number)}
            >
              {availablePokemon.map((pokemon) => (
                <MenuItem key={pokemon.id} value={pokemon.id}>
                  {pokemon.nickname}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleAddPokemon}
            disabled={!selectedPokemon}
          >
            Add to Training
          </Button>
        </Box>
      </Box>

      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={3}>
        {sessions.map((session) => (
          <Card 
            key={session.id} 
            sx={{ bgcolor: 'background.paper', position: 'relative' }}
          >
            {(!session.end_time && session.success === null) && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSession(session.id);
                }}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            )}
            <CardContent
              onClick={() => navigate(`/trainers/${program?.trainer_id}/pokemon/${session.pokemon_id}`)}
              sx={{ cursor: 'pointer' }}
            >
              <Typography variant="h6" gutterBottom>
                {session.pokemon.nickname}
              </Typography>
              
              <Box my={2}>
                {renderStatBars(session.pokemon)}
              </Box>

              <Box mt={3}>
                {session.start_time ? (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Started: {formatDate(session.start_time)}
                    </Typography>
                    {session.end_time && (
                      <Typography variant="body2" color="text.secondary">
                        Ended: {formatDate(session.end_time)}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Status: {session.success === null ? 'In Progress' : (session.success ? 'Successful' : 'Failed')}
                    </Typography>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartTraining(session.id);
                    }}
                  >
                    Start Training
                  </Button>
                )}
                <Typography variant="body2" color="text.secondary">
                  Fatigue: {session.fatigue}
                </Typography>
                {session.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Notes: {session.notes}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default TrainingProgramDetail;