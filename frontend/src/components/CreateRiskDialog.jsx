import { useState, Fragment } from 'react';
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

import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';

import { createRisk, updateRisk } from '../api/risksApi';
import ConflictDialog from './ConflictDialog';
import {
  TIME_INTERVAL_UNITS,
  RISK_DIRECTIONS,
  needsSeconds,
  toInputDateTime,
} from '../constants/risk';

const PICKER_VIEWS_WITH_SECONDS = ['year', 'month', 'day', 'hours', 'minutes', 'seconds'];
const PICKER_VIEWS = ['year', 'month', 'day', 'hours', 'minutes'];

function pickerToInputString(d, withSeconds) {
  if (!d) return '';
  return withSeconds ? d.format('YYYY-MM-DDTHH:mm:ss') : d.format('YYYY-MM-DDTHH:mm');
}

const NAME_MIN = 3;
const NAME_MAX = 100;
const CATEGORY_MAX = 100;
const DESCRIPTION_MAX = 1000;
const INTERVAL_MIN = 1;
const INTERVAL_MAX = 999;
const MEASUREMENT_UNIT_MAX = 50;

const INITIAL_STATE = {
  name: '',
  category: '',
  description: '',
  timeIntervalValue: '1',
  timeIntervalUnit: 'HOUR',
  measurementUnit: '',
  direction: '',
  upperMid: '',
  upperMax: '',
  lowerMid: '',
  lowerMin: '',
  validFrom: '',
  validUntil: '',
};

function parseDecimal(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== '';
}

function directionFromRisk(risk) {
  const hasUpper = hasValue(risk?.upperMidThreshold) && hasValue(risk?.upperMaxThreshold);
  const hasLower = hasValue(risk?.lowerMidThreshold) && hasValue(risk?.lowerMinThreshold);

  if (hasUpper && hasLower) return 'BOTH';
  if (hasUpper) return 'HIGHER';
  if (hasLower) return 'LOWER';
  return '';
}

function riskToForm(risk) {
  if (!risk) {
    return {
      ...INITIAL_STATE,
      validFrom: toInputDateTime(new Date(), INITIAL_STATE.timeIntervalUnit),
      version: null,
    };
  }

  return {
    name: risk.name || '',
    category: risk.category || '',
    description: risk.description || '',
    timeIntervalValue: risk.timeIntervalValue ? String(risk.timeIntervalValue) : '1',
    timeIntervalUnit: risk.timeIntervalUnit || 'HOUR',
    measurementUnit: risk.measurementUnit || '',
    direction: directionFromRisk(risk),
    upperMid: hasValue(risk.upperMidThreshold) ? String(risk.upperMidThreshold) : '',
    upperMax: hasValue(risk.upperMaxThreshold) ? String(risk.upperMaxThreshold) : '',
    lowerMid: hasValue(risk.lowerMidThreshold) ? String(risk.lowerMidThreshold) : '',
    lowerMin: hasValue(risk.lowerMinThreshold) ? String(risk.lowerMinThreshold) : '',
    validFrom: toInputDateTime(risk.validFrom, risk),
    validUntil: toInputDateTime(risk.validUntil, risk),
    version: risk.version,
  };
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

export default function CreateRiskDialog({ risk = null, onClose, onCreated, onUpdated }) {
  const isEdit = Boolean(risk);
  const [form, setForm] = useState(() => riskToForm(risk));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [conflictData, setConflictData] = useState(null);

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

  const updateDate = (field) => (d) => {
    setForm((prev) => ({
      ...prev,
      [field]: pickerToInputString(d, needsSeconds(prev.timeIntervalUnit)),
    }));
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

    const category = form.category.trim();
    if (!category) {
      next.category = 'Category is required.';
    } else if (category.length > CATEGORY_MAX) {
      next.category = `Category must be ≤ ${CATEGORY_MAX} characters.`;
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
      const mid = parseDecimal(form.upperMid);
      const max = parseDecimal(form.upperMax);
      if (mid === null) next.upperMid = 'Required number.';
      if (max === null) next.upperMax = 'Required number.';
      if (mid !== null && max !== null && !(mid < max)) {
        next.upperMax = 'High threshold must be greater than medium.';
      }
    }

    if (hasLower) {
      const mid = parseDecimal(form.lowerMid);
      const min = parseDecimal(form.lowerMin);
      if (mid === null) next.lowerMid = 'Required number.';
      if (min === null) next.lowerMin = 'Required number.';
      if (mid !== null && min !== null && !(mid > min)) {
        next.lowerMin = 'High threshold must be less than medium (lower = higher risk).';
      }
    }

    if (form.direction === 'BOTH') {
      const lowerMid = parseDecimal(form.lowerMid);
      const upperMid = parseDecimal(form.upperMid);
      if (lowerMid !== null && upperMid !== null && !(lowerMid < upperMid)) {
        next.upperMid = 'Upper medium must be greater than lower medium.';
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
      category: form.category.trim(),
      description: form.description.trim() || null,
      timeIntervalValue: Number(form.timeIntervalValue),
      timeIntervalUnit: form.timeIntervalUnit,
      measurementUnit: form.measurementUnit.trim(),
      hasUpperBounds: hasUpper,
      hasLowerBounds: hasLower,
      upperMidThreshold: hasUpper ? parseDecimal(form.upperMid) : null,
      upperMaxThreshold: hasUpper ? parseDecimal(form.upperMax) : null,
      lowerMidThreshold: hasLower ? parseDecimal(form.lowerMid) : null,
      lowerMinThreshold: hasLower ? parseDecimal(form.lowerMin) : null,
      validFrom: new Date(form.validFrom).toISOString(),
      validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
      ...(isEdit && { version: form.version }),
    };

    try {
      setSubmitting(true);
      if (isEdit) {
        const updated = await updateRisk(risk.id, body);
        if (onUpdated) onUpdated(updated);
      } else {
        const created = await createRisk(body);
        if (onCreated) onCreated(created);
      }
      onClose();
    } catch (err) {
      // Check for optimistic locking conflict (HTTP 409)
      if (err.status === 409 && err.data?.currentData) {
        setConflictData(err.data);
        return;
      }
      setSubmitError(err.message || `Failed to ${isEdit ? 'update' : 'create'} risk.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleConflictReload = () => {
    // Reload from the server version
    const serverRisk = conflictData.currentData;
    setForm(riskToForm(serverRisk));
    setConflictData(null);
    setSubmitError(null);
  };

  const handleConflictOverwrite = async () => {
    // Update version to server's version and retry
    setForm((prev) => ({ ...prev, version: conflictData.currentVersion }));
    setConflictData(null);
    
    // Retry the submit after updating the version
    // We need to trigger a submit with the new version
    setTimeout(() => {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      document.querySelector('form')?.dispatchEvent(submitEvent);
    }, 0);
  };

  return (
    <Fragment>
      <Dialog
        open
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        component="form"
        onSubmit={handleSubmit}
        noValidate
      >
      <DialogTitle>{isEdit ? 'Edit risk' : 'Create risk'}</DialogTitle>
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
            label="Category"
            required
            value={form.category}
            onChange={update('category')}
            error={Boolean(errors.category)}
            helperText={errors.category || `${form.category.trim().length}/${CATEGORY_MAX}`}
            inputProps={{ maxLength: CATEGORY_MAX }}
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
                      value={form.upperMid}
                      onChange={update('upperMid')}
                      error={Boolean(errors.upperMid)}
                      helperText={errors.upperMid || ' '}
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
                      value={form.lowerMid}
                      onChange={update('lowerMid')}
                      error={Boolean(errors.lowerMid)}
                      helperText={errors.lowerMid || ' '}
                      inputProps={{ step: 'any' }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label={<><ThresholdDot tone="high" />High at or below</>}
                      type="number"
                      required
                      value={form.lowerMin}
                      onChange={update('lowerMin')}
                      error={Boolean(errors.lowerMin)}
                      helperText={errors.lowerMin || 'Must be less than medium'}
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
            <DateTimePicker
              label="Valid from"
              value={form.validFrom ? dayjs(form.validFrom) : null}
              onChange={updateDate('validFrom')}
              views={needsSeconds(form.timeIntervalUnit) ? PICKER_VIEWS_WITH_SECONDS : PICKER_VIEWS}
              sx={{ flex: 1 }}
              slotProps={{
                textField: {
                  required: true,
                  fullWidth: true,
                  error: Boolean(errors.validFrom),
                  helperText: errors.validFrom || ' ',
                },
              }}
            />
            <DateTimePicker
              label="Valid until"
              value={form.validUntil ? dayjs(form.validUntil) : null}
              onChange={updateDate('validUntil')}
              views={needsSeconds(form.timeIntervalUnit) ? PICKER_VIEWS_WITH_SECONDS : PICKER_VIEWS}
              sx={{ flex: 1 }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: Boolean(errors.validUntil),
                  helperText: errors.validUntil || 'Optional',
                },
              }}
            />
          </Stack>

          {submitError && <Alert severity="error">{submitError}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting
            ? `${isEdit ? 'Saving' : 'Creating'}…`
            : `${isEdit ? 'Save changes' : 'Create risk'}`}
        </Button>
      </DialogActions>
      </Dialog>

      <ConflictDialog
        open={Boolean(conflictData)}
        resourceName="risk"
        serverData={conflictData?.currentData}
        onReload={handleConflictReload}
        onOverwrite={handleConflictOverwrite}
        onClose={() => setConflictData(null)}
      />
    </Fragment>
  );
}

