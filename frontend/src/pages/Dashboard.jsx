import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useAuth } from '../auth/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function Dashboard() {
  const { justLoggedIn, clearJustLoggedIn } = useAuth();
  const { showNotification } = useNotification();
  const shownLoginRef = useRef(false);

  useEffect(() => {
    if (justLoggedIn && !shownLoginRef.current) {
      shownLoginRef.current = true;
      showNotification('Login successful!', 'success', 4000);
      clearJustLoggedIn();
    }
  }, [justLoggedIn]); // Only depend on justLoggedIn

  return (
    <Box>
      <Typography variant="h1" gutterBottom>Dashboard</Typography>
      <Typography variant="body1" color="text.secondary">
        Dashboard content placeholder.
      </Typography>
    </Box>
  );
}
