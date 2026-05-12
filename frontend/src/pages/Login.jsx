import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROUTES } from '../routes';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import GoogleIcon from '@mui/icons-material/Google';

export default function Login() {
  const authUrl = import.meta.env.VITE_AUTH_URL;
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

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
          <Stack spacing={2} alignItems="center" textAlign="center">
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
              Sign in with your Google account to access the dashboard.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              startIcon={<GoogleIcon />}
              href={`${authUrl}/auth/google`}
              sx={{
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
              }}
            >
              Sign in with Google
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
