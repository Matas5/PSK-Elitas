import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';

import CreateRiskDialog from '../components/CreateRiskDialog';

export default function Risks() {
  const [createOpen, setCreateOpen] = useState(false);
  const [lastCreated, setLastCreated] = useState(null);

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h1" gutterBottom>Risks</Typography>
          <Typography variant="body2" color="text.secondary">
            Register a risk so it can be evaluated, monitored, and managed.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={() => setCreateOpen(true)}
        >
          Create risk
        </Button>
      </Stack>

      {createOpen && (
        <CreateRiskDialog
          onClose={() => setCreateOpen(false)}
          onCreated={(risk) => setLastCreated(risk)}
        />
      )}

      <Snackbar
        open={Boolean(lastCreated)}
        autoHideDuration={4000}
        onClose={() => setLastCreated(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setLastCreated(null)}>
          Risk &ldquo;{lastCreated?.name}&rdquo; created.
        </Alert>
      </Snackbar>
    </Box>
  );
}
