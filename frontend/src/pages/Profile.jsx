import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../context/LocaleContext.jsx';

const missingEmailMessage = 'User email missing'

function InfoRow({ icon, label, value, missing }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
      <Stack spacing={0} sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1" color={missing ? 'text.disabled' : 'text.primary'}>
          {value}
        </Typography>
      </Stack>
    </Stack>
  );
}

export default function Profile() {
  const { user, provider } = useAuth();
  const { locale, setLocale } = useLocale();
  const displayName = user?.username || user?.displayName || 'User';
  const providerLabel = provider ? provider.toUpperCase() : null;
  const isEu = locale === 'lt';

  return (
    <Box>
      <Typography variant="h1" gutterBottom>Profile</Typography>
      <Card sx={{ mt: 3, maxWidth: 500 }}>
        <CardContent>
          <Stack spacing={3}>
            <Typography variant="h6">
              Signed in as <strong>{displayName}</strong>
              {providerLabel && <> via <strong>{providerLabel}</strong></>}
            </Typography>

            <Divider />

            {/*  NAME FIELD */}
            {user?.displayName && (
              <InfoRow
                icon={<PersonOutlineOutlinedIcon />}
                label="Full Name"
                value={user.displayName}
              />
            )}

            {/*  Email field */}
            <InfoRow
              icon={<EmailOutlinedIcon />}
              label="Email"
              value={user?.email || missingEmailMessage }
              missing={!user?.email}
            />

            <Divider />

            {/*  DATE FORMAT -> MOVE LATER TO SETTINGS? */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                <LanguageOutlinedIcon />
              </Box>
              <Stack spacing={0} sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  Date format
                </Typography>
                <FormControlLabel
                  sx={{ mx: 0 }}
                  control={
                    <Switch
                      checked={isEu}
                      onChange={(e) => setLocale(e.target.checked ? 'lt' : 'en')}
                      inputProps={{ 'aria-label': 'EU date format toggle' }}
                    />
                  }
                  label={
                    <Typography variant="body1">
                      EU format <Typography component="span" variant="body2" color="text.secondary">
                        ({isEu ? '2026-05-28 14:30' : '5/28/2026, 2:30 PM'})
                      </Typography>
                    </Typography>
                  }
                />
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
