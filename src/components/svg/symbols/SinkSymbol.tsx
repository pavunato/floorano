import React from 'react';
import { theme } from '@/lib/renderer/theme';

interface Props { x: number; y: number; w: number; h: number }

export default function SinkSymbol({ x, y, w, h }: Props) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={theme.accent} strokeWidth={1} />
      <circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) * 0.3} fill="none" stroke={theme.accent} strokeWidth={1} />
    </g>
  );
}
