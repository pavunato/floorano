import React from 'react';
import { theme } from '@/lib/renderer/theme';

interface Props { x: number; y: number; w: number; h: number }

export default function StoveSymbol({ x, y, w, h }: Props) {
  const cx1 = x + w * 0.25, cy1 = y + h * 0.3;
  const cx2 = x + w * 0.75, cy2 = y + h * 0.3;
  const cx3 = x + w * 0.25, cy3 = y + h * 0.7;
  const cx4 = x + w * 0.75, cy4 = y + h * 0.7;
  const r = Math.min(w, h) * 0.15;

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={theme.accent} strokeWidth={1} />
      <circle cx={cx1} cy={cy1} r={r} fill="none" stroke={theme.accent} strokeWidth={1} />
      <circle cx={cx2} cy={cy2} r={r} fill="none" stroke={theme.accent} strokeWidth={1} />
      <circle cx={cx3} cy={cy3} r={r} fill="none" stroke={theme.accent} strokeWidth={1} />
      <circle cx={cx4} cy={cy4} r={r} fill="none" stroke={theme.accent} strokeWidth={1} />
    </g>
  );
}
