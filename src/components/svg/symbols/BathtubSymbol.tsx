import { theme } from '@/lib/renderer/theme';

interface Props { x: number; y: number; w: number; h: number }

export default function BathtubSymbol({ x, y, w, h }: Props) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={Math.min(w, h) * 0.15} fill="#90c0d4" stroke={theme.accent2} strokeWidth={1.5} />
      <ellipse cx={x + w / 2} cy={y + h / 2} rx={w * 0.35} ry={h * 0.35} fill="#78b0c8" stroke={theme.accent2} strokeWidth={1} />
    </g>
  );
}
