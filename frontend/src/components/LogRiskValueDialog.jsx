import { useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { createRiskValues } from '../api/riskValuesApi';
import { formatFrequency } from '../constants/risk';

function toLocalDateTimeInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

function roundToNearest(value, step) {
  return Math.round(value / step) * step;
}

function getSuggestedDateTime(risk, value) {
  if (!value) return null;

  const date = new Date(value);
  const step = Number(risk?.timeIntervalValue);
  const unit = risk?.timeIntervalUnit;

  if (Number.isNaN(date.getTime()) || !Number.isFinite(step) || step <= 0) {
    return null;
  }

  const suggestion = new Date(date);

  if (unit === 'MINUTE') {
    suggestion.setSeconds(0, 0);
    suggestion.setMinutes(roundToNearest(suggestion.getMinutes(), step));
    return suggestion;
  }

  if (unit === 'HOUR') {
    const hour = suggestion.getHours();
    const minuteOffset = suggestion.getMinutes() / 60;
    suggestion.setHours(roundToNearest(hour + minuteOffset, step), 0, 0, 0);
    return suggestion;
  }

  if (unit === 'DAY') {
    const hourOffset = suggestion.getHours() + suggestion.getMinutes() / 60;
    if (hourOffset >= 12) {
      suggestion.setDate(suggestion.getDate() + 1);
    }
    suggestion.setHours(0, 0, 0, 0);
    return suggestion;
  }

  return null;
}

export default function LogRiskValueDialog({ risk, onClose, onCreated }) {
  const [form, setForm] = useState(() => ({
    value: '',
    recordedAt: toLocalDateTimeInput(new Date()),
  }));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const suggestedDateTime = useMemo(
    () => getSuggestedDateTime(risk, form.recordedAt),
    [risk, form.recordedAt],
  );
  const suggestedInputValue = suggestedDateTime ? toLocalDateTimeInput(suggestedDateTime) : '';
  const showSuggestion = suggestedInputValue && suggestedInputValue !== form.recordedAt;

  const update = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = () => {
    const next = {};

    if (form.value === '' || form.value === null) {
      next.value = 'Value is required.';
    } else if (!Number.isFinite(Number(form.value))) {
      next.value = 'Value must be a number.';
    }

    if (!form.recordedAt) {
      next.recordedAt = 'Date is required.';
    } else if (Number.isNaN(new Date(form.recordedAt).getTime())) {
      next.recordedAt = 'Invalid date.';
    }

    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const body = {
      entries: [
        {
          value: Number(form.value),
          recordedAt: new Date(form.recordedAt).toISOString(),
        },
      ],
    };

    try {
      setSubmitting(true);
      const created = await createRiskValues(risk.id, body);
      if (onCreated) onCreated(created[0]);
      onClose();
    } catch (err) {
      setSubmitError(err.message || 'Failed to log risk value.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const applySuggestedDateTime = () => {
    setForm((prev) => ({ ...prev, recordedAt: suggestedInputValue }));
    setErrors((prev) => {
      if (!prev.recordedAt) return prev;
      const next = { ...prev };
      delete next.recordedAt;
      return next;
    });
  };

  return (
    <Dialog
      open
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      component="form"
      onSubmit={handleSubmit}
      noValidate
    >
      <DialogTitle>Log value for "{risk.name}"</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <TextField
            label="Value"
            type="number"
            required
            value={form.value}
            onChange={update('value')}
            error={Boolean(errors.value)}
            helperText={errors.value || `Numeric value in ${risk.measurementUnit}`}
            inputProps={{ step: 'any' }}
          />
          <TextField
            label="Date"
            type="datetime-local"
            required
            value={form.recordedAt}
            onChange={update('recordedAt')}
            error={Boolean(errors.recordedAt)}
            helperText={errors.recordedAt || ' '}
            InputLabelProps={{ shrink: true }}
          />

          {showSuggestion && (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                Suggested {formatFrequency(risk).toLowerCase()}: {formatDateTime(suggestedDateTime)}
              </Typography>
              <Button size="small" onClick={applySuggestedDateTime}>
                Use suggested time
              </Button>
            </Stack>
          )}

          {submitError && <Alert severity="error">{submitError}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save value'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
