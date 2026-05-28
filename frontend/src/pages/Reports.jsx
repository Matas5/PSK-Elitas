/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import {
  deleteReport,
  downloadReport,
  listReports,
  requestCsvReport,
} from '../api/reportsApi';
import { useNotification } from '../context/NotificationContext';
import { useLocale } from '../context/LocaleContext.jsx';
import { useTeam } from '../context/TeamContext';
import { ROUTES } from '../routes';

const STATUS_CHIP = {
  PENDING: { label: 'Generating', color: 'warning' },
  READY: { label: 'Ready', color: 'success' },
  FAILED: { label: 'Failed', color: 'error' },
};

const TYPE_LABEL = { RISK_CSV: 'CSV', CHART_PNG: 'PNG' };

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const { showNotification } = useNotification();
  const { locale } = useLocale();
  const { activeTeam } = useTeam();
  const activeTeamId = activeTeam?.id || '';

  const loadReports = useCallback(async () => {
    if (!activeTeamId) {
      setReports([]);
      return;
    }
    try {
      const data = await listReports(activeTeamId);
      setReports(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err.message || 'Failed to load reports.');
    }
  }, [activeTeamId]);

  useEffect(() => {
    setLoading(true);
    loadReports().finally(() => setLoading(false));
  }, [loadReports]);

  // poll while something is still generating, then stop
  useEffect(() => {
    if (!activeTeamId) return undefined;
    const hasPending = reports.some((r) => r.status === 'PENDING');
    if (!hasPending) return undefined;
    const timer = setInterval(loadReports, 2000);
    return () => clearInterval(timer);
  }, [reports, activeTeamId, loadReports]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await requestCsvReport(activeTeamId);
      showNotification('Report is generating, it will appear below shortly.', 'info');
      await loadReports();
    } catch (err) {
      showNotification(err.message || 'Failed to start report.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (report) => {
    try {
      await downloadReport(report.id, report.fileName);
    } catch (err) {
      showNotification(err.message || 'Download failed.', 'error');
    }
  };

  const handleDelete = async (report) => {
    try {
      await deleteReport(report.id);
      await loadReports();
    } catch (err) {
      showNotification(err.message || 'Delete failed.', 'error');
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString(locale);
  };

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
          <Typography variant="h1" gutterBottom>Reports</Typography>
          <Typography variant="body2" color="text.secondary">
            Generate exports of your team&apos;s risk data and download them. Charts saved from the
            graph view also show up here.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AssessmentOutlinedIcon />}
          onClick={handleGenerate}
          disabled={!activeTeam || generating}
        >
          {generating ? 'Starting…' : 'Generate CSV report'}
        </Button>
      </Stack>

      {!activeTeam && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h3" gutterBottom>No team selected</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create, join, or select a team to generate reports.
          </Typography>
          <Button component={RouterLink} to={ROUTES.TEAMS} variant="contained">
            Go to teams
          </Button>
        </Paper>
      )}

      {activeTeam && loading && (
        <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={32} />
        </Paper>
      )}

      {activeTeam && !loading && loadError && (
        <Alert severity="error" action={(
          <Button color="inherit" size="small" onClick={loadReports}>Retry</Button>
        )}>
          {loadError}
        </Alert>
      )}

      {activeTeam && !loading && !loadError && reports.length === 0 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h3" gutterBottom>No reports yet</Typography>
          <Typography variant="body2" color="text.secondary">
            Generate a CSV report or save a chart as PNG from the graph view to see it here.
          </Typography>
        </Paper>
      )}

      {activeTeam && !loading && !loadError && reports.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => {
                const status = STATUS_CHIP[report.status] || { label: report.status, color: 'default' };
                const pending = report.status === 'PENDING';
                return (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {report.fileName}
                      </Typography>
                    </TableCell>
                    <TableCell>{TYPE_LABEL[report.reportType] || report.reportType}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={status.color}
                        label={status.label}
                        icon={pending ? <CircularProgress size={12} color="inherit" /> : undefined}
                      />
                    </TableCell>
                    <TableCell>{formatDate(report.createdAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(report)}
                        disabled={report.status !== 'READY'}
                        aria-label="Download report"
                      >
                        <DownloadOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(report)}
                        aria-label="Delete report"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
