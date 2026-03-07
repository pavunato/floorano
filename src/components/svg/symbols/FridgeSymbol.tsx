import { theme } from '@/lib/renderer/theme';

interface Props { x: number; y: number; w: number; h: number }

export default function FridgeSymbol({ x, y, w, h }: Props) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#f0e8e8" stroke={theme.accent} strokeWidth={1} />
      <line x1={x + 2} y1={y + h * 0.4} x2={x + w - 2} y2={y + h * 0.4} stroke={theme.accent} strokeWidth={0.8} />
      <text x={x + w / 2} y={y + h * 0.7} textAnchor="middle" fontFamily={theme.fontMono} fontSize={Math.min(w, h) * 0.25} fill={theme.accent}>FRIDGE</text>
    </g>
  );
}
