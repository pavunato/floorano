'use client';

import { useState, useCallback, useEffect } from 'react';
import Toolbar from '@/components/Toolbar';
import EditorLayout from '@/components/EditorLayout';
import AIPromptDialog from '@/components/AIPromptDialog';
import { TOWNHOUSE_SAMPLE } from '@/lib/samples/townhouse';
import { LayoutDirection } from '@/components/EditorLayout';
import { I18nProvider, useI18n } from '@/lib/i18n';

function HomeContent() {
  const [source, setSource] = useState(TOWNHOUSE_SAMPLE);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [layout, setLayout] = useState<LayoutDirection>('horizontal');

  useEffect(() => {
    const saved = localStorage.getItem('fpdl-layout');
    if (saved === 'horizontal' || saved === 'vertical') {
      setLayout(saved);
    }
  }, []);
  const { t } = useI18n();

  const handleLoadSample = useCallback(() => {
    setSource(TOWNHOUSE_SAMPLE);
  }, []);

  const handleToggleLayout = useCallback(() => {
    setLayout((prev) => {
      const next = prev === 'horizontal' ? 'vertical' : 'horizontal';
      localStorage.setItem('fpdl-layout', next);
      return next;
    });
  }, []);

  const handleAIGenerate = useCallback(async (prompt: string) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.error) {
        alert(`${t.aiErrorPrefix}: ${data.error}`);
      } else if (data.fpdl) {
        setSource(data.fpdl);
        setShowAIDialog(false);
      }
    } catch {
      alert(t.aiConnectError);
    } finally {
      setAiLoading(false);
    }
  }, [t]);

  return (
    <div className="h-screen flex flex-col">
      <Toolbar
        onAIPrompt={() => setShowAIDialog(true)}
        onLoadSample={handleLoadSample}
        layout={layout}
        onToggleLayout={handleToggleLayout}
      />
      <div className="flex-1 overflow-hidden">
        <EditorLayout value={source} onChange={setSource} layout={layout} />
      </div>
      <AIPromptDialog
        isOpen={showAIDialog}
        onClose={() => setShowAIDialog(false)}
        onGenerate={handleAIGenerate}
        isLoading={aiLoading}
      />
    </div>
  );
}

export default function Home() {
  return (
    <I18nProvider>
      <HomeContent />
    </I18nProvider>
  );
}
