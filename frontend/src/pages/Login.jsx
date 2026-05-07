import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { useAuth } from '../auth/AuthContext';
import { ROUTES } from '../routes';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname ?? ROUTES.DASHBOARD;

  const handleDemoLogin = () => {
    login({ username: 'demo' });
    navigate(redirectTo, { replace: true });
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
              Login form coming in a later ticket. For now, sign in with the demo
              account to verify navbar behaviour.
            </Typography>
            <Button fullWidth variant="contained" onClick={handleDemoLogin}>
              Sign in as demo
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
