import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { useAuth } from '../auth/AuthContext';

function InfoRow({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
      <Stack spacing={0} sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1">{value}</Typography>
      </Stack>
    </Stack>
  );
}

export default function Profile() {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h1" gutterBottom>Profile</Typography>

      <Card sx={{ mt: 3, maxWidth: 500 }}>
        <CardContent>
          <Stack spacing={3}>
            <Typography variant="h6">
              Signed in as <strong>{user?.username || user?.displayName || 'User'}</strong>
            </Typography>

            <Divider />

            {user?.displayName && (
              <InfoRow
                icon={<PersonOutlineOutlinedIcon />}
                label="Full Name"
                value={user.displayName}
              />
            )}

            {user?.email && (
              <InfoRow
                icon={<EmailOutlinedIcon />}
                label="Email"
                value={user.email}
              />
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
