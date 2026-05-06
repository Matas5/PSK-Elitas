import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import SquareIcon from '@mui/icons-material/Square';
import CircleIcon from '@mui/icons-material/Circle';

export const SHAPES = ['TRIANGLE', 'SQUARE', 'CIRCLE'];

export const SHAPE_LABELS = {
  TRIANGLE: 'Triangle',
  SQUARE: 'Square',
  CIRCLE: 'Circle',
};

const SHAPE_ICONS = {
  TRIANGLE: ChangeHistoryIcon,
  SQUARE: SquareIcon,
  CIRCLE: CircleIcon,
};

export const iconForShape = (shape) => SHAPE_ICONS[shape] ?? null;
