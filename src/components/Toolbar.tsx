'use client';

import { LayoutDirection } from './EditorLayout';
import { useI18n } from '@/lib/i18n';

interface Props {
  onAIPrompt: () => void;
  onLoadSample: () => void;
  planName?: string;
  layout: LayoutDirection;
  onToggleLayout: () => void;
}

export default function Toolbar({ onAIPrompt, onLoadSample, layout, onToggleLayout }: Props) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-b"
      style={{ backgroundColor: '#fdfaf4', borderColor: '#1a1614' }}
    >
      <div className="flex items-center gap-4">
        <h1
          className="text-lg tracking-tight"
          style={{ fontFamily: "'Playfair Display', serif", color: '#1a1614' }}
        >
          {t.appTitle}
        </h1>
        <span className="font-mono text-xs tracking-wider uppercase" style={{ color: '#5c5048' }}>
          FPDL
        </span>
      </div>

      <div className="flex items-center gap-2">
        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-xs font-mono rounded-sm border transition-colors hover:bg-gray-50"
          style={{ borderColor: '#d4cfc8', color: '#5c5048' }}
        >
          {t.syntaxDocs}
        </a>
        <button
          onClick={onToggleLayout}
          className="px-3 py-1.5 text-xs font-mono rounded-sm border transition-colors hover:bg-gray-50"
          style={{ borderColor: '#d4cfc8', color: '#5c5048' }}
          title={layout === 'horizontal' ? t.switchToVertical : t.switchToHorizontal}
        >
          {layout === 'horizontal' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="8" rx="1" />
              <rect x="3" y="13" width="18" height="8" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="8" height="18" rx="1" />
              <rect x="13" y="3" width="8" height="18" rx="1" />
            </svg>
          )}
        </button>
        <button
          onClick={onLoadSample}
          className="px-3 py-1.5 text-xs font-mono rounded-sm border transition-colors hover:bg-gray-50"
          style={{ borderColor: '#d4cfc8', color: '#5c5048' }}
        >
          {t.loadSample}
        </button>
        <div className="flex items-center rounded-sm border overflow-hidden" style={{ borderColor: '#d4cfc8' }}>
          <button
            onClick={() => setLocale('en')}
            className="px-2 py-1.5 text-xs font-mono"
            style={{ backgroundColor: locale === 'en' ? '#1a1614' : 'transparent', color: locale === 'en' ? '#fdfaf4' : '#5c5048' }}
          >
            EN
          </button>
          <button
            onClick={() => setLocale('vi')}
            className="px-2 py-1.5 text-xs font-mono border-l"
            style={{ borderColor: '#d4cfc8', backgroundColor: locale === 'vi' ? '#1a1614' : 'transparent', color: locale === 'vi' ? '#fdfaf4' : '#5c5048' }}
          >
            VI
          </button>
        </div>
        <button
          onClick={onAIPrompt}
          className="px-3 py-1.5 text-xs font-mono rounded-sm transition-colors flex items-center gap-1.5"
          style={{ backgroundColor: '#1a1614', color: '#fdfaf4' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          {t.aiGenerate}
        </button>
      </div>
    </div>
  );
}
