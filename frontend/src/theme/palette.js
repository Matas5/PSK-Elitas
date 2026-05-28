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
    light: brand.secondaryLight,
    dark: brand.secondaryDark,
    contrastText: brand.contrast,
  },
  info: {
    main: text.secondary,
    light: neutral.activeBg,
    dark: text.primary,
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
  TableCell: {
    border: neutral.border,
  },
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
  },
};

const colorSchemes = {
  light: { palette: lightPalette },
};

export default colorSchemes;
