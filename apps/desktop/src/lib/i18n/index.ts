// Minimal i18n: language context + `t()` hook with {placeholder} substitution.
// No external dependency — keeps the bundle small and lets TypeScript enforce
// that every language file exports exactly the keys defined in `en.ts`.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { en, type MessageKey, type Messages } from "./en.js";
import { tr } from "./tr.js";
import { bg } from "./bg.js";
import { hr } from "./hr.js";
import { cs } from "./cs.js";
import { da } from "./da.js";
import { nl } from "./nl.js";
import { et } from "./et.js";
import { fi } from "./fi.js";
import { fr } from "./fr.js";
import { de } from "./de.js";
import { el } from "./el.js";
import { hu } from "./hu.js";
import { ga } from "./ga.js";
import { it } from "./it.js";
import { lv } from "./lv.js";
import { lt } from "./lt.js";
import { mt } from "./mt.js";
import { pl } from "./pl.js";
import { pt } from "./pt.js";
import { ro } from "./ro.js";
import { sk } from "./sk.js";
import { sl } from "./sl.js";
import { es } from "./es.js";
import { sv } from "./sv.js";
import { no } from "./no.js";
import { is } from "./is.js";
import { sq } from "./sq.js";
import { sr } from "./sr.js";
import { bs } from "./bs.js";
import { mk } from "./mk.js";
import { uk } from "./uk.js";

export interface LanguageDef {
  code: string;
  label: string;
  nativeLabel: string;
}

// Languages are registered here. Until a language file is added, its entry
// lives below with `messages: null` and falls back to English at runtime.
// Step A ships English + Turkish; Step E adds the remaining 30.
export const LANGUAGES: LanguageDef[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe" },
  { code: "bg", label: "Bulgarian", nativeLabel: "Български" },
  { code: "hr", label: "Croatian", nativeLabel: "Hrvatski" },
  { code: "cs", label: "Czech", nativeLabel: "Čeština" },
  { code: "da", label: "Danish", nativeLabel: "Dansk" },
  { code: "nl", label: "Dutch", nativeLabel: "Nederlands" },
  { code: "et", label: "Estonian", nativeLabel: "Eesti" },
  { code: "fi", label: "Finnish", nativeLabel: "Suomi" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "el", label: "Greek", nativeLabel: "Ελληνικά" },
  { code: "hu", label: "Hungarian", nativeLabel: "Magyar" },
  { code: "ga", label: "Irish", nativeLabel: "Gaeilge" },
  { code: "it", label: "Italian", nativeLabel: "Italiano" },
  { code: "lv", label: "Latvian", nativeLabel: "Latviešu" },
  { code: "lt", label: "Lithuanian", nativeLabel: "Lietuvių" },
  { code: "mt", label: "Maltese", nativeLabel: "Malti" },
  { code: "pl", label: "Polish", nativeLabel: "Polski" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português" },
  { code: "ro", label: "Romanian", nativeLabel: "Română" },
  { code: "sk", label: "Slovak", nativeLabel: "Slovenčina" },
  { code: "sl", label: "Slovenian", nativeLabel: "Slovenščina" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "sv", label: "Swedish", nativeLabel: "Svenska" },
  { code: "no", label: "Norwegian", nativeLabel: "Norsk" },
  { code: "is", label: "Icelandic", nativeLabel: "Íslenska" },
  { code: "sq", label: "Albanian", nativeLabel: "Shqip" },
  { code: "sr", label: "Serbian", nativeLabel: "Српски" },
  { code: "bs", label: "Bosnian", nativeLabel: "Bosanski" },
  { code: "mk", label: "Macedonian", nativeLabel: "Македонски" },
  { code: "uk", label: "Ukrainian", nativeLabel: "Українська" },
];

const MESSAGES: Record<string, Messages> = {
  en, tr, bg, hr, cs, da, nl, et, fi, fr, de, el, hu, ga, it,
  lv, lt, mt, pl, pt, ro, sk, sl, es, sv, no, is, sq, sr, bs, mk, uk,
};

const STORAGE_KEY = "akarpass.language";
const DEFAULT_LANG = "en";

function loadStoredLang(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && LANGUAGES.some((l) => l.code === v)) return v;
  } catch { /* localStorage unavailable */ }
  return DEFAULT_LANG;
}

type TranslateFn = (key: MessageKey, params?: Record<string, string | number>) => string;

interface LanguageCtx {
  lang: string;
  setLang: (code: string) => void;
  t: TranslateFn;
}

const Ctx = createContext<LanguageCtx | null>(null);

function translate(lang: string, key: MessageKey, params?: Record<string, string | number>): string {
  const table = MESSAGES[lang] ?? MESSAGES[DEFAULT_LANG]!;
  let value: string = (table[key] ?? MESSAGES[DEFAULT_LANG]![key] ?? key) as string;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.split(`{${k}}`).join(String(v));
    }
  }
  return value;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<string>(() => loadStoredLang());

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((code: string) => {
    if (LANGUAGES.some((l) => l.code === code)) setLangState(code);
  }, []);

  const t = useCallback<TranslateFn>(
    (key, params) => translate(lang, key, params),
    [lang],
  );

  const value = useMemo<LanguageCtx>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return React.createElement(Ctx.Provider, { value }, children);
}

export function useT(): TranslateFn {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useT must be used within LanguageProvider");
  return ctx.t;
}

export function useLanguage(): { lang: string; setLang: (code: string) => void } {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return { lang: ctx.lang, setLang: ctx.setLang };
}
