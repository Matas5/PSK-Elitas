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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const prevUserRef = useRef(user);

  // Discover the active auth provider from the backend, then (if Google)
  // restore the session via the external auth server's /user endpoint.
  useEffect(() => {
    const bootstrap = async () => {
      let activeProvider = 'google';
      try {
        const cfg = await fetch('/api/auth/config');
        if (cfg.ok) {
          const data = await cfg.json();
          if (data?.provider) activeProvider = data.provider;
        }
      } catch (error) {
        console.error('Failed to fetch /api/auth/config, defaulting to google:', error);
      }
      setProvider(activeProvider);

      if (activeProvider !== 'google') {
        setLoading(false);
        return;
      }
      try {
        const authUrl = import.meta.env.VITE_AUTH_URL || 'http://localhost:3000';
        const response = await fetch(`${authUrl}/user`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser({ ...data.user, provider: 'google' });
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

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = useCallback((nextUser) => setUser(nextUser), []);
  const logout = useCallback(() => setUser(null), []);
  const clearJustLoggedIn = useCallback(() => setJustLoggedIn(false), []);

  const value = useMemo(
    () => ({
      user,
      provider,
      login,
      logout,
      isAuthenticated: Boolean(user),
      loading,
      justLoggedIn,
      clearJustLoggedIn,
    }),
    [user, provider, login, logout, loading, justLoggedIn, clearJustLoggedIn],
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
