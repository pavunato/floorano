'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
}

export default function AIPromptDialog({ isOpen, onClose, onGenerate, isLoading }: Props) {
  const [prompt, setPrompt] = useState('');
  const { t } = useI18n();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(26,22,20,0.5)' }}>
      <div className="w-full max-w-lg mx-4 rounded-sm shadow-lg" style={{ backgroundColor: '#fdfaf4', border: '1.5px solid #1a1614' }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: '#d4cfc8' }}>
          <h2 className="font-mono text-sm tracking-wider uppercase" style={{ color: '#1a1614' }}>
            {t.aiDialogTitle}
          </h2>
          <p className="font-sans text-xs mt-1" style={{ color: '#5c5048' }}>
            {t.aiDialogSubtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t.aiPlaceholder}
            className="w-full h-32 px-3 py-2 font-mono text-sm resize-none rounded-sm border focus:outline-none focus:ring-1"
            style={{
              backgroundColor: '#fdfaf4',
              borderColor: '#d4cfc8',
              color: '#1a1614',
            }}
            autoFocus
            disabled={isLoading}
          />

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono rounded-sm border transition-colors hover:bg-gray-50"
              style={{ borderColor: '#d4cfc8', color: '#5c5048' }}
              disabled={isLoading}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-mono rounded-sm transition-colors"
              style={{
                backgroundColor: isLoading ? '#5c5048' : '#1a1614',
                color: '#fdfaf4',
              }}
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? t.generating : t.generateFpdl}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
