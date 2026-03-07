'use client';

import { theme } from '@/lib/renderer/theme';

interface Props {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  vertical?: boolean;
  textScale?: number;
  labelPosition?: 'above' | 'below';
  onLabelMouseEnter?: () => void;
  onLabelMouseLeave?: () => void;
}

export default function DimensionLine({
  x1,
  y1,
  x2,
  y2,
  label,
  vertical,
  textScale = 1,
  labelPosition = 'below',
  onLabelMouseEnter,
  onLabelMouseLeave,
}: Props) {
  const tickSize = 5;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={theme.ink} strokeWidth={0.8} />
      {vertical ? (
        <>
          <line x1={x1 - tickSize} y1={y1} x2={x1 + tickSize} y2={y1} stroke={theme.ink} strokeWidth={0.8} />
          <line x1={x2 - tickSize} y1={y2} x2={x2 + tickSize} y2={y2} stroke={theme.ink} strokeWidth={0.8} />
          <text
            x={midX - 2}
            y={midY}
            textAnchor="middle"
            fontFamily={theme.fontMono}
            fontSize={8 * textScale}
            fill={theme.ink}
            transform={`rotate(-90,${midX - 2},${midY})`}
            onMouseEnter={onLabelMouseEnter}
            onMouseLeave={onLabelMouseLeave}
            style={{ cursor: 'default' }}
          >
            {label}
          </text>
        </>
      ) : (
        <>
          <line x1={x1} y1={y1 - tickSize} x2={x1} y2={y1 + tickSize} stroke={theme.ink} strokeWidth={0.8} />
          <line x1={x2} y1={y2 - tickSize} x2={x2} y2={y2 + tickSize} stroke={theme.ink} strokeWidth={0.8} />
          <text
            x={midX}
            y={midY + (labelPosition === 'above' ? -8 : 13)}
            textAnchor="middle"
            fontFamily={theme.fontMono}
            fontSize={8 * textScale}
            fill={theme.ink}
            onMouseEnter={onLabelMouseEnter}
            onMouseLeave={onLabelMouseLeave}
            style={{ cursor: 'default' }}
          >
            {label}
          </text>
        </>
      )}
    </g>
  );
}
