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

function getAnchorTimeFromRisk(risk) {
  if (!risk?.validFrom) return null;
  const anchorDate = new Date(risk.validFrom);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(anchorDate.getUTCHours())}:${pad(anchorDate.getUTCMinutes())}`;
}

function initializeFormWithAnchor(risk) {
  const anchorTime = getAnchorTimeFromRisk(risk);
  if (!anchorTime) {
    console.log('LogRiskValueDialog: No anchor time found');
    return {
      value: '',
      recordedAt: toLocalDateTimeInput(new Date()),
    };
  }
  
  console.log('LogRiskValueDialog: Initializing with anchor time:', anchorTime);
  // Use today's date with the anchor's time (in UTC)
  // For the datetime-local input, we'll show the UTC time directly
  // and convert properly when submitting
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

export default function LogRiskValueDialog({ risk, onClose, onCreated }) {
  const [form, setForm] = useState(() => initializeFormWithAnchor(risk));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => {
    const value = event.target.value;
    
    // If updating recordedAt and we have an anchor time, preserve the anchor time
    if (field === 'recordedAt' && form.anchorTime) {
      const [hours, minutes] = form.anchorTime.split(':');
      const datePart = value.split('T')[0];
      const newValue = `${datePart}T${hours}:${minutes}`;
      setForm((prev) => ({ ...prev, [field]: newValue }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
    
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

    // Extract date from input and use anchor time (in UTC)
    let recordedAtIso = form.recordedAt;
    if (form.anchorTime) {
      const [datePart] = form.recordedAt.split('T');
      const [hours, minutes] = form.anchorTime.split(':');
      const [year, month, day] = datePart.split('-');
      // Create a UTC date with the anchor hours
      const utcDate = new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      ));
      recordedAtIso = utcDate.toISOString();
      console.log('LogRiskValueDialog: Sending recordedAt =', recordedAtIso, '(from anchor time:', form.anchorTime, ')');
    } else {
      recordedAtIso = new Date(form.recordedAt).toISOString();
      console.log('LogRiskValueDialog: No anchor time, sending recordedAt =', recordedAtIso);
    }

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
