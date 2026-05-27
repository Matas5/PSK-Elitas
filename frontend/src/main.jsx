import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssVarsProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import App from './App.jsx';
import theme from './theme';
import { AuthProvider } from './auth/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CssVarsProvider theme={theme} defaultMode="light">
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </CssVarsProvider>
  </StrictMode>,
);
