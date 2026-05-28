import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

/**
 * Dialog shown when an optimistic locking conflict occurs.
 * Allows user to choose how to resolve the conflict.
 */
export default function ConflictDialog({
  open,
  resourceName,
  serverData,
  onReload,
  onOverwrite,
  onClose,
}) {
  if (!open || !serverData) return null;

  const handleReload = () => {
    onReload();
    onClose();
  };

  const handleOverwrite = () => {
    onOverwrite();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Conflict</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Alert severity="warning">
            This {resourceName} has been modified by another user since you started editing.
          </Alert>

          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              You have three options:
            </Typography>
            <Typography variant="body2" component="div">
              <strong>1. Reload:</strong> Discard your changes and reload the latest version
            </Typography>
            <Typography variant="body2" component="div">
              <strong>2. Overwrite:</strong> Save your changes and overwrite theirs
            </Typography>
            <Typography variant="body2" component="div">
              <strong>3. Cancel:</strong> Go back and manually merge your changes
            </Typography>
          </Stack>

          {serverData && (
            <Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Server's Current Version
              </Typography>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body2">
                    {serverData.name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body2">
                    {serverData.category || '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {serverData.description || '—'}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Last modified
                  </Typography>
                  <Typography variant="body2">
                    {new Date(serverData.modifiedAt).toLocaleString('lt')} by {serverData.modifiedBy}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleReload} variant="outlined">
          Reload
        </Button>
        <Button onClick={handleOverwrite} variant="contained" color="warning">
          Overwrite
        </Button>
      </DialogActions>
    </Dialog>
  );
}
