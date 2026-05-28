import tokens from './tokens';

const components = {
  MuiCssBaseline: {
    styleOverrides: (theme) => ({
      body: {
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
      '*::-webkit-scrollbar': {
        width: 8,
        height: 8,
      },
      '*::-webkit-scrollbar-thumb': {
        backgroundColor: tokens.effects.scrollbarThumb,
        borderRadius: 8,
      },
    }),
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        borderRadius: 10,
        textTransform: 'none',
        fontWeight: 600,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundImage: 'none',
        border: `1px solid ${theme.palette.divider}`,
      }),
    },
  },
  MuiCard: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 14,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: tokens.effects.cardShadow,
      }),
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontWeight: 600,
        borderRadius: 8,
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
        minHeight: 42,
      },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.surface.sunken,
      }),
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderColor: theme.palette.divider,
      }),
      head: ({ theme }) => ({
        fontWeight: 700,
        color: theme.palette.text.secondary,
        fontSize: 12,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
      }),
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
      },
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 10,
        textTransform: 'none',
        fontWeight: 600,
        '&.Mui-selected': {
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
          },
        },
      }),
    },
  },
  MuiTextField: {
    defaultProps: {
      size: 'small',
      variant: 'outlined',
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 10,
      },
    },
  },
};

export default components;
