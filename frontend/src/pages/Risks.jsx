import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import Typography from '@mui/material/Typography';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';

import { deleteRisk, listRisks } from '../api/risksApi';
import CreateRiskDialog from '../components/CreateRiskDialog';
import LogRiskValueDialog from '../components/LogRiskValueDialog';
import RiskDetailsDialog from '../components/RiskDetailsDialog';
import { useNotification } from '../context/NotificationContext';
import {
  formatDirection,
  formatFrequency,
  formatThresholds,
} from '../constants/risk';
import { ROUTES } from '../routes';

export default function Risks() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [logValueOpen, setLogValueOpen] = useState(false);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const loadRiskList = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const data = await listRisks();
      setRisks(data);
    } catch (err) {
      setLoadError(err.message || 'Failed to load risks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    listRisks()
      .then((data) => {
        if (active) setRisks(data);
      })
      .catch((err) => {
        if (active) setLoadError(err.message || 'Failed to load risks.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

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
        >
          Create risk
        </Button>
      </Stack>

      {loading && (
        <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={32} />
        </Paper>
      )}

      {!loading && loadError && (
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

      {!loading && !loadError && risks.length === 0 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h3" gutterBottom>No risks created yet</Typography>
          <Typography variant="body2" color="text.secondary">
            Create a risk to start monitoring thresholds and logging frequency.
          </Typography>
        </Paper>
      )}

      {!loading && !loadError && risks.length > 0 && (
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
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {risk.name}
                    </Typography>
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
