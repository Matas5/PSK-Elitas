import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

import { RISK_LEVELS } from '../constants/risk';
import { tokens } from '../theme/tokens';

const BADGE_SIZE = 28;
const SHAPE_SIZE = 13;

// level enum -> riskIndicator token key
const TOKEN_KEY = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high' };

function shapeStyles(shape, color) {
  if (shape === 'triangle') {
    // box clipped to a triangle, slightly inset so it sits centred
    return {
      width: SHAPE_SIZE + 1,
      height: SHAPE_SIZE + 1,
      backgroundColor: color,
      clipPath: 'polygon(50% 8%, 4% 92%, 96% 92%)',
    };
  }
  return {
    width: SHAPE_SIZE,
    height: SHAPE_SIZE,
    backgroundColor: color,
    borderRadius: shape === 'circle' ? '50%' : '3px',
  };
}

export default function RiskLevelIndicator({ level }) {
  const meta = RISK_LEVELS[level];
  const palette = tokens.riskIndicator[TOKEN_KEY[level]];
  if (!meta || !palette) {
    return null;
  }

  const description = `${meta.colorName} ${meta.shape} - Level: ${meta.label}`;

  return (
    <Tooltip title={description} arrow>
      <Box
        role="img"
        aria-label={description}
        sx={{
          width: BADGE_SIZE,
          height: BADGE_SIZE,
          borderRadius: '5px',
          backgroundColor: tokens.riskIndicator.tile,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Box sx={shapeStyles(meta.shape, palette.shape)} />
      </Box>
    </Tooltip>
  );
}
