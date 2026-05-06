import { Navigate, Route, Routes } from 'react-router-dom';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

import Navbar from './components/Navbar';
import RequireAuth from './auth/RequireAuth';
import { useAuth } from './auth/AuthContext';
import { layout } from './theme';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Profile from './pages/Profile';

function AuthedShell({ children }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${layout.sidebarWidth}px)` },
          p: { xs: 2, md: 4 },
        }}
      >
        <Toolbar sx={{ display: { xs: 'block', md: 'none' } }} />
        {children}
      </Box>
    </Box>
  );
}

function HomeRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={(
          <RequireAuth>
            <AuthedShell><Dashboard /></AuthedShell>
          </RequireAuth>
        )}
      />
      <Route
        path="/reports"
        element={(
          <RequireAuth>
            <AuthedShell><Reports /></AuthedShell>
          </RequireAuth>
        )}
      />
      <Route
        path="/profile"
        element={(
          <RequireAuth>
            <AuthedShell><Profile /></AuthedShell>
          </RequireAuth>
        )}
      />
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
