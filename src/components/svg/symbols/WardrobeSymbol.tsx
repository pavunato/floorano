import { theme } from '@/lib/renderer/theme';

interface Props { x: number; y: number; w: number; h: number }

export default function WardrobeSymbol({ x, y, w, h }: Props) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#e0d8c8" stroke={theme.accent} strokeWidth={1} />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={theme.accent} strokeWidth={0.8} />
    </g>
  );
}
