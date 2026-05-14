import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { useAuth } from '../auth/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h1" gutterBottom>Profile</Typography>
      
      <Card sx={{ mt: 3, maxWidth: 500 }}>
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Account Status
              </Typography>
              <Typography variant="h6">
                ✓ Signed in as <strong>{user?.username || user?.displayName || 'User'}</strong>
              </Typography>
            </Box>

            <Divider />

            {user?.displayName && (
              <Stack spacing={1} direction="row" alignItems="flex-start">
                <PersonOutlineOutlinedIcon sx={{ mt: 0.5, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Full Name
                  </Typography>
                  <Typography variant="body1">{user.displayName}</Typography>
                </Box>
              </Stack>
            )}

            {user?.email && (
              <Stack spacing={1} direction="row" alignItems="flex-start">
                <EmailOutlinedIcon sx={{ mt: 0.5, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Email
                  </Typography>
                  <Typography variant="body1">{user.email}</Typography>
                </Box>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
