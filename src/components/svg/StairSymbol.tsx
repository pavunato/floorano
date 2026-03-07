'use client';

import { theme } from '@/lib/renderer/theme';
import { StairOrientation, StairStyle } from '@/lib/dsl/types';

interface Props {
  x: number;
  y: number;
  w: number;
  h: number;
  name?: string;
  stairStyle?: StairStyle;
  orientation?: StairOrientation;
  textScale?: number;
}

export default function StairSymbol({ x, y, w, h, name, stairStyle = 'straight', orientation = 'tb', textScale = 1 }: Props) {
  const label = name || 'STAIR';
  const drawW = orientation === 'lr' || orientation === 'rl' ? h : w;
  const drawH = orientation === 'lr' || orientation === 'rl' ? w : h;
  const fontSize = Math.min(drawW * 0.12, 8) * textScale;
  const strokeColor = '#999';
  const strokeW = 0.8;
  const transform = orientation === 'tb'
    ? `translate(${x} ${y})`
    : orientation === 'bt'
      ? `translate(${x + w} ${y + h}) rotate(180)`
      : orientation === 'lr'
        ? `translate(${x + w} ${y}) rotate(90)`
        : `translate(${x} ${y + h}) rotate(-90)`;

  return (
    <g transform={transform}>
      <rect x={0} y={0} width={drawW} height={drawH} fill={theme.stairFill} stroke={theme.ink} strokeWidth={1.5} />
      {stairStyle === 'straight' && <StraightSteps x={0} y={0} w={drawW} h={drawH} stroke={strokeColor} strokeWidth={strokeW} />}
      {stairStyle === 'l-shaped' && <LShapedSteps x={0} y={0} w={drawW} h={drawH} stroke={strokeColor} strokeWidth={strokeW} />}
      {stairStyle === 'u-shaped' && <UShapedSteps x={0} y={0} w={drawW} h={drawH} stroke={strokeColor} strokeWidth={strokeW} />}
      <text
        x={drawW / 2}
        y={drawH / 2 + 3}
        textAnchor="middle"
        fontFamily={theme.fontMono}
        fontSize={fontSize}
        fill={theme.inkLight}
      >
        {label}
      </text>
    </g>
  );
}

// Straight stair: horizontal lines across the full width
function StraightSteps({ x, y, w, h, stroke, strokeWidth }: StepProps) {
  const stepCount = Math.max(4, Math.floor(h / (w * 0.12)));
  const stepH = h / stepCount;
  const lines = [];
  for (let i = 1; i < stepCount; i++) {
    lines.push(
      <line key={i} x1={x} y1={y + i * stepH} x2={x + w} y2={y + i * stepH}
        stroke={stroke} strokeWidth={strokeWidth} />
    );
  }
  // Direction arrow
  const arrowY = y + 2;
  const arrowMid = x + w / 2;
  return (
    <>
      {lines}
      <polygon
        points={`${arrowMid - 3},${arrowY + 5} ${arrowMid},${arrowY} ${arrowMid + 3},${arrowY + 5}`}
        fill={stroke} opacity={0.6}
      />
    </>
  );
}

// L-shaped stair: steps go up then turn 90 degrees at landing
function LShapedSteps({ x, y, w, h, stroke, strokeWidth }: StepProps) {
  // Lower run: steps in the bottom portion (horizontal lines across full width)
  // Landing: square at the turn point
  // Upper run: steps in the upper-right portion (vertical lines)
  const landingFrac = 0.35; // landing sits at ~35% from top
  const landingY = y + h * landingFrac;
  const landingH = h * 0.12;
  const splitX = x + w * 0.45; // where the L turns

  const elements = [];

  // Lower run: horizontal steps from bottom up to landing
  const lowerH = h - (landingY - y) - landingH;
  const lowerSteps = Math.max(3, Math.floor(lowerH / (w * 0.15)));
  const lowerStepH = lowerH / lowerSteps;
  for (let i = 0; i <= lowerSteps; i++) {
    const ly = landingY + landingH + i * lowerStepH;
    elements.push(
      <line key={`l${i}`} x1={x} y1={ly} x2={splitX} y2={ly}
        stroke={stroke} strokeWidth={strokeWidth} />
    );
  }

  // Landing rectangle
  elements.push(
    <rect key="landing" x={x} y={landingY} width={splitX - x} height={landingH}
      fill="none" stroke={stroke} strokeWidth={strokeWidth} />
  );

  // Upper run: vertical steps from landing upward on the right side
  const upperH = landingY - y;
  const upperW = w - (splitX - x);
  const upperSteps = Math.max(3, Math.floor(upperH / (upperW * 0.15)));
  const upperStepH = upperH / upperSteps;
  for (let i = 0; i <= upperSteps; i++) {
    const uy = y + i * upperStepH;
    elements.push(
      <line key={`u${i}`} x1={splitX} y1={uy} x2={x + w} y2={uy}
        stroke={stroke} strokeWidth={strokeWidth} />
  );
  }

  // Vertical divider for the L shape
  elements.push(
    <line key="div" x1={splitX} y1={y} x2={splitX} y2={landingY + landingH}
      stroke={stroke} strokeWidth={strokeWidth} />
  );

  // Direction arrow (pointing up in upper run)
  const arrowX = splitX + upperW / 2;
  const arrowY2 = y + 2;
  elements.push(
    <polygon key="arrow"
      points={`${arrowX - 3},${arrowY2 + 5} ${arrowX},${arrowY2} ${arrowX + 3},${arrowY2 + 5}`}
      fill={stroke} opacity={0.6} />
  );

  return <>{elements}</>;
}

// U-shaped stair: two parallel runs connected by a landing
function UShapedSteps({ x, y, w, h, stroke, strokeWidth }: StepProps) {
  const halfW = w * 0.45;
  const gap = w * 0.1;
  const landingFrac = 0.15;
  const landingH = h * landingFrac;
  const landingY = y + h - landingH;
  const runH = landingY - y;

  const elements = [];

  // Left run: going down (steps from top to landing)
  const leftSteps = Math.max(4, Math.floor(runH / (halfW * 0.15)));
  const leftStepH = runH / leftSteps;
  for (let i = 0; i <= leftSteps; i++) {
    const ly = y + i * leftStepH;
    elements.push(
      <line key={`dl${i}`} x1={x} y1={ly} x2={x + halfW} y2={ly}
        stroke={stroke} strokeWidth={strokeWidth} />
    );
  }

  // Right run: going up (steps from landing to top)
  const rightX = x + halfW + gap;
  const rightSteps = Math.max(4, Math.floor(runH / (halfW * 0.15)));
  const rightStepH = runH / rightSteps;
  for (let i = 0; i <= rightSteps; i++) {
    const ry = y + i * rightStepH;
    elements.push(
      <line key={`ur${i}`} x1={rightX} y1={ry} x2={x + w} y2={ry}
        stroke={stroke} strokeWidth={strokeWidth} />
    );
  }

  // Landing at bottom connecting both runs
  elements.push(
    <rect key="landing" x={x} y={landingY} width={w} height={landingH}
      fill="none" stroke={stroke} strokeWidth={strokeWidth} />
  );

  // Center divider gap (vertical lines separating the two runs)
  elements.push(
    <line key="gapL" x1={x + halfW} y1={y} x2={x + halfW} y2={landingY}
      stroke={stroke} strokeWidth={strokeWidth} />
  );
  elements.push(
    <line key="gapR" x1={rightX} y1={y} x2={rightX} y2={landingY}
      stroke={stroke} strokeWidth={strokeWidth} />
  );

  // Direction arrows
  // Down arrow on left run
  const leftMid = x + halfW / 2;
  const downArrowY = landingY - 3;
  elements.push(
    <polygon key="arrowD"
      points={`${leftMid - 3},${downArrowY - 5} ${leftMid},${downArrowY} ${leftMid + 3},${downArrowY - 5}`}
      fill={stroke} opacity={0.6} />
  );
  // Up arrow on right run
  const rightMid = rightX + (x + w - rightX) / 2;
  const upArrowY = y + 2;
  elements.push(
    <polygon key="arrowU"
      points={`${rightMid - 3},${upArrowY + 5} ${rightMid},${upArrowY} ${rightMid + 3},${upArrowY + 5}`}
      fill={stroke} opacity={0.6} />
  );

  return <>{elements}</>;
}

interface StepProps {
  x: number;
  y: number;
  w: number;
  h: number;
  stroke: string;
  strokeWidth: number;
}
