import { theme } from '@/lib/renderer/theme';

interface Props { x: number; y: number; w: number; h: number }

export default function ToiletSymbol({ x, y, w, h }: Props) {
  const cx = x + w / 2;
  const bowlRy = h * 0.35;
  const bowlCy = y + h * 0.4;
  return (
    <g>
      <ellipse cx={cx} cy={bowlCy} rx={w * 0.4} ry={bowlRy} fill="none" stroke={theme.accent2} strokeWidth={1.2} />
      <rect x={cx - w * 0.4} y={bowlCy + bowlRy * 0.5} width={w * 0.8} height={h * 0.2} rx={2} fill="none" stroke={theme.accent2} strokeWidth={1.2} />
    </g>
  );
}
