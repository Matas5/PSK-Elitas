import { useEffect, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';

import { createRiskValues, listRiskValues } from '../api/riskValuesApi';
import { needsSeconds, toInputDateTime } from '../constants/risk';

const PICKER_VIEWS_WITH_SECONDS = ['year', 'month', 'day', 'hours', 'minutes', 'seconds'];
const PICKER_VIEWS = ['year', 'month', 'day', 'hours', 'minutes'];

function pickerToInputString(d, withSeconds) {
  if (!d) return '';
  return withSeconds ? d.format('YYYY-MM-DDTHH:mm:ss') : d.format('YYYY-MM-DDTHH:mm');
}

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
      .then((data) => {
        if (!active || userEditedDateRef.current) return;
        setForm((prev) => ({ ...prev, recordedAt: defaultRecordedAt(risk, data.content) }));
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
          <DateTimePicker
            label="Date"
            value={form.recordedAt ? dayjs(form.recordedAt) : null}
            onChange={(d) => {
              userEditedDateRef.current = true;
              setForm((prev) => ({
                ...prev,
                recordedAt: pickerToInputString(d, needsSeconds(risk)),
              }));
              setErrors((prev) => {
                if (!prev.recordedAt) return prev;
                const next = { ...prev };
                delete next.recordedAt;
                return next;
              });
            }}
            views={needsSeconds(risk) ? PICKER_VIEWS_WITH_SECONDS : PICKER_VIEWS}
            slotProps={{
              textField: {
                required: true,
                fullWidth: true,
                error: Boolean(errors.recordedAt),
                helperText: errors.recordedAt || ' ',
              },
            }}
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
