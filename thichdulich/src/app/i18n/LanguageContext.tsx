"use client";

import { createContext, useContext, ReactNode } from 'react';
import { translations, Language, TranslationKey } from './translations';
import { cleanText } from '../utils/text';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language: Language = 'vi';

  const setLanguage = (_lang: Language) => {};

  const t = (key: TranslationKey): string => {
    return cleanText(translations[language][key]);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
