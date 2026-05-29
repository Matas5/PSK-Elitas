/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useMemo, useState } from 'react';

const STORAGE_KEY = 'auth_user';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// keep localStorage in lockstep with the user *synchronously*. the api helpers
// read auth_user straight from localStorage, and react runs child effects
// (TeamContext's load) before this provider's effects, so a post-render effect
// would let those fetches see a stale/empty user when swapping logins.
function persistUser(nextUser) {
  if (nextUser) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const prevUserRef = useRef(user);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const authUrl = import.meta.env.VITE_AUTH_URL || 'http://localhost:3000';
        const response = await fetch(`${authUrl}/user`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            const googleUser = { ...data.user, provider: 'google' };
            persistUser(googleUser);
            setUser(googleUser);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  // Detect when user logs in (transitions from null/falsy to truthy)
  useEffect(() => {
    if (!prevUserRef.current && user) {
      setJustLoggedIn(true);
    }
    prevUserRef.current = user;
  }, [user]);

  const login = useCallback((nextUser) => {
    persistUser(nextUser);
    setUser(nextUser);
  }, []);
  const logout = useCallback(() => {
    persistUser(null);
    setUser(null);
  }, []);
  const clearJustLoggedIn = useCallback(() => setJustLoggedIn(false), []);

  const value = useMemo(
    () => ({
      user,
      provider: user?.provider ?? null,
      login,
      logout,
      isAuthenticated: Boolean(user),
      loading,
      justLoggedIn,
      clearJustLoggedIn,
    }),
    [user, login, logout, loading, justLoggedIn, clearJustLoggedIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
