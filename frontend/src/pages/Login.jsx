import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '../auth/AuthContext';
import GoogleLogin from './GoogleLogin';
import LocalLogin from './LocalLogin';

export default function Login() {
  const { provider, loading } = useAuth();

  if (loading || !provider) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return provider === 'local' ? <LocalLogin /> : <GoogleLogin />;
}
