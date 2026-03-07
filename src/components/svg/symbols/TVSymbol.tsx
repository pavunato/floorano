import { theme } from '@/lib/renderer/theme';

interface Props { x: number; y: number; w: number; h: number }

export default function TVSymbol({ x, y, w, h }: Props) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#333" stroke={theme.ink} strokeWidth={1} rx={2} />
      <text x={x + w / 2} y={y + h * 0.7} textAnchor="middle" fontFamily={theme.fontMono} fontSize={Math.min(h * 0.6, 7)} fill="#fff">TV</text>
    </g>
  );
}
