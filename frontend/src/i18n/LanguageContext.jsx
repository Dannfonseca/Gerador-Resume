import { createContext, useContext, useState, useCallback } from 'react';
import ptBR from './locales/pt-BR';
import en from './locales/en';

const locales = { 'pt-BR': ptBR, en };

const LanguageContext = createContext(null);

/**
 * LanguageProvider — Wraps the app to provide i18n context.
 * Persists language choice in localStorage.
 */
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('ats-language') || 'pt-BR';
    } catch {
      return 'pt-BR';
    }
  });

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('ats-language', lang);
    } catch { /* ignore */ }
  }, []);

  const t = useCallback((path) => {
    const keys = path.split('.');
    let value = locales[language];
    for (const key of keys) {
      if (value === undefined || value === null) return path;
      value = value[key];
    }
    return value ?? path;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * useLanguage — Hook to access current language, setter, and translation function.
 * Usage: const { t, language, setLanguage } = useLanguage();
 *        t('upload.title') → "Gerador de Currículo ATS"
 */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
