import { theme } from '@/lib/renderer/theme';

interface Props { x: number; y: number; w: number; h: number }

export default function ChairSymbol({ x, y, w, h }: Props) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={1} fill="none" stroke={theme.red} strokeWidth={1} />
    </g>
  );
}
