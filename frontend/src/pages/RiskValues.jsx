import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import { listRisks } from '../api/risksApi';
import { deleteRiskValue, listRiskValues, updateRiskValue } from '../api/riskValuesApi';
import LogRiskValueDialog from '../components/LogRiskValueDialog';
import { useNotification } from '../context/NotificationContext';

function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function toInputDateTime(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (n) => String(n).padStart(2, '0');

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== '';
}

function calculateRiskLevel(risk, rawValue) {
  if (!risk || !hasValue(rawValue)) return null;

  const value = Number(rawValue);
  if (!Number.isFinite(value)) return null;

  const lowerHigh = hasValue(risk.lowerMinThreshold) ? Number(risk.lowerMinThreshold) : null;
  const lowerMedium = hasValue(risk.lowerMidThreshold) ? Number(risk.lowerMidThreshold) : null;
  const upperMedium = hasValue(risk.upperMidThreshold) ? Number(risk.upperMidThreshold) : null;
  const upperHigh = hasValue(risk.upperMaxThreshold) ? Number(risk.upperMaxThreshold) : null;

  if ((upperHigh !== null && value >= upperHigh) || (lowerHigh !== null && value <= lowerHigh)) {
    return 'High';
  }
  if ((upperMedium !== null && value >= upperMedium) || (lowerMedium !== null && value <= lowerMedium)) {
    return 'Medium';
  }
  if (upperHigh !== null || upperMedium !== null || lowerHigh !== null || lowerMedium !== null) {
    return 'Normal';
  }

  return null;
}

function riskLevelColor(level) {
  if (level === 'High') return 'error';
  if (level === 'Medium') return 'warning';
  if (level === 'Normal') return 'success';
  return 'default';
}

function EditRiskValueDialog({ entry, risk, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    value: entry?.value ?? '',
    recordedAt: toInputDateTime(entry?.recordedAt),
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

    try {
      setSubmitting(true);
      const updated = await updateRiskValue(risk.id, entry.id, {
        value: Number(form.value),
        recordedAt: new Date(form.recordedAt).toISOString(),
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setSubmitError(err.message || 'Failed to update risk value.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open
      onClose={() => {
        if (!submitting) onClose();
      }}
      maxWidth="xs"
      fullWidth
      component="form"
      onSubmit={handleSubmit}
      noValidate
    >
      <DialogTitle>Edit logged value</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <TextField
            label="Value"
            type="number"
            required
            value={form.value}
            onChange={update('value')}
            error={Boolean(errors.value)}
            helperText={errors.value || `Numeric value${risk?.measurementUnit ? ` in ${risk.measurementUnit}` : ''}`}
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
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function RiskValues() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [risks, setRisks] = useState([]);
  const [risksLoading, setRisksLoading] = useState(true);
  const [risksError, setRisksError] = useState(null);
  const [selectedRiskId, setSelectedRiskId] = useState(searchParams.get('riskId') || '');
  const [values, setValues] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('recordedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [valuesLoading, setValuesLoading] = useState(Boolean(searchParams.get('riskId')));
  const [valuesError, setValuesError] = useState(null);
  const [logValueOpen, setLogValueOpen] = useState(false);
  const [editingValue, setEditingValue] = useState(null);
  const [valueToDelete, setValueToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { showNotification } = useNotification();

  const selectedRisk = useMemo(
    () => risks.find((risk) => risk.id === selectedRiskId) || null,
    [risks, selectedRiskId],
  );

  const loadRiskList = useCallback(async () => {
    setRisksLoading(true);
    setRisksError(null);

    try {
      const data = await listRisks();
      setRisks(data);
    } catch (err) {
      setRisksError(err.message || 'Failed to load risks.');
    } finally {
      setRisksLoading(false);
    }
  }, []);

  const loadValues = useCallback(async () => {
    if (!selectedRiskId) {
      setValues([]);
      setTotalElements(0);
      return;
    }

    setValuesLoading(true);
    setValuesError(null);

    try {
      const data = await listRiskValues(selectedRiskId, {
        page,
        size: rowsPerPage,
        sortField,
        sortDirection,
      });
      setValues(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setValuesError(err.message || 'Failed to load risk values.');
    } finally {
      setValuesLoading(false);
    }
  }, [page, rowsPerPage, selectedRiskId, sortDirection, sortField]);

  useEffect(() => {
    let active = true;

    listRisks()
      .then((data) => {
        if (active) setRisks(data);
      })
      .catch((err) => {
        if (active) setRisksError(err.message || 'Failed to load risks.');
      })
      .finally(() => {
        if (active) setRisksLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedRiskId) return undefined;

    let active = true;

    listRiskValues(selectedRiskId, {
      page,
      size: rowsPerPage,
      sortField,
      sortDirection,
    })
      .then((data) => {
        if (!active) return;
        setValues(data.content || []);
        setTotalElements(data.totalElements || 0);
      })
      .catch((err) => {
        if (active) setValuesError(err.message || 'Failed to load risk values.');
      })
      .finally(() => {
        if (active) setValuesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, refreshKey, rowsPerPage, selectedRiskId, sortDirection, sortField]);

  const handleRiskChange = (event) => {
    const nextRiskId = event.target.value;
    setSelectedRiskId(nextRiskId);
    setPage(0);
    setValues([]);
    setTotalElements(0);
    setValuesError(null);
    setValuesLoading(Boolean(nextRiskId));
    setSearchParams(nextRiskId ? { riskId: nextRiskId } : {}, { replace: true });
  };

  const handleSort = (field) => {
    setPage(0);
    if (selectedRiskId) setValuesLoading(true);
    setValuesError(null);
    setSortField(field);
    setSortDirection((current) => (
      sortField === field && current === 'asc' ? 'desc' : 'asc'
    ));
  };

  const handleRowsPerPageChange = (event) => {
    if (selectedRiskId) setValuesLoading(true);
    setValuesError(null);
    setRowsPerPage(Number(event.target.value));
    setPage(0);
  };

  const refreshCurrentPage = () => {
    if (selectedRiskId) setValuesLoading(true);
    setValuesError(null);
    setRefreshKey((current) => current + 1);
  };

  const handleSavedValue = () => {
    showNotification('Logged value updated.', 'success');
    refreshCurrentPage();
  };

  const handleCreatedValue = () => {
    showNotification('Logged value added.', 'success');
    setPage(0);
    setSortField('recordedAt');
    setSortDirection('desc');
    refreshCurrentPage();
  };

  const handleDeleteRequest = (entry) => {
    setDeleteError(null);
    setValueToDelete(entry);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRisk || !valueToDelete) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteRiskValue(selectedRisk.id, valueToDelete.id);
      showNotification('Logged value deleted.', 'success');
      setValueToDelete(null);

      if (values.length === 1 && page > 0) {
        setPage((current) => current - 1);
      } else {
        refreshCurrentPage();
      }
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete risk value.');
    } finally {
      setDeleting(false);
    }
  };

  const tableColSpan = 5;

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h1" gutterBottom>Risk Values</Typography>
          <Typography variant="body2" color="text.secondary">
            Select a risk to review, sort, edit, or delete its logged values.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={() => setLogValueOpen(true)}
          disabled={!selectedRisk}
        >
          Add value
        </Button>
      </Stack>

      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <FormControl fullWidth disabled={risksLoading}>
            <InputLabel id="risk-values-risk-label">Risk</InputLabel>
            <Select
              labelId="risk-values-risk-label"
              label="Risk"
              value={selectedRiskId}
              onChange={handleRiskChange}
            >
              <MenuItem value="">
                <em>Select a risk</em>
              </MenuItem>
              {selectedRiskId && !selectedRisk && (
                <MenuItem value={selectedRiskId} disabled>
                  Loading selected risk...
                </MenuItem>
              )}
              {risks.map((risk) => (
                <MenuItem key={risk.id} value={risk.id}>
                  {risk.name} ({risk.measurementUnit})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button onClick={loadRiskList} disabled={risksLoading}>
            Refresh risks
          </Button>
        </Stack>
        {risksLoading && (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">Loading risks...</Typography>
          </Stack>
        )}
        {!risksLoading && risksError && (
          <Alert
            severity="error"
            sx={{ mt: 2 }}
            action={(
              <Button color="inherit" size="small" onClick={loadRiskList}>
                Retry
              </Button>
            )}
          >
            {risksError}
          </Alert>
        )}
      </Paper>

      {!selectedRiskId && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h3" gutterBottom>Select a risk to view logged values</Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a risk from the selector above to load its historical measurements.
          </Typography>
        </Paper>
      )}

      {selectedRiskId && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'recordedAt'}
                      direction={sortField === 'recordedAt' ? sortDirection : 'asc'}
                      onClick={() => handleSort('recordedAt')}
                    >
                      Date/time
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortField === 'value'}
                      direction={sortField === 'value' ? sortDirection : 'asc'}
                      onClick={() => handleSort('value')}
                    >
                      Value
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Risk level</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {valuesLoading && (
                  <TableRow>
                    <TableCell colSpan={tableColSpan}>
                      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ py: 3 }}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" color="text.secondary">Loading values...</Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}

                {!valuesLoading && valuesError && (
                  <TableRow>
                    <TableCell colSpan={tableColSpan}>
                      <Alert
                        severity="error"
                        action={(
                          <Button color="inherit" size="small" onClick={loadValues}>
                            Retry
                          </Button>
                        )}
                      >
                        {valuesError}
                      </Alert>
                    </TableCell>
                  </TableRow>
                )}

                {!valuesLoading && !valuesError && values.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={tableColSpan}>
                      <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography variant="h3" gutterBottom>No values logged for this risk</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Add a value for this risk to start building its measurement history.
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddOutlinedIcon />}
                          onClick={() => setLogValueOpen(true)}
                          disabled={!selectedRisk}
                          sx={{ mt: 2 }}
                        >
                          Add value
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {!valuesLoading && !valuesError && values.map((entry) => {
                  const level = calculateRiskLevel(selectedRisk, entry.value);

                  return (
                    <TableRow key={entry.id} hover>
                      <TableCell>{formatDateTime(entry.recordedAt)}</TableCell>
                      <TableCell align="right">{entry.value}</TableCell>
                      <TableCell>{selectedRisk?.measurementUnit || '-'}</TableCell>
                      <TableCell>
                        {level ? (
                          <Chip
                            label={level}
                            color={riskLevelColor(level)}
                            size="small"
                            variant={level === 'Normal' ? 'outlined' : 'filled'}
                          />
                        ) : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit logged value">
                          <IconButton
                            aria-label="Edit logged value"
                            size="small"
                            onClick={() => setEditingValue(entry)}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete logged value">
                          <IconButton
                            aria-label="Delete logged value"
                            size="small"
                            color="error"
                            onClick={() => handleDeleteRequest(entry)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalElements}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            onPageChange={(_event, nextPage) => {
              setValuesLoading(true);
              setValuesError(null);
              setPage(nextPage);
            }}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Paper>
      )}

      {editingValue && selectedRisk && (
        <EditRiskValueDialog
          entry={editingValue}
          risk={selectedRisk}
          onClose={() => setEditingValue(null)}
          onSaved={handleSavedValue}
        />
      )}

      {logValueOpen && selectedRisk && (
        <LogRiskValueDialog
          risk={selectedRisk}
          onClose={() => setLogValueOpen(false)}
          onCreated={handleCreatedValue}
        />
      )}

      <Dialog
        open={Boolean(valueToDelete)}
        onClose={() => {
          if (!deleting) setValueToDelete(null);
        }}
      >
        <DialogTitle>Delete logged value?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete the value logged on {formatDateTime(valueToDelete?.recordedAt)}.
          </DialogContentText>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setValueToDelete(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
