import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Alert,
  CircularProgress,
} from '@mui/material';

const CreateLeague: React.FC = () => {
  const [leagueName, setLeagueName] = useState('');
  const [setupType, setSetupType] = useState('default');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('http://localhost:5000/create-league', {
        leagueName,
        setupType,
      });

      if (response.data && response.data.message) {
        const { saveCode, defaultDataPopulated } = response.data.data;
        const defaultMessage = defaultDataPopulated ? ' with default regions, cities, and stadiums' : '';
        setSuccess(
          `League "${leagueName}" created successfully${defaultMessage}! Save code: ${saveCode}`
        );
        console.log('League created:', response.data.data);
        
        // Reset form
        setLeagueName('');
        setSetupType('default');
        setFile(null);
      }
    } catch (err: any) {
      console.error('Error creating league:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to create league. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={4} maxWidth={600} mx="auto">
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create New League
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="League Name"
            value={leagueName}
            onChange={(e) => setLeagueName(e.target.value)}
            margin="normal"
            required
            disabled={isLoading}
          />

          <FormControl component="fieldset" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Setup Type
            </Typography>
            <RadioGroup
              value={setupType}
              onChange={(e) => setSetupType(e.target.value)}
            >
              <FormControlLabel
                value="default"
                control={<Radio disabled={isLoading} />}
                label="Use Default Settings"
              />
              <FormControlLabel
                value="import"
                control={<Radio disabled={isLoading} />}
                label="Import from File"
              />
            </RadioGroup>
          </FormControl>

          {setupType === 'import' && (
            <Box mt={2} mb={2}>
              <input
                type="file"
                onChange={(e) => {
                  const fileList = (e.target as HTMLInputElement).files;
                  setFile(fileList ? fileList[0] : null);
                }}
                style={{ marginBottom: '16px', width: '100%' }}
                disabled={isLoading}
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Import feature coming soon
              </Typography>
            </Box>
          )}

          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            sx={{ mt: 2 }}
            disabled={isLoading || !leagueName.trim()}
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Creating League...
              </>
            ) : (
              'Create League'
            )}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateLeague;