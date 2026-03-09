'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { PlanNode } from '@/lib/dsl/types';
import { SelectedElement, DragState, DragMode, SourcePatch } from '@/lib/selection';
import { computeViewBox, toSvgCoords, toSvgSize, svgToMm } from '@/lib/renderer/layout-engine';
import { snapToGrid } from '@/lib/dsl/patch-source';

interface Props {
  plan: PlanNode;
  showRoomDimensions: boolean;
  selection: SelectedElement | null;
  onSelect: (sel: SelectedElement | null) => void;
  onSourcePatch: (patch: SourcePatch) => void;
}

const HANDLE_SIZE = 6;
const MIN_SIZE = 200; // mm

type HandleId = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r';

const HANDLE_CURSORS: Record<HandleId, string> = {
  tl: 'nwse-resize', tr: 'nesw-resize', bl: 'nesw-resize', br: 'nwse-resize',
  t: 'ns-resize', b: 'ns-resize', l: 'ew-resize', r: 'ew-resize',
};

function getHandlePositions(x: number, y: number, w: number, h: number): Record<HandleId, { cx: number; cy: number }> {
  return {
    tl: { cx: x, cy: y },
    tr: { cx: x + w, cy: y },
    bl: { cx: x, cy: y + h },
    br: { cx: x + w, cy: y + h },
    t: { cx: x + w / 2, cy: y },
    b: { cx: x + w / 2, cy: y + h },
    l: { cx: x, cy: y + h / 2 },
    r: { cx: x + w, cy: y + h / 2 },
  };
}

export default function InteractionOverlay({
  plan, showRoomDimensions, selection, onSelect, onSourcePatch,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const dragPreviewRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const vb = computeViewBox(plan, showRoomDimensions);

  const clientToSvg = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const inv = ctm.inverse();
    return {
      x: clientX * inv.a + clientY * inv.c + inv.e,
      y: clientX * inv.b + clientY * inv.d + inv.f,
    };
  }, []);

  const startDrag = useCallback((mode: DragMode, clientX: number, clientY: number) => {
    if (!selection) return;
    const svgPt = clientToSvg(clientX, clientY);
    if (!svgPt) return;

    const ds: DragState = {
      mode,
      startSvgX: svgPt.x,
      startSvgY: svgPt.y,
      startPosition: { ...selection.position },
      startSize: { ...selection.size },
    };
    setDragState(ds);
    dragStateRef.current = ds;
    setDragPreview(null);
    dragPreviewRef.current = null;
  }, [selection, clientToSvg]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragStateRef.current;
    if (!ds || !selection) return;

    const svgPt = clientToSvg(e.clientX, e.clientY);
    if (!svgPt) return;

    const dxSvg = svgPt.x - ds.startSvgX;
    const dySvg = svgPt.y - ds.startSvgY;
    const dxMm = svgToMm(dxSvg, plan.width);
    const dyMm = svgToMm(dySvg, plan.width);

    let newX = ds.startPosition.x;
    let newY = ds.startPosition.y;
    let newW = ds.startSize.width;
    let newH = ds.startSize.height;

    if (ds.mode === 'move') {
      newX = snapToGrid(ds.startPosition.x + dxMm);
      newY = snapToGrid(ds.startPosition.y + dyMm);
    } else {
      if (ds.mode.includes('l')) {
        const rawX = ds.startPosition.x + dxMm;
        newX = snapToGrid(rawX);
        newW = ds.startSize.width + (ds.startPosition.x - newX);
        if (newW < MIN_SIZE) { newW = MIN_SIZE; newX = ds.startPosition.x + ds.startSize.width - MIN_SIZE; }
      }
      if (ds.mode.includes('r')) {
        newW = snapToGrid(ds.startSize.width + dxMm);
        if (newW < MIN_SIZE) newW = MIN_SIZE;
      }
      if (ds.mode.includes('t') && ds.mode !== 'resize-tr') {
        const rawY = ds.startPosition.y + dyMm;
        newY = snapToGrid(rawY);
        newH = ds.startSize.height + (ds.startPosition.y - newY);
        if (newH < MIN_SIZE) { newH = MIN_SIZE; newY = ds.startPosition.y + ds.startSize.height - MIN_SIZE; }
      } else if (ds.mode === 'resize-tr') {
        const rawY = ds.startPosition.y + dyMm;
        newY = snapToGrid(rawY);
        newH = ds.startSize.height + (ds.startPosition.y - newY);
        if (newH < MIN_SIZE) { newH = MIN_SIZE; newY = ds.startPosition.y + ds.startSize.height - MIN_SIZE; }
        newW = snapToGrid(ds.startSize.width + dxMm);
        if (newW < MIN_SIZE) newW = MIN_SIZE;
      }
      if (ds.mode === 'resize-b' || ds.mode === 'resize-bl' || ds.mode === 'resize-br') {
        newH = snapToGrid(ds.startSize.height + dyMm);
        if (newH < MIN_SIZE) newH = MIN_SIZE;
      }
    }

    const preview = { x: newX, y: newY, w: newW, h: newH };
    setDragPreview(preview);
    dragPreviewRef.current = preview;
  }, [selection, clientToSvg, plan.width]);

  const handlePointerUp = useCallback(() => {
    const ds = dragStateRef.current;
    const preview = dragPreviewRef.current;
    if (ds && preview && selection) {
      const patch: SourcePatch = { line: selection.line };
      if (ds.mode === 'move') {
        patch.position = { x: preview.x, y: preview.y };
      } else {
        patch.position = { x: preview.x, y: preview.y };
        patch.size = { width: preview.w, height: preview.h };
      }
      onSourcePatch(patch);
    }
    setDragState(null);
    dragStateRef.current = null;
    setDragPreview(null);
    dragPreviewRef.current = null;
  }, [selection, onSourcePatch]);

  // Escape key to deselect
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSelect(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSelect]);

  // Compute display rect for selection (either drag preview or current selection)
  const selRect = selection ? (() => {
    const pos = dragPreview
      ? { x: dragPreview.x, y: dragPreview.y }
      : selection.position;
    const size = dragPreview
      ? { width: dragPreview.w, height: dragPreview.h }
      : selection.size;

    const { sx, sy } = toSvgCoords(
      selection.floorOrigin.x + pos.x,
      selection.floorOrigin.y + pos.y,
      plan.width,
    );
    const { sw, sh } = toSvgSize(size.width, size.height, plan.width);
    return { x: sx, y: sy, w: sw, h: sh };
  })() : null;

  // The overlay SVG is pointer-events:none by default so all hover events
  // pass through to FloorPlanSVG underneath. Only the selected room's
  // move rect and resize handles have pointer-events enabled.
  // Room selection is detected via click on the wrapper div (see Preview.tsx).

  return (
    <svg
      ref={svgRef}
      viewBox={`${vb.x} ${vb.y} ${vb.width} ${vb.height}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: dragState ? 'auto' : 'none',
        cursor: dragState ? (dragState.mode === 'move' ? 'grabbing' : 'crosshair') : undefined,
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Selection highlight + drag/resize handles */}
      {selection && selRect && (
        <g>
          {/* Highlight border (non-interactive) */}
          <rect
            x={selRect.x}
            y={selRect.y}
            width={selRect.w}
            height={selRect.h}
            fill="rgba(59,130,246,0.08)"
            stroke="#3b82f6"
            strokeWidth={1.5}
            strokeDasharray="4,2"
            pointerEvents="none"
          />

          {/* Move handle — covers the selected room for drag-to-move */}
          <rect
            x={selRect.x}
            y={selRect.y}
            width={selRect.w}
            height={selRect.h}
            fill="transparent"
            stroke="none"
            style={{ cursor: 'move', pointerEvents: 'all' }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              (e.target as Element).setPointerCapture(e.pointerId);
              startDrag('move', e.clientX, e.clientY);
            }}
          />

          {/* 8 resize handles */}
          {(Object.entries(getHandlePositions(selRect.x, selRect.y, selRect.w, selRect.h)) as [HandleId, { cx: number; cy: number }][]).map(
            ([id, { cx, cy }]) => (
              <rect
                key={`handle-${id}`}
                x={cx - HANDLE_SIZE / 2}
                y={cy - HANDLE_SIZE / 2}
                width={HANDLE_SIZE}
                height={HANDLE_SIZE}
                fill="white"
                stroke="#3b82f6"
                strokeWidth={1}
                style={{ cursor: HANDLE_CURSORS[id], pointerEvents: 'all' }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  (e.target as Element).setPointerCapture(e.pointerId);
                  startDrag(`resize-${id}` as DragMode, e.clientX, e.clientY);
                }}
              />
            ),
          )}
        </g>
      )}
    </svg>
  );
}
