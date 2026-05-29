import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// date-format locale (lt/en), persisted to localStorage. a toggle for now, not a dropdown.

const STORAGE_KEY = 'app_locale';
const SUPPORTED = ['lt', 'en'];
const DEFAULT_LOCALE = 'lt';

const LocaleContext = createContext(null);

function readStoredLocale() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.includes(raw) ? raw : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(() => readStoredLocale());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next) => {
    if (SUPPORTED.includes(next)) setLocaleState(next);
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, supported: SUPPORTED }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale used outside of LocaleProvider');
  }
  return context;
}
