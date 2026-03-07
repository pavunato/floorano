interface Props { x: number; y: number; w: number; h: number }

export default function PlantSymbol({ x, y, w, h }: Props) {
  const r = Math.min(w, h) / 2;
  return (
    <g>
      <circle cx={x + w / 2} cy={y + h / 2} r={r} fill="#a8c8a0" stroke="#2d6a4f" strokeWidth={1} />
    </g>
  );
}
