'use client';

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {
  translations,
  type Language,
  type TranslationKey,
} from '@/lib/i18n/translations';

const LANG_KEY = 'taaluf_lang';

type TranslateFn = (
  key: TranslationKey,
  vars?: Record<string, string | number>
) => string;

type LanguageContextType = {
  lang: Language;
  dir: 'rtl' | 'ltr';
  t: TranslateFn;
  toggleLanguage: () => void;
  setLanguage: (l: Language) => void;
};

function applyDocumentLang(lang: Language) {
  if (typeof document === 'undefined') return;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
  document.documentElement.style.direction = dir;
  document.body?.setAttribute('dir', dir);
}

function interpolate(
  template: string,
  vars?: Record<string, string | number>
) {
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  );
}

function translate(lang: Language, key: TranslationKey, vars?: Record<string, string | number>) {
  const table = translations[lang] || translations.ar;
  const raw = table[key] || translations.ar[key] || String(key);
  return interpolate(raw, vars);
}

function readStoredLang(): Language {
  if (typeof window === 'undefined') return 'ar';
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ar',
  dir: 'rtl',
  t: (key, vars) => translate('ar', key, vars),
  toggleLanguage: () => undefined,
  setLanguage: () => undefined,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('ar');

  useLayoutEffect(() => {
    const next = readStoredLang();
    setLangState(next);
    applyDocumentLang(next);
  }, []);

  useEffect(() => {
    applyDocumentLang(lang);
  }, [lang]);

  const setLanguage = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(LANG_KEY, newLang);
    } catch {
      /* ignore */
    }
    applyDocumentLang(newLang);
  };

  const value = useMemo<LanguageContextType>(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    return {
      lang,
      dir,
      t: (key, vars) => translate(lang, key, vars),
      toggleLanguage: () => setLanguage(lang === 'ar' ? 'en' : 'ar'),
      setLanguage,
    };
  }, [lang]);

  return (
    <LanguageContext.Provider value={value}>
      <div
        dir={value.dir}
        lang={value.lang}
        className={value.dir === 'rtl' ? 'text-right' : 'text-left'}
      >
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageToggleBtn({
  className = '',
}: {
  className?: string;
}) {
  const { t, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={t('switchLanguage')}
      className={`inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3.5 py-1.5 text-xs font-bold text-[#2E7D8E] shadow-sm backdrop-blur-xl transition-all hover:scale-105 hover:bg-white hover:text-amber-600 active:scale-95 print:hidden ${className}`}
    >
      <span className="text-sm">🌐</span>
      <span>{t('changeLang')}</span>
    </button>
  );
}
