import tokens from './tokens';

const { brand, neutral, text, risk } = tokens;

const lightPalette = {
  primary: {
    main: brand.primary,
    light: brand.primaryLight,
    dark: brand.primaryDark,
    contrastText: brand.contrast,
  },
  secondary: {
    main: brand.primaryLight,
    light: '#6F9CC0',
    dark: '#2E5A78',
    contrastText: brand.contrast,
  },
  background: {
    default: neutral.offWhite,
    paper: neutral.white,
  },
  text: {
    primary: text.primary,
    secondary: text.secondary,
    disabled: text.disabled,
  },
  divider: neutral.border,
  risk,
  surface: {
    sunken: neutral.sunken,
    raised: neutral.white,
  },
  sidebar: {
    bg: neutral.white,
    border: neutral.border,
    text: text.primary,
    textMuted: text.secondary,
    hover: neutral.hover,
    activeBg: neutral.activeBg,
    activeAccent: brand.primary,
    providerChipBg: neutral.activeBg,
  },
};

const colorSchemes = {
  light: { palette: lightPalette },
};

export default colorSchemes;
