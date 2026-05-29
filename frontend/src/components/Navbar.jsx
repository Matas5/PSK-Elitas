import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import MenuIcon from '@mui/icons-material/Menu';

// one import per variant so the style is switchable (see NAV_ICON_VARIANT)
import Group from '@mui/icons-material/Group';
import GroupOutlined from '@mui/icons-material/GroupOutlined';
import GroupRounded from '@mui/icons-material/GroupRounded';
import ReportProblem from '@mui/icons-material/ReportProblem';
import ReportProblemOutlined from '@mui/icons-material/ReportProblemOutlined';
import ReportProblemRounded from '@mui/icons-material/ReportProblemRounded';
import QueryStats from '@mui/icons-material/QueryStats';
import QueryStatsOutlined from '@mui/icons-material/QueryStatsOutlined';
import QueryStatsRounded from '@mui/icons-material/QueryStatsRounded';
import ShowChart from '@mui/icons-material/ShowChart';
import ShowChartOutlined from '@mui/icons-material/ShowChartOutlined';
import ShowChartRounded from '@mui/icons-material/ShowChartRounded';
import FileDownload from '@mui/icons-material/FileDownload';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import FileDownloadRounded from '@mui/icons-material/FileDownloadRounded';

import { useAuth } from '../auth/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useTeam } from '../context/TeamContext';
import { layout } from '../theme';
import { ROUTES } from '../routes';

// sidebar icon style: 'filled' | 'outlined' | 'rounded'
const NAV_ICON_VARIANT = 'rounded';

const NAV_ICON_SETS = {
  teams: { filled: Group, outlined: GroupOutlined, rounded: GroupRounded },
  risks: { filled: ReportProblem, outlined: ReportProblemOutlined, rounded: ReportProblemRounded },
  riskValues: { filled: QueryStats, outlined: QueryStatsOutlined, rounded: QueryStatsRounded },
  graphs: { filled: ShowChart, outlined: ShowChartOutlined, rounded: ShowChartRounded },
  downloads: { filled: FileDownload, outlined: FileDownloadOutlined, rounded: FileDownloadRounded },
};

function navIcon(key) {
  const Icon = NAV_ICON_SETS[key][NAV_ICON_VARIANT] || NAV_ICON_SETS[key].rounded;
  return <Icon />;
}

const PRIMARY_NAV = [
  { to: ROUTES.TEAMS, label: 'Teams', icon: navIcon('teams') },
  { to: ROUTES.RISKS, label: 'Risks', icon: navIcon('risks') },
  { to: ROUTES.RISK_GRAPHS, label: 'Risk Graphs', icon: navIcon('graphs') },
  { to: ROUTES.RISK_VALUES, label: 'Risk Values', icon: navIcon('riskValues') },
  { to: ROUTES.DOWNLOADS, label: 'Downloads', icon: navIcon('downloads') },
];

const HOST_ORG = import.meta.env.VITE_HOST_ORG || 'Bulvinuk.ai Limited.';

function NavListItem({ to, label, icon, onNavigate }) {
  return (
    <ListItem disablePadding sx={{ mb: 0.25 }}>
      <ListItemButton
        component={NavLink}
        to={to}
        onClick={onNavigate}
        sx={{
          position: 'relative',
          borderRadius: 1.5,
          pl: 2,
          py: 1,
          color: 'sidebar.textMuted',
          transition: 'background-color 120ms ease, color 120ms ease',
          '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 36 },
          '&:hover': {
            bgcolor: 'sidebar.hover',
            color: 'sidebar.text',
          },
          '&.active': {
            bgcolor: 'sidebar.activeBg',
            color: 'sidebar.text',
            '& .MuiListItemText-primary': { fontWeight: 700 },
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 6,
              bottom: 6,
              width: 3,
              borderRadius: 2,
              bgcolor: 'sidebar.activeAccent',
            },
            '&:hover': { bgcolor: 'sidebar.activeBg' },
          },
        }}
      >
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText
          primary={label}
          primaryTypographyProps={{ fontWeight: 600, fontSize: '0.92rem' }}
        />
      </ListItemButton>
    </ListItem>
  );
}

function DrawerContent({ user, onLogout, onNavigate }) {
  const { teams, activeTeamId, loading, selectTeam } = useTeam();
  const displayName = user?.displayName || user?.username || 'User';
  const email = user?.email;
  const initial = displayName.charAt(0).toUpperCase();
  const selectedTeamId = teams.some((team) => team.id === activeTeamId) ? activeTeamId : '';

  const handleTeamChange = (event) => {
    selectTeam(event.target.value);
    if (onNavigate) onNavigate();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.25 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldOutlinedIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: 'sidebar.text',
                fontWeight: 700,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {HOST_ORG}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'sidebar.textMuted', display: 'block', lineHeight: 1.2 }}
            >
              Risk Monitor
            </Typography>
          </Box>
        </Stack>
        <FormControl
          size="small"
          fullWidth
          disabled={loading || teams.length === 0}
          sx={{
            mt: 2,
            '& .MuiInputLabel-root': { color: 'sidebar.textMuted' },
            '& .MuiOutlinedInput-root': {
              color: 'sidebar.text',
              '& fieldset': { borderColor: 'sidebar.border' },
              '&:hover fieldset': { borderColor: 'sidebar.activeAccent' },
              '&.Mui-focused fieldset': { borderColor: 'sidebar.activeAccent' },
            },
            '& .MuiSvgIcon-root': { color: 'sidebar.textMuted' },
          }}
        >
          <InputLabel id="sidebar-team-select-label">Team</InputLabel>
          <Select
            labelId="sidebar-team-select-label"
            label="Team"
            value={selectedTeamId}
            onChange={handleTeamChange}
          >
            <MenuItem value="">
              <em>No team selected</em>
            </MenuItem>
            {teams.map((team) => (
              <MenuItem key={team.id} value={team.id}>
                {team.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ borderColor: 'sidebar.border' }} />
      <List sx={{ px: 1.5, py: 1.5, flexGrow: 1 }}>
        {PRIMARY_NAV.map((item) => (
          <NavListItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}
      </List>
      <Divider sx={{ borderColor: 'sidebar.border' }} />

      <Box sx={{ px: 2, py: 2 }}>
        <Box
          component={NavLink}
          to={ROUTES.PROFILE}
          onClick={onNavigate}
          sx={{
            display: 'block',
            textDecoration: 'none',
            color: 'inherit',
            borderRadius: 1.5,
            p: 1,
            mx: -1,
            mb: 1.5,
            transition: 'background-color 120ms ease',
            '&:hover': { bgcolor: 'sidebar.hover' },
            '&.active': {
              bgcolor: 'sidebar.activeBg',
              outline: '1px solid',
              outlineColor: 'sidebar.activeAccent',
            },
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                flexShrink: 0,
                borderRadius: '50%',
                bgcolor: 'sidebar.activeBg',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              {initial}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'sidebar.text',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayName}
              </Typography>
              {email && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'sidebar.textMuted',
                    display: 'block',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {email}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutOutlinedIcon />}
          onClick={onLogout}
          sx={{
            justifyContent: 'flex-start',
            color: 'sidebar.text',
            borderColor: 'sidebar.border',
            // signing out is destructive, so the hover leans red
            '&:hover': {
              bgcolor: 'rgba(211, 47, 47, 0.08)',
              borderColor: 'error.main',
              color: 'error.main',
            },
          }}
        >
          Sign out
        </Button>
      </Box>
    </Box>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    logout();
    setMobileOpen(false);

    showNotification('Logged out successfully', 'success', 4000);

    const authUrl = import.meta.env.VITE_AUTH_URL || 'http://localhost:3000';
    try {
      await fetch(`${authUrl}/logout`, { credentials: 'include' });
    } catch (error) {
      console.error('Logout error:', error);
    }

    setTimeout(() => {
      navigate(ROUTES.LOGIN, { replace: true });
    }, 500);
  };

  const handleMobileNavigate = () => setMobileOpen(false);

  const drawerPaperSx = {
    width: layout.sidebarWidth,
    boxSizing: 'border-box',
    bgcolor: 'sidebar.bg',
    color: 'sidebar.text',
    borderRight: '1px solid',
    borderColor: 'sidebar.border',
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { xs: 'block', md: 'none' },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'sidebar.border',
        }}
      >
        <Toolbar sx={{ minHeight: 56 }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1,
            }}
          >
            <ShieldOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="h5" sx={{ color: 'text.primary' }}>
            Risk Monitor
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: layout.sidebarWidth,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': drawerPaperSx,
        }}
      >
        <DrawerContent user={user} onLogout={handleLogout} />
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            ...drawerPaperSx,
            width: { xs: 280, sm: layout.sidebarWidth },
          },
        }}
      >
        <DrawerContent
          user={user}
          onLogout={handleLogout}
          onNavigate={handleMobileNavigate}
        />
      </Drawer>
    </>
  );
}
