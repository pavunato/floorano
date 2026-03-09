'use client';

import { useRef, useEffect, useCallback } from 'react';
import { PlanNode, FloorNode } from '@/lib/dsl/types';
import { OverlapRegion } from '@/lib/dsl/validate';
import { SelectedElement, SourcePatch } from '@/lib/selection';
import { svgToMm } from '@/lib/renderer/layout-engine';
import FloorPlanSVG from './svg/FloorPlanSVG';
import InteractionOverlay from './svg/InteractionOverlay';
import { useI18n } from '@/lib/i18n';

interface Props {
  ast: PlanNode | null;
  activeFloor: number;
  overlaps?: OverlapRegion[];
  showRoomDimensions: boolean;
  textScale: number;
  exportSignal: { format: 'png' | 'svg'; id: number } | null;
  selection: SelectedElement | null;
  onSelect: (sel: SelectedElement | null) => void;
  onSourcePatch: (patch: SourcePatch) => void;
}

export default function Preview({ ast, activeFloor, overlaps = [], showRoomDimensions, textScale, exportSignal, selection, onSelect, onSourcePatch }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const safeFloorIndex = ast && activeFloor >= 0 && activeFloor < ast.floors.length ? activeFloor : 0;
  const isAllFloors = activeFloor === -1;

  // Handle export signals from toolbar
  useEffect(() => {
    if (!exportSignal || !ast || !containerRef.current) return;

    if (exportSignal.format === 'png') {
      handleExportPng();
    } else {
      handleExportSvg();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportSignal?.id]);

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

  // Hit-test click coordinates against rooms/spaces in a floor
  const handleFloorClick = useCallback((e: React.MouseEvent, floor: FloorNode, floorIndex: number) => {
    // Find the FloorPlanSVG's <svg> element inside this wrapper div
    const wrapper = e.currentTarget as HTMLElement;
    const svgEl = wrapper.querySelector('svg') as SVGSVGElement | null;
    if (!svgEl) return;

    const ctm = svgEl.getScreenCTM();
    if (!ctm) return;
    const inv = ctm.inverse();
    const svgX = e.clientX * inv.a + e.clientY * inv.c + inv.e;
    const svgY = e.clientX * inv.b + e.clientY * inv.d + inv.f;

    const PADDING = 30;
    const mmX = svgToMm(svgX - PADDING, ast.width) - floor.position.x;
    const mmY = svgToMm(svgY - PADDING, ast.width) - floor.position.y;

    // Check rooms/spaces in reverse order (topmost first)
    for (let i = floor.children.length - 1; i >= 0; i--) {
      const child = floor.children[i];
      if (child.type !== 'room' && child.type !== 'space') continue;
      const { position: pos, size } = child;
      if (mmX >= pos.x && mmX <= pos.x + size.width && mmY >= pos.y && mmY <= pos.y + size.height) {
        onSelect({
          type: child.type,
          floorIndex,
          childIndex: i,
          line: child.line,
          position: child.position,
          size: child.size,
          floorOrigin: floor.position,
        });
        return;
      }
    }

    // Clicked empty area — deselect
    onSelect(null);
  }, [ast, onSelect]);

  const handleExportSvg = () => {
    if (!containerRef.current) return;
    const svgEls = containerRef.current.querySelectorAll('svg');
    if (!svgEls.length) return;

    if (isAllFloors) {
      svgEls.forEach((svgEl, index) => {
        setTimeout(() => {
          const floor = ast.floors[index];
          const svgData = new XMLSerializer().serializeToString(svgEl);
          const blob = new Blob([svgData], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${ast.name || 'floor-plan'}-${floor.name || `floor-${index + 1}`}.svg`;
          a.click();
          URL.revokeObjectURL(url);
        }, index * 300);
      });
    } else {
      const svgEl = svgEls[0];
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ast.name || 'floor-plan'}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleExportPng = async () => {
    if (!containerRef.current) return;
    const svgEls = containerRef.current.querySelectorAll('svg');
    if (!svgEls.length) return;

    const exportSinglePng = async (svgEl: SVGSVGElement, filename: string) => {
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
        a.download = filename;
        a.click();
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    if (isAllFloors) {
      for (let i = 0; i < svgEls.length; i++) {
        const floor = ast.floors[i];
        const filename = `${ast.name || 'floor-plan'}-${floor.name || `floor-${i + 1}`}.png`;
        await exportSinglePng(svgEls[i], filename);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } else {
      await exportSinglePng(svgEls[0], `${ast.name || 'floor-plan'}.png`);
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#f5f0e8' }}>
      <div ref={containerRef} className="flex-1 overflow-auto p-4">
        <div className="space-y-6">
          {floorsToShow.map((floor, i) => {
            const floorIndex = isAllFloors ? i : safeFloorIndex;
            return (
              <div key={floorIndex} style={{ position: 'relative' }} onClick={(e) => handleFloorClick(e, floor, floorIndex)}>
                <FloorPlanSVG
                  plan={ast}
                  floor={floor}
                  floorIndex={floorIndex}
                  overlaps={overlaps.filter(o => o.floorIndex === floorIndex)}
                  showRoomDimensions={showRoomDimensions}
                  textScale={textScale}
                />
                <InteractionOverlay
                  plan={ast}
                  showRoomDimensions={showRoomDimensions}
                  selection={selection?.floorIndex === floorIndex ? selection : null}
                  onSelect={onSelect}
                  onSourcePatch={onSourcePatch}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
