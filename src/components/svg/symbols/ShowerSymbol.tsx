import { theme } from '@/lib/renderer/theme';

interface Props { x: number; y: number; w: number; h: number; patternId?: string }

export default function ShowerSymbol({ x, y, w, h, patternId }: Props) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={patternId ? `url(#${patternId})` : '#e8f4f8'} stroke={theme.accent2} strokeWidth={1} />
      <circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) * 0.2} fill="none" stroke={theme.accent2} strokeWidth={1} />
    </g>
  );
}
