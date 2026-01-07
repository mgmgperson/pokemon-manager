import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';

interface SaveSlot {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  lastPlayedAt: string | null;
  path: string;
}

// Rename Dialog
interface RenameDialogProps {
  open: boolean;
  save: SaveSlot | null;
  onClose: () => void;
  onConfirm: (newName: string) => Promise<void>;
}

export const RenameDialog: React.FC<RenameDialogProps> = ({
  open,
  save,
  onClose,
  onConfirm,
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (save) {
      setName(save.name);
      setError(null);
    }
  }, [save]);

  const handleConfirm = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename save');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rename Save</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Save Name"
          type="text"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyPress={handleKeyPress}
          error={!!error}
          helperText={error}
          disabled={loading}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={loading || !name.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Rename'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Clone Confirmation Dialog
interface CloneDialogProps {
  open: boolean;
  save: SaveSlot | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const CloneDialog: React.FC<CloneDialogProps> = ({
  open,
  save,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [open]);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clone save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Clone Save</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to clone "{save?.name}"?
        </DialogContentText>
        <DialogContentText sx={{ mt: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
          This will create a copy named "{save?.name} Clone" with all current data.
        </DialogContentText>
        {error && (
          <DialogContentText sx={{ mt: 1, color: 'error.main' }}>
            {error}
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Clone'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Delete Confirmation Dialog
interface DeleteDialogProps {
  open: boolean;
  save: SaveSlot | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  save,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [open]);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Save</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete "{save?.name}"?
        </DialogContentText>
        <DialogContentText sx={{ mt: 1, color: 'error.main', fontWeight: 500 }}>
          This action cannot be undone. The save file will be permanently deleted.
        </DialogContentText>
        {error && (
          <DialogContentText sx={{ mt: 1, color: 'error.main' }}>
            {error}
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
