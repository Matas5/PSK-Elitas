import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableSortLabel from '@mui/material/TableSortLabel';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { listRiskValues } from '../api/riskValuesApi';

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

export default function RiskValueList({ riskId, measurementUnit, refreshKey = 0 }) {
    const [values, setValues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [sortDirection, setSortDirection] = useState('desc');

    useEffect(() => {
        if (!riskId) return;

        let active = true;

        async function loadValues() {
            setLoading(true);
            setLoadError(null);

            try {
                const data = await listRiskValues(riskId);
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

    return (
        <Box>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1.5 }}>
                Logged values
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                <TextField
                    label="From"
                    type="datetime-local"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                />

                <TextField
                    label="To"
                    type="datetime-local"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
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
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {filteredAndSortedValues.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>{formatDateTime(entry.recordedAt)}</TableCell>
                                    <TableCell align="right">{entry.value}</TableCell>
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
        </Box>
    );
}