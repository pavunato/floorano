import { theme } from '@/lib/renderer/theme';

interface Props { x: number; y: number; w: number; h: number }

export default function DryerSymbol({ x, y, w, h }: Props) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={theme.accent2} strokeWidth={1} />
      <circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) * 0.3} fill="none" stroke={theme.accent2} strokeWidth={1} />
      <line x1={x + w * 0.3} y1={y + h * 0.25} x2={x + w * 0.7} y2={y + h * 0.25} stroke={theme.accent2} strokeWidth={0.8} />
    </g>
  );
}
