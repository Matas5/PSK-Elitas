import { Navigate, Route, Routes } from 'react-router-dom';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

import Navbar from './components/Navbar';
import Notification from './components/Notification';
import RequireAuth from './auth/RequireAuth';
import { useAuth } from './auth/AuthContext';
import { layout } from './theme';
import { ROUTES } from './routes';
import { ROUTES } from './routes';

import { Dashboard, Login, Profile, Reports } from './pages';

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
  const { isAuthenticated, loading } = useAuth();
  // While auth is initializing, don't redirect — allow AuthProvider to determine state
  if (loading) return null;
  return <Navigate to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN} replace />;
}

export default function App() {
  return (
    <>
      <Notification />
      <Routes>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route
          path={ROUTES.DASHBOARD}
          element={(
            <RequireAuth>
              <AuthedShell><Dashboard /></AuthedShell>
            </RequireAuth>
          )}
        />
        <Route
          path={ROUTES.REPORTS}
          element={(
            <RequireAuth>
              <AuthedShell><Reports /></AuthedShell>
            </RequireAuth>
          )}
        />
        <Route
          path={ROUTES.PROFILE}
          element={(
            <RequireAuth>
              <AuthedShell><Profile /></AuthedShell>
            </RequireAuth>
          )}
        />
        <Route path={ROUTES.HOME} element={<HomeRedirect />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </>
  );
}
