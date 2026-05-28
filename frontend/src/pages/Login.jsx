import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

import { useAuth } from '../auth/AuthContext';
import { ROUTES } from '../routes';
import { localLogin } from '../api/authApi';

function GoogleColorIcon({ size = 20 }) {
  return (
    <Box
      component="svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      sx={{ width: size, height: size, display: 'block' }}
      aria-hidden="true"
    >
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </Box>
  );
}

function LoginShell({ children }) {
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
        <CardContent>{children}</CardContent>
      </Card>
    </Box>
  );
}

function CardHeader({ subtitle }) {
  return (
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
        {subtitle}
      </Typography>
    </Stack>
  );
}

function LocalCard() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      navigate(ROUTES.RISKS, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2} alignItems="stretch">
      <CardHeader subtitle={<>Sign in with your <Box component="strong" sx={{ color: 'text.primary' }}>LOCAL</Box> account.</>} />
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
        <Link
          component="button"
          type="button"
          onClick={() => navigate(ROUTES.REGISTER)}
        >
          Register account
        </Link>
      </Typography>
    </Stack>
  );
}

function GoogleCard() {
  const authUrl = import.meta.env.VITE_AUTH_URL;
  return (
    <Stack spacing={2} alignItems="center" textAlign="center">
      <CardHeader subtitle="Sign in with your Google account to access Risk Monitor." />
      <Button
        fullWidth
        variant="contained"
        startIcon={<GoogleColorIcon size={18} />}
        href={`${authUrl}/auth/google`}
        sx={{ textTransform: 'none', fontSize: '1rem', fontWeight: 500 }}
      >
        Sign in with Google
      </Button>
    </Stack>
  );
}

export default function Login() {
  const { loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showGoogle, setShowGoogle] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(ROUTES.RISKS, { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  return (
    <LoginShell>
      <Stack spacing={2}>
        {showGoogle ? <GoogleCard /> : <LocalCard />}
        {showGoogle ? (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Or sign in with{' '}
            <Link component="button" type="button" onClick={() => setShowGoogle(false)}>
              local account
            </Link>
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Or sign in with
            </Typography>
            <IconButton
              size="small"
              onClick={() => setShowGoogle(true)}
              aria-label="Sign in with Google"
            >
              <GoogleColorIcon size={20} />
            </IconButton>
          </Box>
        )}
      </Stack>
    </LoginShell>
  );
}
