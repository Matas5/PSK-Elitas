import { useEffect, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { createRiskValues, listRiskValues } from '../api/riskValuesApi';
import { dateInputProps, toInputDateTime } from '../constants/risk';

function addInterval(date, step, unit) {
  const result = new Date(date);
  if (!Number.isFinite(step) || step <= 0) return result;

  switch (unit) {
    case 'SECOND': result.setSeconds(result.getSeconds() + step); break;
    case 'MINUTE': result.setMinutes(result.getMinutes() + step); break;
    case 'HOUR': result.setHours(result.getHours() + step); break;
    case 'DAY': result.setDate(result.getDate() + step); break;
    case 'MONTH': result.setMonth(result.getMonth() + step); break;
    case 'QUARTER': result.setMonth(result.getMonth() + step * 3); break;
    case 'YEAR': result.setFullYear(result.getFullYear() + step); break;
    default: break;
  }
  return result;
}

function defaultRecordedAt(risk, existingValues) {
  const step = Number(risk?.timeIntervalValue);
  const unit = risk?.timeIntervalUnit;

  if (existingValues && existingValues.length > 0) {
    const latestMs = existingValues.reduce((max, entry) => {
      const ms = new Date(entry.recordedAt).getTime();
      return Number.isFinite(ms) && ms > max ? ms : max;
    }, -Infinity);
    if (Number.isFinite(latestMs)) {
      return toInputDateTime(addInterval(new Date(latestMs), step, unit), unit);
    }
  }

  if (risk?.validFrom) {
    return toInputDateTime(risk.validFrom, unit);
  }

  return toInputDateTime(new Date(), unit);
}

export default function LogRiskValueDialog({ risk, onClose, onCreated }) {
  const [form, setForm] = useState(() => ({
    value: '',
    recordedAt: defaultRecordedAt(risk, null),
  }));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const userEditedDateRef = useRef(false);

  useEffect(() => {
    let active = true;
    listRiskValues(risk.id)
      .then((values) => {
        if (!active || userEditedDateRef.current) return;
        setForm((prev) => ({ ...prev, recordedAt: defaultRecordedAt(risk, values) }));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [risk]);

  const update = (field) => (event) => {
    const value = event.target.value;
    if (field === 'recordedAt') userEditedDateRef.current = true;
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
            inputProps={dateInputProps(risk)}
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
