import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { createRisk } from '../api/risksApi';
import {
  TIME_INTERVAL_UNITS,
  RISK_DIRECTIONS,
} from '../constants/risk';

const NAME_MIN = 3;
const NAME_MAX = 100;
const DESCRIPTION_MAX = 1000;
const INTERVAL_MIN = 1;
const INTERVAL_MAX = 999;
const MEASUREMENT_UNIT_MAX = 50;

const INITIAL_STATE = {
  name: '',
  description: '',
  timeIntervalValue: '1',
  timeIntervalUnit: 'HOUR',
  measurementUnit: '',
  direction: '',
  upperMedium: '',
  upperMax: '',
  lowerMedium: '',
  lowerMax: '',
  validFrom: '',
  validUntil: '',
};

function toLocalDateTimeInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function parseDecimal(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function ThresholdDot({ tone }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        bgcolor: tone === 'medium' ? 'risk.yellow.main' : 'risk.red.main',
        mr: 1,
        verticalAlign: 'middle',
      }}
    />
  );
}

function ThresholdGroupLabel({ children }) {
  return (
    <Typography variant="h6" sx={{ color: 'text.secondary', mt: 1 }}>
      {children}
    </Typography>
  );
}

export default function CreateRiskDialog({ onClose, onCreated }) {
  const [form, setForm] = useState(() => ({
    ...INITIAL_STATE,
    validFrom: toLocalDateTimeInput(new Date()),
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

  const hasUpper = form.direction === 'HIGHER' || form.direction === 'BOTH';
  const hasLower = form.direction === 'LOWER' || form.direction === 'BOTH';

  const validate = () => {
    const next = {};

    const name = form.name.trim();
    if (!name) next.name = 'Name is required.';
    else if (name.length < NAME_MIN || name.length > NAME_MAX) {
      next.name = `Name must be ${NAME_MIN}–${NAME_MAX} characters.`;
    }

    if (form.description.trim().length > DESCRIPTION_MAX) {
      next.description = `Description must be ≤ ${DESCRIPTION_MAX} characters.`;
    }

    const intervalNum = Number(form.timeIntervalValue);
    if (
      form.timeIntervalValue === '' ||
      !Number.isInteger(intervalNum) ||
      intervalNum < INTERVAL_MIN ||
      intervalNum > INTERVAL_MAX
    ) {
      next.timeIntervalValue = `Enter a whole number between ${INTERVAL_MIN} and ${INTERVAL_MAX}.`;
    }

    if (!form.timeIntervalUnit) {
      next.timeIntervalUnit = 'Select a time unit.';
    }

    const measurementUnit = form.measurementUnit.trim();
    if (!measurementUnit) {
      next.measurementUnit = 'Unit of measurement is required.';
    } else if (measurementUnit.length > MEASUREMENT_UNIT_MAX) {
      next.measurementUnit = `Must be ≤ ${MEASUREMENT_UNIT_MAX} characters.`;
    }

    if (!form.direction) {
      next.direction = 'Select a risk direction.';
    }

    if (hasUpper) {
      const med = parseDecimal(form.upperMedium);
      const max = parseDecimal(form.upperMax);
      if (med === null) next.upperMedium = 'Required number.';
      if (max === null) next.upperMax = 'Required number.';
      if (med !== null && max !== null && !(med < max)) {
        next.upperMax = 'High threshold must be greater than medium.';
      }
    }

    if (hasLower) {
      const med = parseDecimal(form.lowerMedium);
      const max = parseDecimal(form.lowerMax);
      if (med === null) next.lowerMedium = 'Required number.';
      if (max === null) next.lowerMax = 'Required number.';
      if (med !== null && max !== null && !(med > max)) {
        next.lowerMax = 'High threshold must be less than medium (lower = higher risk).';
      }
    }

    if (form.direction === 'BOTH') {
      const lowerMed = parseDecimal(form.lowerMedium);
      const upperMed = parseDecimal(form.upperMedium);
      if (lowerMed !== null && upperMed !== null && !(lowerMed < upperMed)) {
        next.upperMedium = 'Upper medium must be greater than lower medium.';
      }
    }

    if (!form.validFrom) {
      next.validFrom = 'Valid from is required.';
    } else if (Number.isNaN(new Date(form.validFrom).getTime())) {
      next.validFrom = 'Invalid date.';
    }

    if (form.validUntil) {
      const until = new Date(form.validUntil).getTime();
      const from = new Date(form.validFrom).getTime();
      if (Number.isNaN(until)) {
        next.validUntil = 'Invalid date.';
      } else if (!Number.isNaN(from) && until <= from) {
        next.validUntil = 'Must be after Valid from.';
      }
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
      name: form.name.trim(),
      description: form.description.trim() || null,
      timeIntervalValue: Number(form.timeIntervalValue),
      timeIntervalUnit: form.timeIntervalUnit,
      measurementUnit: form.measurementUnit.trim(),
      hasUpperBounds: hasUpper,
      hasLowerBounds: hasLower,
      upperMediumThreshold: hasUpper ? parseDecimal(form.upperMedium) : null,
      upperMaxThreshold: hasUpper ? parseDecimal(form.upperMax) : null,
      lowerMediumThreshold: hasLower ? parseDecimal(form.lowerMedium) : null,
      lowerMaxThreshold: hasLower ? parseDecimal(form.lowerMax) : null,
      validFrom: new Date(form.validFrom).toISOString(),
      validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
    };

    try {
      setSubmitting(true);
      const created = await createRisk(body);
      if (onCreated) onCreated(created);
      onClose();
    } catch (err) {
      setSubmitError(err.message || 'Failed to create risk.');
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
      maxWidth="sm"
      fullWidth
      component="form"
      onSubmit={handleSubmit}
      noValidate
    >
      <DialogTitle>Create risk</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <TextField
            label="Name"
            required
            value={form.name}
            onChange={update('name')}
            error={Boolean(errors.name)}
            helperText={errors.name || `${form.name.trim().length}/${NAME_MAX}`}
            inputProps={{ maxLength: NAME_MAX }}
          />

          <TextField
            label="Description"
            value={form.description}
            onChange={update('description')}
            error={Boolean(errors.description)}
            helperText={errors.description || `${form.description.length}/${DESCRIPTION_MAX}`}
            multiline
            minRows={2}
            maxRows={5}
            inputProps={{ maxLength: DESCRIPTION_MAX }}
          />

          <Box>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
              Logging frequency
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Every"
                type="number"
                required
                value={form.timeIntervalValue}
                onChange={update('timeIntervalValue')}
                error={Boolean(errors.timeIntervalValue)}
                helperText={errors.timeIntervalValue || `${INTERVAL_MIN}–${INTERVAL_MAX}`}
                inputProps={{ min: INTERVAL_MIN, max: INTERVAL_MAX, step: 1 }}
                sx={{ flex: 1 }}
              />
              <TextField
                select
                label="Time unit"
                required
                value={form.timeIntervalUnit}
                onChange={update('timeIntervalUnit')}
                error={Boolean(errors.timeIntervalUnit)}
                helperText={errors.timeIntervalUnit || ' '}
                sx={{ flex: 1 }}
              >
                {TIME_INTERVAL_UNITS.map((u) => (
                  <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>
                ))}
              </TextField>
            </Stack>
          </Box>

          <TextField
            label="Unit of measurement"
            required
            value={form.measurementUnit}
            onChange={update('measurementUnit')}
            error={Boolean(errors.measurementUnit)}
            helperText={errors.measurementUnit || 'e.g. km/h, %, EUR, incidents'}
            placeholder="e.g. km/h, %, EUR, incidents"
            inputProps={{ maxLength: MEASUREMENT_UNIT_MAX }}
          />

          <TextField
            select
            label="Risk direction"
            required
            value={form.direction}
            onChange={update('direction')}
            error={Boolean(errors.direction)}
            helperText={errors.direction || 'How the value relates to risk level'}
          >
            {RISK_DIRECTIONS.map((d) => (
              <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
            ))}
          </TextField>

          {form.direction && (
            <Box>
              <Divider sx={{ mb: 1.5 }} />
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                Risk level thresholds
              </Typography>

              {hasUpper && (
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  <ThresholdGroupLabel>
                    Higher value = higher risk
                  </ThresholdGroupLabel>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label={<><ThresholdDot tone="medium" />Medium at or above</>}
                      type="number"
                      required
                      value={form.upperMedium}
                      onChange={update('upperMedium')}
                      error={Boolean(errors.upperMedium)}
                      helperText={errors.upperMedium || ' '}
                      inputProps={{ step: 'any' }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label={<><ThresholdDot tone="high" />High at or above</>}
                      type="number"
                      required
                      value={form.upperMax}
                      onChange={update('upperMax')}
                      error={Boolean(errors.upperMax)}
                      helperText={errors.upperMax || 'Must be greater than medium'}
                      inputProps={{ step: 'any' }}
                      sx={{ flex: 1 }}
                    />
                  </Stack>
                </Stack>
              )}

              {hasLower && (
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <ThresholdGroupLabel>
                    Lower value = higher risk
                  </ThresholdGroupLabel>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label={<><ThresholdDot tone="medium" />Medium at or below</>}
                      type="number"
                      required
                      value={form.lowerMedium}
                      onChange={update('lowerMedium')}
                      error={Boolean(errors.lowerMedium)}
                      helperText={errors.lowerMedium || ' '}
                      inputProps={{ step: 'any' }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label={<><ThresholdDot tone="high" />High at or below</>}
                      type="number"
                      required
                      value={form.lowerMax}
                      onChange={update('lowerMax')}
                      error={Boolean(errors.lowerMax)}
                      helperText={errors.lowerMax || 'Must be less than medium'}
                      inputProps={{ step: 'any' }}
                      sx={{ flex: 1 }}
                    />
                  </Stack>
                </Stack>
              )}

              {form.direction === 'BOTH' && (
                <Typography
                  variant="caption"
                  sx={{ display: 'block', color: 'text.secondary', mt: 1.5 }}
                >
                  Lower medium must stay below upper medium so the safe band is well-defined.
                </Typography>
              )}
            </Box>
          )}

          <Divider />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Valid from"
              type="datetime-local"
              required
              value={form.validFrom}
              onChange={update('validFrom')}
              error={Boolean(errors.validFrom)}
              helperText={errors.validFrom || ' '}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Valid until"
              type="datetime-local"
              value={form.validUntil}
              onChange={update('validUntil')}
              error={Boolean(errors.validUntil)}
              helperText={errors.validUntil || 'Optional'}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
          </Stack>

          {submitError && <Alert severity="error">{submitError}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create risk'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
