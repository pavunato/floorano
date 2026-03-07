import { theme } from '@/lib/renderer/theme';

interface Props { x: number; y: number; w: number; h: number }

export default function BedSymbol({ x, y, w, h }: Props) {
  const pillowH = h * 0.15;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} fill="#f0e0c8" stroke={theme.accent} strokeWidth={1.5} />
      <rect x={x} y={y} width={w} height={pillowH} rx={2} fill="#d4b896" stroke={theme.accent} strokeWidth={1} />
      <text x={x + w / 2} y={y + h * 0.65} textAnchor="middle" fontFamily={theme.fontMono} fontSize={Math.min(w * 0.12, 7)} fill={theme.inkLight}>
        {(w > 10 && h > 10) ? `${(w / (940 / 20000) / 1000).toFixed(1)}×${(h / (940 / 20000) / 1000).toFixed(1)}m` : ''}
      </text>
    </g>
  );
}
