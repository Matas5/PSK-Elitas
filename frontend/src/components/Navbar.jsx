import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
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
import Divider from '@mui/material/Divider';

import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import MenuIcon from '@mui/icons-material/Menu';

import { useAuth } from '../auth/AuthContext';
import { layout } from '../theme';
import { ROUTES } from '../routes';

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: <DashboardOutlinedIcon /> },
  { to: ROUTES.REPORTS, label: 'Reports', icon: <AssessmentOutlinedIcon /> },
  { to: ROUTES.PROFILE, label: 'Profile', icon: <PersonOutlineOutlinedIcon /> },
];

function NavListItem({ to, label, icon, onNavigate }) {
  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton
        component={NavLink}
        to={to}
        onClick={onNavigate}
        sx={{
          borderRadius: 2,
          color: 'rgba(255,255,255,0.78)',
          '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 36 },
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.08)',
            color: 'primary.contrastText',
          },
          '&.active': {
            bgcolor: 'rgba(255,255,255,0.16)',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
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
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 2.5, py: 2.5 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldOutlinedIcon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ color: 'inherit', lineHeight: 1.2 }}>
            Risk Monitor
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            KRI tracking
          </Typography>
        </Box>
      </Stack>

      <List sx={{ px: 1.5, flexGrow: 1 }}>
        {NAV_ITEMS.map((item) => (
          <NavListItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      <Box sx={{ px: 2.5, py: 2 }}>
        <Typography
          variant="caption"
          sx={{ display: 'block', color: 'rgba(255,255,255,0.6)', mb: 1 }}
        >
          Signed in as <strong>{user?.username}</strong>
        </Typography>
        <Button
          fullWidth
          startIcon={<LogoutOutlinedIcon />}
          onClick={onLogout}
          sx={{
            justifyContent: 'flex-start',
            color: 'primary.contrastText',
            bgcolor: 'rgba(255,255,255,0.08)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const handleMobileNavigate = () => setMobileOpen(false);

  const drawerSx = {
    width: layout.sidebarWidth,
    boxSizing: 'border-box',
    bgcolor: 'primary.main',
    color: 'primary.contrastText',
    borderRight: 'none',
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { xs: 'block', md: 'none' },
          bgcolor: 'primary.main',
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
          <ShieldOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="h5" sx={{ color: 'inherit' }}>
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
          '& .MuiDrawer-paper': drawerSx,
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
          '& .MuiDrawer-paper': drawerSx,
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
