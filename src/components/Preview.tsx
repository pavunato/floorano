'use client';

import { useEffect, useRef, useState } from 'react';
import { PlanNode } from '@/lib/dsl/types';
import { OverlapRegion } from '@/lib/dsl/validate';
import FloorPlanSVG from './svg/FloorPlanSVG';
import { useI18n } from '@/lib/i18n';

interface Props {
  ast: PlanNode | null;
  activeFloor: number;
  overlaps?: OverlapRegion[];
}

export default function Preview({ ast, activeFloor, overlaps = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showRoomDimensions, setShowRoomDimensions] = useState(false);
  const [textScale, setTextScale] = useState(1);
  const { t } = useI18n();
  const safeFloorIndex = ast && activeFloor >= 0 && activeFloor < ast.floors.length ? activeFloor : 0;
  const isAllFloors = activeFloor === -1;

  useEffect(() => {
    if (isAllFloors && showRoomDimensions) {
      setShowRoomDimensions(false);
    }
  }, [isAllFloors, showRoomDimensions]);

  if (!ast) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: '#f5f0e8' }}>
        <div className="text-center">
          <p className="font-mono text-sm" style={{ color: '#5c5048' }}>{t.noValidPlan}</p>
          <p className="font-mono text-xs mt-2" style={{ color: '#8b6f5e' }}>{t.writeOrGenerate}</p>
        </div>
      </div>
    );
  }

  const floorsToShow = isAllFloors ? ast.floors : [ast.floors[safeFloorIndex]];

  const handleExportSvg = () => {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ast.name || 'floor-plan'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPng = async () => {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector('svg');
    if (!svgEl) return;

    const clonedSvg = svgEl.cloneNode(true) as SVGSVGElement;
    const bbox = svgEl.viewBox.baseVal;
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clonedSvg.setAttribute('width', `${bbox.width}`);
    clonedSvg.setAttribute('height', `${bbox.height}`);

    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    try {
      const image = new Image();
      image.decoding = 'async';

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Failed to load SVG for PNG export'));
        image.src = url;
      });

      const scale = Math.max(4, window.devicePixelRatio || 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(bbox.width * scale);
      canvas.height = Math.ceil(bbox.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.scale(scale, scale);
      ctx.fillStyle = '#f5f0e8';
      ctx.fillRect(0, 0, bbox.width, bbox.height);
      ctx.drawImage(image, 0, 0, bbox.width, bbox.height);

      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `${ast.name || 'floor-plan'}.png`;
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#f5f0e8' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: '#d4cfc8' }}>
        <span className="font-mono text-xs uppercase tracking-wider" style={{ color: '#5c5048' }}>
          {ast.name}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-sm border overflow-hidden" style={{ borderColor: '#d4cfc8' }}>
            <button
              onClick={() => setTextScale(s => Math.max(0.75, Number((s - 0.1).toFixed(2))))}
              className="px-2 py-1 text-xs font-mono border-r"
              style={{ borderColor: '#d4cfc8', color: '#5c5048' }}
              title={t.smallerText}
            >
              -
            </button>
            <span className="px-2 py-1 text-[10px] font-mono" style={{ color: '#5c5048' }}>
              {t.text}
            </span>
            <button
              onClick={() => setTextScale(s => Math.min(1.75, Number((s + 0.1).toFixed(2))))}
              className="px-2 py-1 text-xs font-mono border-l"
              style={{ borderColor: '#d4cfc8', color: '#5c5048' }}
              title={t.biggerText}
            >
              +
            </button>
          </div>
          <button
            onClick={() => {
              if (!isAllFloors) {
                setShowRoomDimensions(!showRoomDimensions);
              }
            }}
            className="px-3 py-1 text-xs font-mono rounded-sm border transition-colors"
            style={{
              borderColor: showRoomDimensions ? '#1a1614' : '#d4cfc8',
              color: isAllFloors ? '#b0a39a' : showRoomDimensions ? '#1a1614' : '#5c5048',
              backgroundColor: showRoomDimensions ? '#e8dfd0' : 'transparent',
              cursor: isAllFloors ? 'not-allowed' : 'pointer',
            }}
            title={isAllFloors ? t.measureDisabled : t.measureEnabled}
          >
            {t.measure}
          </button>
          <button
            onClick={handleExportPng}
            className="px-3 py-1 text-xs font-mono rounded-sm border transition-colors hover:bg-gray-100"
            style={{ borderColor: '#d4cfc8', color: '#5c5048' }}
          >
            {t.exportPng}
          </button>
          <button
            onClick={handleExportSvg}
            className="px-3 py-1 text-xs font-mono rounded-sm border transition-colors hover:bg-gray-100"
            style={{ borderColor: '#d4cfc8', color: '#5c5048' }}
          >
            {t.exportSvg}
          </button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-auto p-4">
        <div className="space-y-6">
          {floorsToShow.map((floor, i) => {
            const floorIndex = isAllFloors ? i : safeFloorIndex;
            return (
              <div key={floorIndex}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-mono text-xs tracking-widest uppercase" style={{ color: '#5c5048' }}>
                    {floor.label || floor.name}
                  </h3>
                </div>
                <FloorPlanSVG
                  plan={ast}
                  floor={floor}
                  floorIndex={floorIndex}
                  overlaps={overlaps.filter(o => o.floorIndex === floorIndex)}
                  showRoomDimensions={showRoomDimensions}
                  textScale={textScale}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
