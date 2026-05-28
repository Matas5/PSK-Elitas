import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssVarsProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/lt';
import 'dayjs/locale/en';

import App from './App.jsx';
import theme from './theme';
import { AuthProvider } from './auth/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { LocaleProvider, useLocale } from './context/LocaleContext.jsx';

function LocalizedDateProvider({ children }) {
  const { locale } = useLocale();
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locale}>
      {children}
    </LocalizationProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CssVarsProvider theme={theme} defaultMode="light">
      <CssBaseline />
      <BrowserRouter>
        <LocaleProvider>
          <LocalizedDateProvider>
            <AuthProvider>
              <NotificationProvider>
                <App />
              </NotificationProvider>
            </AuthProvider>
          </LocalizedDateProvider>
        </LocaleProvider>
      </BrowserRouter>
    </CssVarsProvider>
  </StrictMode>,
);
