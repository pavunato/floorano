import { theme } from '@/lib/renderer/theme';

interface Props { x: number; y: number; w: number; h: number }

export default function TableSymbol({ x, y, w, h }: Props) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} fill="none" stroke={theme.accent} strokeWidth={1.5} />
    </g>
  );
}
