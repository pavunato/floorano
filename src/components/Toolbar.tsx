'use client';

import { useState, useRef, useEffect } from 'react';
import { LayoutDirection } from './EditorLayout';
import { useI18n } from '@/lib/i18n';

interface Props {
  onAIPrompt: () => void;
  onNew: () => void;
  onLoadSample: () => void;
  onExport: (format: 'png' | 'svg') => void;
  planName?: string;
  layout: LayoutDirection;
  onToggleLayout: () => void;
  showRoomDimensions: boolean;
  onToggleMeasure: () => void;
  textScale: number;
  onTextScaleChange: (delta: number) => void;
}

function DropdownMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-2.5 py-1 text-xs font-mono rounded-sm transition-colors hover:bg-[#e8dfd0]"
        style={{ color: '#1a1614' }}
      >
        {label}
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-0.5 py-1 rounded-sm border shadow-lg z-50"
          style={{ backgroundColor: '#fdfaf4', borderColor: '#d4cfc8', minWidth: '180px' }}
        >
          <div onClick={() => setOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, onClick, shortcut }: { label: string; onClick: () => void; shortcut?: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-1.5 text-xs font-mono text-left hover:bg-[#e8dfd0] flex items-center justify-between"
      style={{ color: '#1a1614' }}
    >
      <span>{label}</span>
      {shortcut && <span style={{ color: '#8b6f5e' }}>{shortcut}</span>}
    </button>
  );
}

function MenuDivider() {
  return <div className="my-1 border-t" style={{ borderColor: '#d4cfc8' }} />;
}

function MenuLabel({ label }: { label: string }) {
  return (
    <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider" style={{ color: '#8b6f5e' }}>
      {label}
    </div>
  );
}

export default function Toolbar({
  onAIPrompt,
  onNew,
  onLoadSample,
  onExport,
  planName,
  layout,
  onToggleLayout,
  showRoomDimensions,
  onToggleMeasure,
  textScale,
  onTextScaleChange,
}: Props) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className="flex items-center justify-between px-4 py-2 border-b"
      style={{ backgroundColor: '#fdfaf4', borderColor: '#1a1614' }}
    >
      {/* Left: title + menus */}
      <div className="flex items-center gap-1">
        <h1
          className="text-lg tracking-tight mr-1"
          style={{ fontFamily: "'Playfair Display', serif", color: '#1a1614' }}
        >
          {t.appTitle}
        </h1>
        <span className="font-mono text-xs tracking-wider uppercase mr-2" style={{ color: '#5c5048' }}>
          FPDL
        </span>

        {/* File Menu */}
        <DropdownMenu label={t.file}>
          <MenuItem label={t.new} onClick={onNew} />
          <MenuItem label={t.loadSample} onClick={onLoadSample} />
          <MenuDivider />
          <MenuLabel label={t.export} />
          <MenuItem label={t.exportPng} onClick={() => onExport('png')} />
          <MenuItem label={t.exportSvg} onClick={() => onExport('svg')} />
        </DropdownMenu>

        {/* View Menu */}
        <DropdownMenu label={t.view}>
          <MenuLabel label={t.text} />
          <div className="flex items-center px-3 py-1 gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onTextScaleChange(-1); }}
              className="px-2 py-0.5 text-xs font-mono rounded-sm border hover:bg-[#e8dfd0]"
              style={{ borderColor: '#d4cfc8', color: '#1a1614' }}
            >
              -
            </button>
            <span className="text-xs font-mono" style={{ color: '#5c5048' }}>
              {Math.round(textScale * 100)}%
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onTextScaleChange(1); }}
              className="px-2 py-0.5 text-xs font-mono rounded-sm border hover:bg-[#e8dfd0]"
              style={{ borderColor: '#d4cfc8', color: '#1a1614' }}
            >
              +
            </button>
          </div>
          <MenuDivider />
          <button
            onClick={onToggleMeasure}
            className="w-full px-3 py-1.5 text-xs font-mono text-left hover:bg-[#e8dfd0] flex items-center gap-2"
            style={{ color: '#1a1614' }}
          >
            <span
              className="inline-block w-3 h-3 rounded-sm border"
              style={{
                borderColor: '#1a1614',
                backgroundColor: showRoomDimensions ? '#1a1614' : 'transparent',
              }}
            />
            {t.measure}
          </button>
          <MenuDivider />
          <button
            onClick={onToggleLayout}
            className="w-full px-3 py-1.5 text-xs font-mono text-left hover:bg-[#e8dfd0] flex items-center gap-2"
            style={{ color: '#1a1614' }}
          >
            {layout === 'horizontal' ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="8" rx="1" />
                <rect x="3" y="13" width="18" height="8" rx="1" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="8" height="18" rx="1" />
                <rect x="13" y="3" width="8" height="18" rx="1" />
              </svg>
            )}
            {layout === 'horizontal' ? t.switchToVertical : t.switchToHorizontal}
          </button>
          <MenuDivider />
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-3 py-1.5 text-xs font-mono text-left hover:bg-[#e8dfd0]"
            style={{ color: '#1a1614' }}
          >
            {t.syntaxDocs}
          </a>
        </DropdownMenu>
      </div>

      {/* Center: plan name */}
      <div className="absolute left-1/2 -translate-x-1/2">
        {planName && (
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: '#5c5048' }}>
            {planName}
          </span>
        )}
      </div>

      {/* Right: language + AI */}
      <div className="flex items-center gap-2">
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
