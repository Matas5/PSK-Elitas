import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useAuth } from '../auth/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  return (
    <Box>
      <Typography variant="h1" gutterBottom>Profile</Typography>
      <Typography variant="body1" color="text.secondary">
        Signed in as <strong>{user?.username}</strong>.
      </Typography>
    </Box>
  );
}
