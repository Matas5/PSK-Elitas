import { useEffect, useRef } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

import Navbar from './components/Navbar';
import Notification from './components/Notification';
import RequireAuth from './auth/RequireAuth';
import { useAuth } from './auth/AuthContext';
import { useNotification } from './context/NotificationContext';
import { layout } from './theme';
import { ROUTES } from './routes';

import { LocalRegister, Login, Profile, Reports, RiskGraph, Risks, RiskValues } from './pages';

function AuthedShell({ children }) {
  const { justLoggedIn, clearJustLoggedIn } = useAuth();
  const { showNotification } = useNotification();
  const shownLoginRef = useRef(false);

  useEffect(() => {
    if (justLoggedIn && !shownLoginRef.current) {
      shownLoginRef.current = true;
      showNotification('Login successful!', 'success', 4000);
      clearJustLoggedIn();
    }
  }, [clearJustLoggedIn, justLoggedIn, showNotification]);

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
  if (loading) return null;
  return <Navigate to={isAuthenticated ? ROUTES.RISKS : ROUTES.LOGIN} replace />;
}

export default function App() {
  return (
    <>
      <Notification />
      <Routes>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<LocalRegister />} />

        <Route
          path={ROUTES.RISKS}
          element={(
            <RequireAuth>
              <AuthedShell><Risks /></AuthedShell>
            </RequireAuth>
          )}
        />

        <Route
          path={ROUTES.RISK_GRAPHS}
          element={(
            <RequireAuth>
              <AuthedShell><RiskGraph /></AuthedShell>
            </RequireAuth>
          )}
        />

        <Route
          path={ROUTES.RISK_GRAPH}
          element={(
            <RequireAuth>
              <AuthedShell><RiskGraph /></AuthedShell>
            </RequireAuth>
          )}
        />

        <Route
          path={ROUTES.RISK_VALUES}
          element={(
            <RequireAuth>
              <AuthedShell><RiskValues /></AuthedShell>
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
