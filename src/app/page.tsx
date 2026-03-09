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
  const [planName, setPlanName] = useState<string>('');
  const [showRoomDimensions, setShowRoomDimensions] = useState(false);
  const [textScale, setTextScale] = useState(1);

  useEffect(() => {
    const savedCode = localStorage.getItem('fpdl-source');
    if (savedCode) {
      setSource(savedCode);
    }
    const saved = localStorage.getItem('fpdl-layout');
    if (saved === 'horizontal' || saved === 'vertical') {
      setLayout(saved);
    }
    setShowRoomDimensions(localStorage.getItem('fpdl-measure') === 'true');
    const savedScale = parseFloat(localStorage.getItem('fpdl-textScale') || '');
    if (!isNaN(savedScale) && savedScale >= 0.75 && savedScale <= 1.75) {
      setTextScale(savedScale);
    }
  }, []);

  const handleSourceChange = useCallback((val: string) => {
    setSource(val);
    localStorage.setItem('fpdl-source', val);
  }, []);
  const { t } = useI18n();

  const handleNew = useCallback(() => {
    handleSourceChange('');
  }, [handleSourceChange]);

  const handleLoadSample = useCallback(() => {
    handleSourceChange(TOWNHOUSE_SAMPLE);
  }, [handleSourceChange]);

  const handleToggleLayout = useCallback(() => {
    setLayout((prev) => {
      const next = prev === 'horizontal' ? 'vertical' : 'horizontal';
      localStorage.setItem('fpdl-layout', next);
      return next;
    });
  }, []);

  const handleToggleMeasure = useCallback(() => {
    setShowRoomDimensions((prev) => {
      const next = !prev;
      localStorage.setItem('fpdl-measure', String(next));
      return next;
    });
  }, []);

  const handleTextScaleChange = useCallback((delta: number) => {
    setTextScale((s) => {
      const v = delta > 0
        ? Math.min(1.75, Number((s + 0.1).toFixed(2)))
        : Math.max(0.75, Number((s - 0.1).toFixed(2)));
      localStorage.setItem('fpdl-textScale', String(v));
      return v;
    });
  }, []);

  // Export signal: Preview watches this and triggers export
  const [exportSignal, setExportSignal] = useState<{ format: 'png' | 'svg'; id: number } | null>(null);

  const handleExport = useCallback((format: 'png' | 'svg') => {
    setExportSignal({ format, id: Date.now() });
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
        handleSourceChange(data.fpdl);
        setShowAIDialog(false);
      }
    } catch {
      alert(t.aiConnectError);
    } finally {
      setAiLoading(false);
    }
  }, [t, handleSourceChange]);

  return (
    <div className="h-screen flex flex-col">
      <Toolbar
        onAIPrompt={() => setShowAIDialog(true)}
        onNew={handleNew}
        onLoadSample={handleLoadSample}
        onExport={handleExport}
        layout={layout}
        onToggleLayout={handleToggleLayout}
        planName={planName}
        showRoomDimensions={showRoomDimensions}
        onToggleMeasure={handleToggleMeasure}
        textScale={textScale}
        onTextScaleChange={handleTextScaleChange}
      />
      <div className="flex-1 overflow-hidden">
        <EditorLayout
          value={source}
          onChange={handleSourceChange}
          layout={layout}
          showRoomDimensions={showRoomDimensions}
          textScale={textScale}
          exportSignal={exportSignal}
          onPlanNameChange={setPlanName}
        />
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
