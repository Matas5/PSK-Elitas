/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createTeam as createTeamApi, joinTeam as joinTeamApi, listTeams } from '../api/teamsApi';
import { useAuth } from '../auth/AuthContext';

const STORAGE_KEY = 'active_team_id';
const TeamContext = createContext(null);

function readStoredTeamId() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function TeamProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [teams, setTeams] = useState([]);
  const [activeTeamId, setActiveTeamId] = useState(() => readStoredTeamId());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setStoredActiveTeam = useCallback((teamId) => {
    setActiveTeamId(teamId || '');
    if (teamId) {
      window.localStorage.setItem(STORAGE_KEY, teamId);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const refreshTeams = useCallback(async () => {
    if (!isAuthenticated) {
      setTeams([]);
      setStoredActiveTeam('');
      return [];
    }

    setLoading(true);
    setError(null);
    try {
      const data = await listTeams();
      setTeams(data);
      const stored = readStoredTeamId();
      if (stored && data.some((team) => team.id === stored)) {
        setStoredActiveTeam(stored);
      } else if (data.length > 0) {
        setStoredActiveTeam(data[0].id);
      } else if (stored) {
        setStoredActiveTeam('');
      }
      return data;
    } catch (err) {
      setError(err.message || 'Failed to load teams.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, setStoredActiveTeam]);

  useEffect(() => {
    if (!user) {
      setTeams([]);
      setError(null);
      setStoredActiveTeam('');
      return;
    }
    refreshTeams().catch(() => {});
  }, [refreshTeams, setStoredActiveTeam, user]);

  const createTeam = useCallback(async (name) => {
    const team = await createTeamApi({ name });
    setTeams((current) => [...current.filter((item) => item.id !== team.id), team]);
    setStoredActiveTeam(team.id);
    return team;
  }, [setStoredActiveTeam]);

  const joinTeam = useCallback(async (inviteCode) => {
    const team = await joinTeamApi({ inviteCode });
    setTeams((current) => [...current.filter((item) => item.id !== team.id), team]);
    setStoredActiveTeam(team.id);
    return team;
  }, [setStoredActiveTeam]);

  const activeTeam = useMemo(
    () => teams.find((team) => team.id === activeTeamId) || null,
    [activeTeamId, teams],
  );

  const value = useMemo(() => ({
    teams,
    activeTeam,
    activeTeamId,
    loading,
    error,
    refreshTeams,
    selectTeam: setStoredActiveTeam,
    createTeam,
    joinTeam,
  }), [activeTeam, activeTeamId, createTeam, error, joinTeam, loading, refreshTeams, setStoredActiveTeam, teams]);

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return ctx;
}
