import { theme } from '@/lib/renderer/theme';

interface Props { x: number; y: number; w: number; h: number }

export default function DeskSymbol({ x, y, w, h }: Props) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={theme.room1} stroke={theme.accent} strokeWidth={1} />
      <text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fontFamily={theme.fontMono} fontSize={Math.min(w * 0.15, 7)} fill={theme.inkLight}>DESK</text>
    </g>
  );
}
