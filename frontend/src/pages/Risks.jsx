/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';

import { deleteRisk, getSortStrategy, listRisks, setSortStrategy } from '../api/risksApi';
import CreateRiskDialog from '../components/CreateRiskDialog';
import LogRiskValueDialog from '../components/LogRiskValueDialog';
import RiskDetailsDialog from '../components/RiskDetailsDialog';
import RiskLevelIndicator from '../components/RiskLevelIndicator';
import { useNotification } from '../context/NotificationContext';
import { useTeam } from '../context/TeamContext';
import {
  formatDirection,
  formatFrequency,
  formatThresholds,
} from '../constants/risk';
import { ROUTES } from '../routes';

// labels for the backend strategy bean names
const STRATEGY_LABELS = {
  highCount: 'By high-risk count',
  average: 'By average severity',
};

export default function Risks() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [logValueOpen, setLogValueOpen] = useState(false);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [strategy, setStrategy] = useState('');
  const [strategies, setStrategies] = useState([]);
  const [switching, setSwitching] = useState(false);
  const { showNotification } = useNotification();
  const { activeTeam } = useTeam();
  const navigate = useNavigate();
  const activeTeamId = activeTeam?.id || '';
  const canDeleteRisk = activeTeam?.role === 'OWNER';

  const loadRiskList = useCallback(async () => {
    if (!activeTeamId) {
      setRisks([]);
      setLoading(false);
      setLoadError(null);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const data = await listRisks(activeTeamId);
      setRisks(data);
    } catch (err) {
      setLoadError(err.message || 'Failed to load risks.');
    } finally {
      setLoading(false);
    }
  }, [activeTeamId]);

  useEffect(() => {
    setSelectedRisk(null);
    setEditOpen(false);
    setLogValueOpen(false);
    setConfirmDeleteOpen(false);
    loadRiskList();
  }, [loadRiskList]);

  useEffect(() => {
    getSortStrategy()
      .then(({ active, available }) => {
        setStrategy(active);
        setStrategies(available || []);
      })
      .catch(() => {
        // no toggle if this fails, not fatal
      });
  }, []);

  const handleStrategyChange = async (_event, next) => {
    if (!next || next === strategy || switching) return;
    setSwitching(true);
    try {
      const { active } = await setSortStrategy(next);
      setStrategy(active);
      await loadRiskList();
    } catch (err) {
      showNotification(err.message || 'Failed to switch ranking strategy.', 'error');
    } finally {
      setSwitching(false);
    }
  };

  const handleCreated = (risk) => {
    showNotification(`Risk "${risk.name}" created.`, 'success');
    loadRiskList();
  };

  const handleEdit = () => {
    setEditOpen(true);
  };

  const handleUpdated = (risk) => {
    showNotification(`Risk "${risk.name}" updated.`, 'success');
    setSelectedRisk(risk);
    loadRiskList();
  };

  const handleAddValue = () => {
    setLogValueOpen(true);
  };

  const handleViewGraph = () => {
    if (!selectedRisk) return;
    navigate(`${ROUTES.RISK_GRAPHS}?riskId=${selectedRisk.id}`);
  };

  const handleValueLogged = () => {
    showNotification(`Value logged for "${selectedRisk?.name}".`, 'success');
  };

  const handleDeleteRequest = () => {
    if (!canDeleteRisk) {
      setDeleteError('Only team owners can delete risks.');
      return;
    }
    setDeleteError(null);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRisk) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteRisk(selectedRisk.id);
      showNotification(`Risk "${selectedRisk.name}" deleted.`, 'success');
      setConfirmDeleteOpen(false);
      setSelectedRisk(null);
      await loadRiskList();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete risk.');
      setConfirmDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const closeDetails = () => {
    if (deleting || editOpen || logValueOpen) return;
    setSelectedRisk(null);
    setDeleteError(null);
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
          <Typography variant="h1" gutterBottom>Risks</Typography>
          <Typography variant="body2" color="text.secondary">
            Review created risks and choose which ones to inspect, edit, or delete.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={() => setCreateOpen(true)}
          disabled={!activeTeam}
        >
          Create risk
        </Button>
      </Stack>

      {activeTeam && strategies.length > 1 && (
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap"
          sx={{ mb: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            Ranking strategy
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={strategy}
            onChange={handleStrategyChange}
            disabled={switching}
          >
            {strategies.map((name) => (
              <ToggleButton key={name} value={name}>
                {STRATEGY_LABELS[name] || name}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      )}

      {!activeTeam && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h3" gutterBottom>No team selected</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create, join, or select a team to manage risks.
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
        <Alert
          severity="error"
          action={(
            <Button color="inherit" size="small" onClick={loadRiskList}>
              Retry
            </Button>
          )}
        >
          {loadError}
        </Alert>
      )}

      {activeTeam && !loading && !loadError && risks.length === 0 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h3" gutterBottom>No risks created yet</Typography>
          <Typography variant="body2" color="text.secondary">
            Create a risk in {activeTeam.name} to start monitoring thresholds and logging frequency.
          </Typography>
        </Paper>
      )}

      {activeTeam && !loading && !loadError && risks.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Logging frequency</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Evaluation direction</TableCell>
                <TableCell>Risk level thresholds</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {risks.map((risk) => (
                <TableRow
                  key={risk.id}
                  hover
                  tabIndex={0}
                  onClick={() => setSelectedRisk(risk)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedRisk(risk);
                    }
                  }}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <RiskLevelIndicator level={risk.level} />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {risk.name}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{risk.category || 'Uncategorized'}</TableCell>
                  <TableCell>{formatFrequency(risk)}</TableCell>
                  <TableCell>{risk.measurementUnit}</TableCell>
                  <TableCell>{formatDirection(risk)}</TableCell>
                  <TableCell>{formatThresholds(risk)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {createOpen && (
        <CreateRiskDialog
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
          teamId={activeTeam?.id}
        />
      )}

      {editOpen && selectedRisk && (
        <CreateRiskDialog
          risk={selectedRisk}
          onClose={() => setEditOpen(false)}
          onUpdated={handleUpdated}
        />
      )}

      <RiskDetailsDialog
        risk={selectedRisk}
        open={Boolean(selectedRisk) && !editOpen && !logValueOpen}
        onClose={closeDetails}
        onEdit={handleEdit}
        onAddValue={handleAddValue}
        onViewGraph={handleViewGraph}
        onDelete={handleDeleteRequest}
        canDeleteRisk={canDeleteRisk}
        deleting={deleting}
        deleteError={deleteError}
      />

      {logValueOpen && selectedRisk && (
        <LogRiskValueDialog
          risk={selectedRisk}
          onClose={() => setLogValueOpen(false)}
          onCreated={handleValueLogged}
        />
      )}

      <Dialog
        open={confirmDeleteOpen}
        onClose={() => {
          if (!deleting) setConfirmDeleteOpen(false);
        }}
      >
        <DialogTitle>Delete risk?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete "{selectedRisk?.name}". This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setConfirmDeleteOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
