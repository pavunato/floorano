import { theme } from '@/lib/renderer/theme';

interface Props { x: number; y: number; w: number; h: number }

export default function SofaSymbol({ x, y, w, h }: Props) {
  const backH = h * 0.3;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={5} fill="#c8d0e0" stroke="#5c6a8b" strokeWidth={1.5} />
      <rect x={x} y={y} width={w} height={backH} rx={3} fill="#b0bcd0" stroke="#5c6a8b" strokeWidth={1} />
      <rect x={x} y={y + h} width={w * 0.38} height={h * 0.4} rx={3} fill="#c8d0e0" stroke="#5c6a8b" strokeWidth={1} />
      <rect x={x + w * 0.62} y={y + h} width={w * 0.38} height={h * 0.4} rx={3} fill="#c8d0e0" stroke="#5c6a8b" strokeWidth={1} />
    </g>
  );
}
