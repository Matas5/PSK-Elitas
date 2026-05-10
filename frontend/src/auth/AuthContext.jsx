import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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
  const [loading, setLoading] = useState(true);

  // Fetch user data from auth server on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const authUrl = import.meta.env.VITE_AUTH_URL || "http://localhost:3000";
        const response = await fetch(`${authUrl}/user`, { credentials: "include" });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = useCallback((nextUser) => setUser(nextUser), []);
  const logout = useCallback(() => setUser(null), []);

  const value = useMemo(
    () => ({ user, login, logout, isAuthenticated: Boolean(user), loading }),
    [user, login, logout, loading],
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
