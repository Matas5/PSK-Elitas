import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROUTES } from '../routes';
import { localLogin } from '../api/authApi';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

export default function LocalLogin() {
  const { isAuthenticated, loading, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const resp = await localLogin({ username: username.trim(), password });
      login({
        provider: 'local',
        userId: resp.userId,
        username: resp.username,
        displayName: resp.username,
      });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 380 }}>
        <CardContent>
          <Stack
            component="form"
            onSubmit={handleSubmit}
            spacing={2}
            alignItems="stretch"
          >
            <Stack spacing={1} alignItems="center" textAlign="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldOutlinedIcon />
              </Box>
              <Typography variant="h2">Risk Monitor</Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in with your local account.
              </Typography>
            </Stack>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ textTransform: 'none', fontSize: '1rem', fontWeight: 500 }}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No account?{' '}
              <Link
                component="button"
                type="button"
                onClick={() => navigate(ROUTES.REGISTER)}
              >
                Create one
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
