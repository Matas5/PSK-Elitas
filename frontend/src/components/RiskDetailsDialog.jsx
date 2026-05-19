import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import {
  formatDirection,
  formatFrequency,
} from '../constants/risk';

function hasValue(value) {
  return value !== null && value !== undefined && value !== '';
}

function displayValue(value) {
  return hasValue(value) ? String(value) : '-';
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatMediumThreshold(risk) {
  const parts = [];
  if (hasValue(risk?.upperMidThreshold)) {
    parts.push(`Upper >= ${risk.upperMidThreshold}`);
  }
  if (hasValue(risk?.lowerMidThreshold)) {
    parts.push(`Lower <= ${risk.lowerMidThreshold}`);
  }
  return parts.length > 0 ? parts.join('; ') : '-';
}

function formatHighThreshold(risk) {
  const parts = [];
  if (hasValue(risk?.upperMaxThreshold)) {
    parts.push(`Upper >= ${risk.upperMaxThreshold}`);
  }
  if (hasValue(risk?.lowerMinThreshold)) {
    parts.push(`Lower <= ${risk.lowerMinThreshold}`);
  }
  return parts.length > 0 ? parts.join('; ') : '-';
}

function ReadOnlyField({ label, value, multiline = false }) {
  return (
    <TextField
      label={label}
      value={displayValue(value)}
      InputProps={{ readOnly: true }}
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      fullWidth
    />
  );
}

export default function RiskDetailsDialog({
  risk,
  open,
  onClose,
  onEdit,
  onDelete,
  onAddValue,
  deleting = false,
  deleteError = null,
}) {
  if (!risk) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Risk details</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <ReadOnlyField label="Name" value={risk.name} />
          <ReadOnlyField label="Category" value={risk.category || 'Uncategorized'} />
          <ReadOnlyField label="Description" value={risk.description} multiline />

          <Box>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
              Logging
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <ReadOnlyField label="Logging frequency" value={formatFrequency(risk)} />
              <ReadOnlyField label="Unit of measurement" value={risk.measurementUnit} />
            </Stack>
          </Box>

          <ReadOnlyField label="Evaluation direction" value={formatDirection(risk)} />

          <Box>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1.5 }}>
              Risk level thresholds
            </Typography>
            <Stack spacing={2}>
              <ReadOnlyField label="Medium-risk threshold" value={formatMediumThreshold(risk)} />
              <ReadOnlyField label="High-risk threshold" value={formatHighThreshold(risk)} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <ReadOnlyField label="Upper medium threshold" value={risk.upperMidThreshold} />
                <ReadOnlyField label="Upper high threshold" value={risk.upperMaxThreshold} />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <ReadOnlyField label="Lower medium threshold" value={risk.lowerMidThreshold} />
                <ReadOnlyField label="Lower high threshold" value={risk.lowerMinThreshold} />
              </Stack>
            </Stack>
          </Box>

          <Divider />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <ReadOnlyField label="Valid from" value={formatDateTime(risk.validFrom)} />
            <ReadOnlyField label="Valid until" value={formatDateTime(risk.validUntil)} />
          </Stack>

          {deleteError && <Alert severity="error">{deleteError}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={deleting}>Close</Button>
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={onAddValue}
          disabled={deleting}
        >
          Add value
        </Button>
        <Button startIcon={<EditOutlinedIcon />} onClick={onEdit} disabled={deleting}>
          Edit
        </Button>
        <Button
          color="error"
          startIcon={<DeleteOutlineIcon />}
          onClick={onDelete}
          disabled={deleting}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
