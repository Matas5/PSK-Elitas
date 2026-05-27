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

function getAnchorTimeFromRisk(risk) {
  if (!risk?.validFrom) return null;

  const anchorDate = new Date(risk.validFrom);
  if (Number.isNaN(anchorDate.getTime())) return null;

  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(anchorDate.getUTCHours())}:${pad(anchorDate.getUTCMinutes())}`;
}

function initializeFormWithAnchor(risk) {
  const anchorTime = getAnchorTimeFromRisk(risk);
  if (!anchorTime) {
    return {
      value: '',
      recordedAt: toLocalDateTimeInput(new Date()),
      anchorTime: null,
    };
  }

  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const [hours, minutes] = anchorTime.split(':');
  const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  return {
    value: '',
    recordedAt: `${dateStr}T${hours}:${minutes}`,
    anchorTime,
  };
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

function applyAnchorTime(value, anchorTime) {
  if (!anchorTime || !value.includes('T')) return value;

  const datePart = value.split('T')[0];
  return `${datePart}T${anchorTime}`;
}

export default function LogRiskValueDialog({ risk, onClose, onCreated }) {
  const [form, setForm] = useState(() => initializeFormWithAnchor(risk));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const suggestedDateTime = useMemo(
    () => getSuggestedDateTime(risk, form.recordedAt),
    [risk, form.recordedAt],
  );
  const suggestedInputValue = suggestedDateTime ? toLocalDateTimeInput(suggestedDateTime) : '';
  const showSuggestion = !form.anchorTime && suggestedInputValue && suggestedInputValue !== form.recordedAt;

  const update = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: field === 'recordedAt' ? applyAnchorTime(value, prev.anchorTime) : value,
    }));

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

    const recordedAtIso = form.anchorTime ? (() => {
      const [datePart] = form.recordedAt.split('T');
      const [hours, minutes] = form.anchorTime.split(':');
      const [year, month, day] = datePart.split('-');
      const utcDate = new Date(Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hours),
        Number(minutes),
      ));
      return utcDate.toISOString();
    })() : new Date(form.recordedAt).toISOString();

    const body = {
      entries: [
        {
          value: Number(form.value),
          recordedAt: recordedAtIso,
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
            helperText={errors.recordedAt || (form.anchorTime ? `Time is locked to ${form.anchorTime} UTC (risk anchor)` : ' ')}
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
