import { extendTheme } from '@mui/material/styles';
import colorSchemes from './palette';
import components from './components';

export const layout = {
  sidebarWidth: 248,
  topbarHeight: 64,
  contentMaxWidth: 1320,
};

const theme = extendTheme({
  colorSchemes,
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', Tahoma, system-ui, sans-serif",
    fontSize: 14,
    h1: { fontWeight: 700, fontSize: '2rem', lineHeight: 1.2 },
    h2: { fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.25 },
    h3: { fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.3 },
    h4: { fontWeight: 700, fontSize: '1.05rem' },
    h5: { fontWeight: 600, fontSize: '0.95rem' },
    h6: { fontWeight: 600, fontSize: '0.85rem', letterSpacing: 0.4, textTransform: 'uppercase' },
    button: { textTransform: 'none', fontWeight: 600 },
    body2: { fontSize: '0.85rem' },
  },
  components,
});

export default theme;
