/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';

import { listTeamMembers } from '../api/teamsApi';
import { formatRiskDateTime } from '../constants/risk';
import { useLocale } from '../context/LocaleContext.jsx';
import { useNotification } from '../context/NotificationContext';
import { useTeam } from '../context/TeamContext';

export default function Teams() {
  const {
    teams,
    activeTeam,
    activeTeamId,
    loading,
    error,
    selectTeam,
    createTeam,
    joinTeam,
    refreshTeams,
  } = useTeam();
  const { locale } = useLocale();
  const { showNotification } = useNotification();
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersError, setMembersError] = useState(null);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    if (!activeTeamId) {
      setMembers([]);
      setMembersError(null);
      return;
    }

    let active = true;
    setMembersLoading(true);
    setMembersError(null);
    listTeamMembers(activeTeamId)
      .then((data) => {
        if (active) setMembers(data);
      })
      .catch((err) => {
        if (active) setMembersError(err.message || 'Failed to load team members.');
      })
      .finally(() => {
        if (active) setMembersLoading(false);
      });

    return () => { active = false; };
  }, [activeTeamId]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!teamName.trim()) {
      setSubmitError('Team name is required.');
      return;
    }
    try {
      setSubmitting(true);
      setSubmitError(null);
      const team = await createTeam(teamName.trim());
      setTeamName('');
      showNotification(`Team "${team.name}" created.`, 'success');
    } catch (err) {
      setSubmitError(err.message || 'Failed to create team.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (event) => {
    event.preventDefault();
    if (!inviteCode.trim()) {
      setSubmitError('Invite code is required.');
      return;
    }
    try {
      setSubmitting(true);
      setSubmitError(null);
      const team = await joinTeam(inviteCode.trim());
      setInviteCode('');
      showNotification(`Joined "${team.name}".`, 'success');
    } catch (err) {
      setSubmitError(err.message || 'Failed to join team.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyInviteCode = async (code) => {
    await navigator.clipboard.writeText(code);
    showNotification('Invite code copied.', 'success');
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
          <Typography variant="h1" gutterBottom>Teams</Typography>
          <Typography variant="body2" color="text.secondary">
            Create or join a team, then select the active team for risks and values.
          </Typography>
        </Box>
        <Button onClick={refreshTeams} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
        <Paper sx={{ p: 2.5, width: '100%' }}>
          <Typography variant="h3" gutterBottom>My Teams</Typography>
          {loading && (
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">Loading teams...</Typography>
            </Stack>
          )}
          {!loading && teams.length === 0 && (
            <Alert severity="info">No teams yet. Create or join a team to manage risks.</Alert>
          )}
          {!loading && teams.length > 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Invite code</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.id} selected={team.id === activeTeamId}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{team.name}</Typography>
                      </TableCell>
                      <TableCell><Chip size="small" label={team.role} /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2">{team.inviteCode}</Typography>
                          <Button
                            size="small"
                            startIcon={<ContentCopyOutlinedIcon fontSize="small" />}
                            onClick={() => handleCopyInviteCode(team.inviteCode)}
                          >
                            Copy
                          </Button>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant={team.id === activeTeamId ? 'contained' : 'outlined'}
                          onClick={() => selectTeam(team.id)}
                        >
                          {team.id === activeTeamId ? 'Selected' : 'Select'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Paper sx={{ p: 2.5, width: { xs: '100%', md: 420 }, flexShrink: 0 }}>
          <Stack spacing={2.5}>
            <Box component="form" onSubmit={handleCreate}>
              <Typography variant="h3" gutterBottom>Create Team</Typography>
              <Stack spacing={1.5}>
                <TextField
                  label="Team name"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  required
                  fullWidth
                />
                <Button type="submit" variant="contained" disabled={submitting}>
                  Create team
                </Button>
              </Stack>
            </Box>

            <Divider />

            <Box component="form" onSubmit={handleJoin}>
              <Typography variant="h3" gutterBottom>Join Team</Typography>
              <Stack spacing={1.5}>
                <TextField
                  label="Invite code"
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  required
                  fullWidth
                />
                <Button type="submit" variant="outlined" disabled={submitting}>
                  Join team
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Stack>

      <Paper sx={{ p: 2.5, mt: 3 }}>
        <Typography variant="h3" gutterBottom>Team Members</Typography>
        {!activeTeam && <Alert severity="info">Select a team to view members.</Alert>}
        {activeTeam && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current team: {activeTeam.name}
            </Typography>
            {membersLoading && <CircularProgress size={24} />}
            {membersError && <Alert severity="error">{membersError}</Alert>}
            {!membersLoading && !membersError && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Member</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Joined</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.displayName || member.userId}</TableCell>
                        <TableCell><Chip size="small" label={member.role} /></TableCell>
                        <TableCell>{formatRiskDateTime(member.joinedAt, null, locale)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}
