'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import CodeEditor from './CodeEditor';
import Preview from './Preview';
import FloorTabs from './FloorTabs';
import ErrorPanel from './ErrorPanel';
import { useParser } from '@/hooks/useParser';

export type LayoutDirection = 'horizontal' | 'vertical';

interface Props {
  value: string;
  onChange: (value: string) => void;
  layout: LayoutDirection;
}

export default function EditorLayout({ value, onChange, layout }: Props) {
  const { ast, errors, warnings, overlaps } = useParser(value);
  const [activeFloor, setActiveFloor] = useState(0);

  useEffect(() => {
    const saved = parseInt(localStorage.getItem('fpdl-activeFloor') || '0', 10);
    if (!isNaN(saved) && saved > 0) {
      setActiveFloor(saved);
    }
  }, []);
  const [splitPos, setSplitPos] = useState(45); // percentage

  useEffect(() => {
    const saved = parseFloat(localStorage.getItem('fpdl-splitPos') || '');
    if (!isNaN(saved) && saved >= 20 && saved <= 80) {
      setSplitPos(saved);
    }
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const latestSplit = useRef(splitPos);

  useEffect(() => {
    if (!ast || ast.floors.length === 0) {
      if (activeFloor !== 0) {
        setActiveFloor(0);
      }
      return;
    }

    const nextFloor = Math.min(activeFloor, ast.floors.length - 1);
    if (nextFloor !== activeFloor) {
      setActiveFloor(nextFloor);
    }
  }, [ast, activeFloor]);

  useEffect(() => {
    localStorage.setItem('fpdl-activeFloor', String(activeFloor));
  }, [activeFloor]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const isHorizontal = layout === 'horizontal';
    const startPos = isHorizontal ? e.clientX : e.clientY;
    const startSplit = splitPos;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const currentPos = isHorizontal ? e.clientX : e.clientY;
      const containerSize = isHorizontal ? rect.width : rect.height;
      const diff = currentPos - startPos;
      const newSplit = Math.min(Math.max(20, startSplit + (diff / containerSize) * 100), 80);
      setSplitPos(newSplit);
      latestSplit.current = newSplit;
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      localStorage.setItem('fpdl-splitPos', String(latestSplit.current));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [splitPos, layout]);

  const isHorizontal = layout === 'horizontal';

  return (
    <div
      ref={containerRef}
      className={`flex h-full ${isHorizontal ? 'flex-row' : 'flex-col'}`}
      style={{ backgroundColor: '#f5f0e8' }}
    >
      {/* Editor pane (left in horizontal, bottom in vertical) */}
      {isHorizontal ? (
        <>
          <div className="flex flex-col" style={{ width: `${splitPos}%` }}>
            <div className="flex-1 overflow-hidden">
              <CodeEditor value={value} onChange={onChange} errors={errors} warnings={warnings} activeFloorIndex={activeFloor} />
            </div>
            <ErrorPanel errors={errors} warnings={warnings} />
          </div>

          <div
            className="w-1 cursor-col-resize hover:bg-blue-300 transition-colors flex-shrink-0"
            style={{ backgroundColor: '#d4cfc8' }}
            onMouseDown={handleMouseDown}
          />

          <div className="flex-1 flex flex-col overflow-hidden">
            {ast && ast.floors.length > 0 && (
              <FloorTabs
                floors={ast.floors}
                activeIndex={activeFloor}
                onSelect={setActiveFloor}
              />
            )}
            <div className="flex-1 overflow-hidden">
              <Preview ast={ast} activeFloor={activeFloor} overlaps={overlaps} />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Preview on top */}
          <div className="flex flex-col overflow-hidden" style={{ height: `${splitPos}%` }}>
            {ast && ast.floors.length > 0 && (
              <FloorTabs
                floors={ast.floors}
                activeIndex={activeFloor}
                onSelect={setActiveFloor}
              />
            )}
            <div className="flex-1 overflow-hidden">
              <Preview ast={ast} activeFloor={activeFloor} overlaps={overlaps} />
            </div>
          </div>

          <div
            className="h-1 cursor-row-resize hover:bg-blue-300 transition-colors flex-shrink-0"
            style={{ backgroundColor: '#d4cfc8' }}
            onMouseDown={handleMouseDown}
          />

          {/* Editor on bottom, error panel to the right */}
          <div className="flex-1 flex flex-row overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <CodeEditor value={value} onChange={onChange} errors={errors} warnings={warnings} activeFloorIndex={activeFloor} />
            </div>
            <ErrorPanel errors={errors} warnings={warnings} direction="vertical" />
          </div>
        </>
      )}
    </div>
  );
}
