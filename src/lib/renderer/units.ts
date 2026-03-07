export function formatCentimeters(mm: number) {
  return `${(mm / 10).toLocaleString()} cm`;
}

export function formatCentimeterPair(widthMm: number, heightMm: number) {
  return `${widthMm / 10}×${heightMm / 10} cm`;
}

export function formatMeters(mm: number) {
  return `${(mm / 1000).toFixed(mm % 1000 === 0 ? 0 : 2)} m`;
}

export function formatMeterPair(widthMm: number, heightMm: number) {
  return `${formatMeters(widthMm)} × ${formatMeters(heightMm)}`;
}

export function formatSquareMeters(areaMm2: number) {
  return `${(areaMm2 / 1_000_000).toFixed(2)} m²`;
}
