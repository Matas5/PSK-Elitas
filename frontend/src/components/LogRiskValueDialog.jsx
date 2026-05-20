import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { createRiskValues } from '../api/riskValuesApi';

function toLocalDateTimeInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export default function LogRiskValueDialog({ risk, onClose, onCreated }) {
  const [form, setForm] = useState(() => ({
    value: '',
    recordedAt: toLocalDateTimeInput(new Date()),
  }));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
