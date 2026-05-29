import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableSortLabel from '@mui/material/TableSortLabel';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';

import { deleteRiskValue, listAllRiskValues, updateRiskValue } from '../api/riskValuesApi';
import { useNotification } from '../context/NotificationContext';
import { useLocale } from '../context/LocaleContext.jsx';
import { formatRiskDateTime, needsSeconds, toInputDateTime } from '../constants/risk';

const PICKER_VIEWS_WITH_SECONDS = ['year', 'month', 'day', 'hours', 'minutes', 'seconds'];
const PICKER_VIEWS = ['year', 'month', 'day', 'hours', 'minutes'];

function pickerToInputString(d, withSeconds) {
  if (!d) return '';
  return withSeconds ? d.format('YYYY-MM-DDTHH:mm:ss') : d.format('YYYY-MM-DDTHH:mm');
}

function EditRiskValueDialog({ entry, risk, onClose, onSaved }) {
    const [form, setForm] = useState(() => ({
        value: entry?.value ?? '',
        recordedAt: toInputDateTime(entry?.recordedAt, risk),
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
                    <DateTimePicker
                        label="Date"
                        value={form.recordedAt ? dayjs(form.recordedAt) : null}
                        onChange={(d) => {
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
                <Button onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default function RiskValueList({ risk, refreshKey = 0 }) {
    const { locale } = useLocale();
    const riskId = risk?.id;
    const measurementUnit = risk?.measurementUnit;
    const [values, setValues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [sortDirection, setSortDirection] = useState('desc');
    const [selectedValueId, setSelectedValueId] = useState(null);
    const [editingValue, setEditingValue] = useState(null);
    const [valueToDelete, setValueToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const { showNotification } = useNotification();

    useEffect(() => {
        if (!riskId) return;

        let active = true;

        async function loadValues() {
            setLoading(true);
            setLoadError(null);

            try {
                const data = await listAllRiskValues(riskId);
                if (active) setValues(data);
            } catch (err) {
                if (active) setLoadError(err.message || 'Failed to load risk values.');
            } finally {
                if (active) setLoading(false);
            }
        }

        loadValues();

        return () => {
            active = false;
        };
    }, [riskId, refreshKey]);

    const filteredAndSortedValues = useMemo(() => {
        const fromTime = fromDate ? new Date(fromDate).getTime() : null;
        const toTime = toDate ? new Date(toDate).getTime() : null;

        return values
            .filter((entry) => {
                const entryTime = new Date(entry.recordedAt).getTime();

                if (Number.isNaN(entryTime)) return false;
                if (fromTime !== null && entryTime < fromTime) return false;
                if (toTime !== null && entryTime > toTime) return false;

                return true;
            })
            .sort((a, b) => {
                const aTime = new Date(a.recordedAt).getTime();
                const bTime = new Date(b.recordedAt).getTime();

                return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
            });
    }, [values, fromDate, toDate, sortDirection]);

    const handleSortToggle = () => {
        setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    };

    const handleClearFilters = () => {
        setFromDate('');
        setToDate('');
    };

    const handleSavedValue = (updated) => {
        setValues((current) => current.map((entry) => (
            entry.id === updated.id ? updated : entry
        )));
        setSelectedValueId(updated.id);
        showNotification('Logged value updated.', 'success');
    };

    const handleDeleteRequest = (entry) => {
        setDeleteError(null);
        setSelectedValueId(entry.id);
        setValueToDelete(entry);
    };

    const handleConfirmDelete = async () => {
        if (!valueToDelete) return;

        try {
            setDeleting(true);
            setDeleteError(null);
            await deleteRiskValue(riskId, valueToDelete.id);
            setValues((current) => current.filter((entry) => entry.id !== valueToDelete.id));
            setSelectedValueId((current) => (current === valueToDelete.id ? null : current));
            setValueToDelete(null);
            showNotification('Logged value deleted.', 'success');
        } catch (err) {
            setDeleteError(err.message || 'Failed to delete risk value.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1.5 }}>
                Logged values
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                <DateTimePicker
                    label="From"
                    value={fromDate ? dayjs(fromDate) : null}
                    onChange={(d) => setFromDate(pickerToInputString(d, needsSeconds(risk)))}
                    views={needsSeconds(risk) ? PICKER_VIEWS_WITH_SECONDS : PICKER_VIEWS}
                    slotProps={{ textField: { fullWidth: true } }}
                />

                <DateTimePicker
                    label="To"
                    value={toDate ? dayjs(toDate) : null}
                    onChange={(d) => setToDate(pickerToInputString(d, needsSeconds(risk)))}
                    views={needsSeconds(risk) ? PICKER_VIEWS_WITH_SECONDS : PICKER_VIEWS}
                    slotProps={{ textField: { fullWidth: true } }}
                />

                <Button onClick={handleClearFilters} sx={{ whiteSpace: 'nowrap' }}>
                    Clear
                </Button>
            </Stack>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={28} />
                </Box>
            )}

            {!loading && loadError && (
                <Alert severity="error">{loadError}</Alert>
            )}

            {!loading && !loadError && filteredAndSortedValues.length === 0 && (
                <Alert severity="info">No logged values found for the selected date range.</Alert>
            )}

            {!loading && !loadError && filteredAndSortedValues.length > 0 && (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    <TableSortLabel
                                        active
                                        direction={sortDirection}
                                        onClick={handleSortToggle}
                                    >
                                        Date
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right">
                                    Value{measurementUnit ? ` (${measurementUnit})` : ''}
                                </TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {filteredAndSortedValues.map((entry) => (
                                <TableRow
                                    key={entry.id}
                                    hover
                                    selected={selectedValueId === entry.id}
                                    onClick={() => setSelectedValueId(entry.id)}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <TableCell>{formatRiskDateTime(entry.recordedAt, risk, locale)}</TableCell>
                                    <TableCell align="right">{entry.value}</TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Edit logged value">
                                            <IconButton
                                                aria-label="Edit logged value"
                                                size="small"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setSelectedValueId(entry.id);
                                                    setEditingValue(entry);
                                                }}
                                            >
                                                <EditOutlinedIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete logged value">
                                            <IconButton
                                                aria-label="Delete logged value"
                                                size="small"
                                                color="error"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleDeleteRequest(entry);
                                                }}
                                            >
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {values.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Showing {filteredAndSortedValues.length} of {values.length} logged values.
                </Typography>
            )}

            {editingValue && (
                <EditRiskValueDialog
                    entry={editingValue}
                    risk={risk}
                    onClose={() => setEditingValue(null)}
                    onSaved={handleSavedValue}
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
                        This will permanently delete the value logged on {formatRiskDateTime(valueToDelete?.recordedAt, risk, locale)}.
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
