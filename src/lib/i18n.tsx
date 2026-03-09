'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Locale = 'en' | 'vi';

const dictionary = {
  en: {
    appTitle: 'Floor Plan Editor',
    syntaxDocs: 'Syntax Docs',
    switchToVertical: 'Switch to vertical layout',
    switchToHorizontal: 'Switch to horizontal layout',
    loadSample: 'Load Sample',
    aiGenerate: 'AI Generate',
    noValidPlan: 'No valid floor plan to display',
    writeOrGenerate: 'Write FPDL code or use AI to generate one',
    smallerText: 'Smaller text',
    biggerText: 'Bigger text',
    text: 'Text',
    measure: 'Measure',
    measureDisabled: 'Select a single floor to use Measure',
    measureEnabled: 'Show measurements for the current floor',
    export: 'Export',
    exportPng: 'PNG',
    exportSvg: 'SVG',
    exportSeparate: 'Separate files',
    exportCombined: 'Combined (all floors)',
    allFloors: 'ALL FLOORS',
    errors: 'error',
    warnings: 'warning',
    line: 'Line',
    aiDialogTitle: 'AI Floor Plan Generator',
    aiDialogSubtitle: 'Describe your floor plan in natural language',
    aiPlaceholder: 'e.g., 2 bedroom apartment, 8m x 10m, with kitchen, living room, and bathroom',
    cancel: 'Cancel',
    generating: 'Generating...',
    generateFpdl: 'Generate FPDL',
    aiErrorPrefix: 'AI Error',
    aiConnectError: 'Failed to connect to AI service',
    file: 'File',
    view: 'View',
    new: 'New',
  },
  vi: {
    appTitle: 'Trinh Sua Mat Bang',
    syntaxDocs: 'Tai Lieu Cu Phap',
    switchToVertical: 'Chuyen sang bo cuc doc',
    switchToHorizontal: 'Chuyen sang bo cuc ngang',
    loadSample: 'Tai Mau',
    aiGenerate: 'Tao Bang AI',
    noValidPlan: 'Khong co mat bang hop le de hien thi',
    writeOrGenerate: 'Nhap ma FPDL hoac dung AI de tao',
    smallerText: 'Giam co chu',
    biggerText: 'Tang co chu',
    text: 'Chu',
    measure: 'Do Kich Thuoc',
    measureDisabled: 'Hay chon mot tang de do kich thuoc',
    measureEnabled: 'Hien kich thuoc cua tang hien tai',
    export: 'Xuat',
    exportPng: 'PNG',
    exportSvg: 'SVG',
    exportSeparate: 'Tung file rieng',
    exportCombined: 'Gop tat ca cac tang',
    allFloors: 'TAT CA CAC TANG',
    errors: 'loi',
    warnings: 'canh bao',
    line: 'Dong',
    aiDialogTitle: 'Trinh Tao Mat Bang AI',
    aiDialogSubtitle: 'Mo ta mat bang bang ngon ngu tu nhien',
    aiPlaceholder: 'vi du: can ho 2 phong ngu, 8m x 10m, co bep, phong khach va phong tam',
    cancel: 'Huy',
    generating: 'Dang tao...',
    generateFpdl: 'Tao FPDL',
    aiErrorPrefix: 'Loi AI',
    aiConnectError: 'Khong the ket noi den dich vu AI',
    file: 'Tap Tin',
    view: 'Xem',
    new: 'Moi',
  },
} as const;

type Messages = Record<keyof typeof dictionary.en, string>;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('fpdl-locale');
    if (saved === 'en' || saved === 'vi') {
      setLocaleState(saved);
    }
  }, []);
  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem('fpdl-locale', l);
    setLocaleState(l);
  }, []);
  const value = useMemo(() => ({ locale, setLocale, t: dictionary[locale] }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
