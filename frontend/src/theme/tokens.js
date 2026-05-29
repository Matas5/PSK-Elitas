const brand = {
  primary: '#242F40',
  primaryLight: '#3D4A60',
  primaryDark: '#161E2A',
  contrast: '#FFFFFF',
  secondaryLight: '#5C6B7F',
  secondaryDark: '#0E1620',
};

const neutral = {
  white: '#FFFFFF',
  offWhite: '#FAFAFA',
  sunken: '#F2F2F2',
  border: '#E0E0E0',
  hover: '#EFEFEF',
  activeBg: '#E5E5E5',
};

const text = {
  primary: '#1A1A1A',
  secondary: '#5C5C5C',
  disabled: '#A0A0A0',
};

const risk = {
  green: {
    main: '#2E7D32',
    contrastText: '#FFFFFF',
    soft: 'rgba(46, 125, 50, 0.12)',
    band: 'rgba(46, 125, 50, 0.14)',
  },
  yellow: {
    main: '#ED9A1A',
    contrastText: '#1A1A1A',
    soft: 'rgba(237, 154, 26, 0.14)',
    band: 'rgba(237, 154, 26, 0.18)',
  },
  red: {
    main: '#C62828',
    contrastText: '#FFFFFF',
    soft: 'rgba(198, 40, 40, 0.12)',
    band: 'rgba(198, 40, 40, 0.18)',
  },
};

// risk-list row indicator: bright shape on a dark square tile so it pops.
// brighter than the `risk` colours above, which stay for the graph/chips.
const riskIndicator = {
  tile: '#161E2A', // dark navy tile
  low: { shape: '#2EE57F' }, // mint green
  medium: { shape: '#FFC400' }, // construction yellow
  high: { shape: '#E11D48' }, // magenta red
};

const effects = {
  scrollbarThumb: 'rgba(0, 0, 0, 0.18)',
  cardShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
};

export const tokens = { brand, neutral, text, risk, riskIndicator, effects };
export default tokens;
