'use client';

import { theme } from '@/lib/renderer/theme';
import { DoorStyle, DoorSwing, DoorWall } from '@/lib/dsl/types';

interface Props {
  x: number;
  y: number;
  w: number;       // opening width in SVG units
  wallThick: number; // wall thickness in SVG units
  wallSide: DoorWall;
  doorStyle: DoorStyle;
  swing: DoorSwing;
}

export default function DoorSymbol({ x, y, w, wallThick, wallSide, doorStyle, swing }: Props) {
  const isHorizontal = wallSide === 't' || wallSide === 'b';
  const gapInset = 1;

  // Cut the wall opening across the full wall thickness on the room side.
  const gapRect = wallSide === 't'
    ? { gx: x - gapInset, gy: y - gapInset, gw: w + gapInset * 2, gh: wallThick + gapInset * 2 }
    : wallSide === 'b'
      ? { gx: x - gapInset, gy: y - wallThick - gapInset, gw: w + gapInset * 2, gh: wallThick + gapInset * 2 }
      : wallSide === 'l'
        ? { gx: x - gapInset, gy: y - gapInset, gw: wallThick + gapInset * 2, gh: w + gapInset * 2 }
        : { gx: x - wallThick - gapInset, gy: y - gapInset, gw: wallThick + gapInset * 2, gh: w + gapInset * 2 };

  // Determine arc direction based on wall side
  // For top wall: arc swings down into room
  // For bottom wall: arc swings up into room
  // For left wall: arc swings right into room
  // For right wall: arc swings left into room

  return (
    <g>
      {/* Wall gap */}
      <rect
        x={gapRect.gx}
        y={gapRect.gy}
        width={gapRect.gw}
        height={gapRect.gh}
        fill={theme.bg}
        stroke="none"
      />

      {doorStyle === 'single' && renderSingleDoor(x, y, w, wallSide, swing)}
      {doorStyle === 'double' && renderDoubleDoor(x, y, w, wallSide, swing)}
      {doorStyle === 'triple' && renderMultiDoor(x, y, w, wallSide, swing, 3)}
      {doorStyle === 'quadruple' && renderMultiDoor(x, y, w, wallSide, swing, 4)}
      {doorStyle === 'quadfold' && renderQuadFoldDoor(x, y, w, wallSide, swing)}
      {doorStyle === 'sliding' && renderSlidingDoor(x, y, w, wallSide, isHorizontal)}
    </g>
  );
}

type Point = { x: number; y: number };

function buildArcPath(start: Point, end: Point, radius: number, sweep: 0 | 1) {
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${sweep} ${end.x} ${end.y}`;
}

function buildLinePath(start: Point, end: Point) {
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

function renderSingleDoor(x: number, y: number, w: number, wallSide: DoorWall, swing: DoorSwing) {
  let hinge: Point;
  let closed: Point;
  let open: Point;
  let sweep: 0 | 1;
  const outward = swing === 'out';

  if (wallSide === 't') {
    hinge = { x, y };
    closed = { x: x + w, y };
    open = { x, y: y + (outward ? -w : w) };
    sweep = outward ? 0 : 1;
  } else if (wallSide === 'b') {
    hinge = { x, y };
    closed = { x: x + w, y };
    open = { x, y: y + (outward ? w : -w) };
    sweep = outward ? 1 : 0;
  } else if (wallSide === 'l') {
    hinge = { x, y };
    closed = { x, y: y + w };
    open = { x: x + (outward ? -w : w), y };
    sweep = outward ? 1 : 0;
  } else {
    hinge = { x, y };
    closed = { x, y: y + w };
    open = { x: x + (outward ? w : -w), y };
    sweep = outward ? 0 : 1;
  }

  return (
    <g>
      <path d={buildLinePath(hinge, open)} stroke={theme.ink} strokeWidth={1} fill="none" />
      <path d={buildArcPath(closed, open, w, sweep)} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
    </g>
  );
}

function renderDoubleDoor(x: number, y: number, w: number, wallSide: DoorWall, swing: DoorSwing) {
  const half = w / 2;
  const outward = swing === 'out';

  if (wallSide === 't') {
    const leftHinge = { x, y };
    const leftClosed = { x: x + half, y };
    const leftOpen = { x, y: y + (outward ? -half : half) };
    const rightHinge = { x: x + w, y };
    const rightClosed = { x: x + half, y };
    const rightOpen = { x: x + w, y: y + (outward ? -half : half) };
    return (
      <g>
        <path d={buildLinePath(leftHinge, leftOpen)} stroke={theme.ink} strokeWidth={1} fill="none" />
        <path d={buildArcPath(leftClosed, leftOpen, half, outward ? 0 : 1)} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
        <path d={buildLinePath(rightHinge, rightOpen)} stroke={theme.ink} strokeWidth={1} fill="none" />
        <path d={buildArcPath(rightClosed, rightOpen, half, outward ? 1 : 0)} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
      </g>
    );
  } else if (wallSide === 'b') {
    const leftHinge = { x, y };
    const leftClosed = { x: x + half, y };
    const leftOpen = { x, y: y + (outward ? half : -half) };
    const rightHinge = { x: x + w, y };
    const rightClosed = { x: x + half, y };
    const rightOpen = { x: x + w, y: y + (outward ? half : -half) };
    return (
      <g>
        <path d={buildLinePath(leftHinge, leftOpen)} stroke={theme.ink} strokeWidth={1} fill="none" />
        <path d={buildArcPath(leftClosed, leftOpen, half, outward ? 1 : 0)} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
        <path d={buildLinePath(rightHinge, rightOpen)} stroke={theme.ink} strokeWidth={1} fill="none" />
        <path d={buildArcPath(rightClosed, rightOpen, half, outward ? 0 : 1)} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
      </g>
    );
  } else if (wallSide === 'l') {
    const topHinge = { x, y };
    const topClosed = { x, y: y + half };
    const topOpen = { x: x + (outward ? -half : half), y };
    const bottomHinge = { x, y: y + w };
    const bottomClosed = { x, y: y + half };
    const bottomOpen = { x: x + (outward ? -half : half), y: y + w };
    return (
      <g>
        <path d={buildLinePath(topHinge, topOpen)} stroke={theme.ink} strokeWidth={1} fill="none" />
        <path d={buildArcPath(topClosed, topOpen, half, outward ? 0 : 1)} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
        <path d={buildLinePath(bottomHinge, bottomOpen)} stroke={theme.ink} strokeWidth={1} fill="none" />
        <path d={buildArcPath(bottomClosed, bottomOpen, half, outward ? 1 : 0)} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
      </g>
    );
  } else {
    const topHinge = { x, y };
    const topClosed = { x, y: y + half };
    const topOpen = { x: x + (outward ? half : -half), y };
    const bottomHinge = { x, y: y + w };
    const bottomClosed = { x, y: y + half };
    const bottomOpen = { x: x + (outward ? half : -half), y: y + w };
    return (
      <g>
        <path d={buildLinePath(topHinge, topOpen)} stroke={theme.ink} strokeWidth={1} fill="none" />
        <path d={buildArcPath(topClosed, topOpen, half, outward ? 1 : 0)} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
        <path d={buildLinePath(bottomHinge, bottomOpen)} stroke={theme.ink} strokeWidth={1} fill="none" />
        <path d={buildArcPath(bottomClosed, bottomOpen, half, outward ? 0 : 1)} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
      </g>
    );
  }
}

function renderMultiDoor(x: number, y: number, w: number, wallSide: DoorWall, swing: DoorSwing, leafCount: number) {
  const leafSize = w / leafCount;
  const outward = swing === 'out';

  return (
    <g>
      {Array.from({ length: leafCount }).map((_, index) => {
        const offset = leafSize * index;
        if (wallSide === 't' || wallSide === 'b') {
          const hinge = { x: x + offset, y };
          const closed = { x: x + offset + leafSize, y };
          const open = { x: x + offset, y: y + ((wallSide === 't') !== outward ? leafSize : -leafSize) };
          const sweep: 0 | 1 = wallSide === 't'
            ? (outward ? 0 : 1)
            : (outward ? 1 : 0);
          return (
            <g key={`door-leaf-${index}`}>
              <path d={buildLinePath(hinge, open)} stroke={theme.ink} strokeWidth={1} fill="none" />
              <path d={buildArcPath(closed, open, leafSize, sweep)} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
            </g>
          );
        }

        const hinge = { x, y: y + offset };
        const closed = { x, y: y + offset + leafSize };
        const open = { x: x + ((wallSide === 'l') !== outward ? leafSize : -leafSize), y: y + offset };
        const sweep: 0 | 1 = wallSide === 'l'
          ? (outward ? 1 : 0)
          : (outward ? 0 : 1);
        return (
          <g key={`door-leaf-${index}`}>
            <path d={buildLinePath(hinge, open)} stroke={theme.ink} strokeWidth={1} fill="none" />
            <path d={buildArcPath(closed, open, leafSize, sweep)} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
          </g>
        );
      })}
    </g>
  );
}

function renderQuadFoldDoor(x: number, y: number, w: number, wallSide: DoorWall, swing: DoorSwing) {
  const leafSize = w / 4;
  const outward = swing === 'out';

  if (wallSide === 't' || wallSide === 'b') {
    const inward = wallSide === 't' ? !outward : outward;
    
    const leftOuterHinge = { x, y };
    const leftOuterClosed = { x: x + leafSize, y };
    const leftOuterOpen = { x: x, y: y + (wallSide === 't' ? (outward ? -leafSize : leafSize) : (outward ? leafSize : -leafSize)) };
    
    const leftFoldHinge = { x: x + leafSize, y };
    const leftFoldClosed = { x: x + leafSize * 2, y };
    const leftFoldOpen = { x: x + leafSize, y: y + (wallSide === 't' ? (inward ? -leafSize : leafSize) : (inward ? leafSize : -leafSize)) };
    const leftSweep: 0 | 1 = wallSide === 't' ? (inward ? 0 : 1) : (inward ? 1 : 0);
    
    const rightFoldHinge = { x: x + w - leafSize, y };
    const rightFoldClosed = { x: x + leafSize * 2, y };
    const rightFoldOpen = { x: x + w - leafSize, y: y + (wallSide === 't' ? (inward ? -leafSize : leafSize) : (inward ? leafSize : -leafSize)) };
    const rightSweep: 0 | 1 = wallSide === 't' ? (inward ? 1 : 0) : (inward ? 0 : 1);
    
    const rightOuterHinge = { x: x + w, y };
    const rightOuterClosed = { x: x + w - leafSize, y };
    const rightOuterOpen = { x: x + w, y: y + (wallSide === 't' ? (outward ? -leafSize : leafSize) : (outward ? leafSize : -leafSize)) };
    const rightOuterSweep: 0 | 1 = wallSide === 't' ? (outward ? 1 : 0) : (outward ? 0 : 1);
    
    return (
      <g>
        <path d={buildLinePath(leftOuterHinge, leftOuterOpen)} stroke={theme.ink} strokeWidth={1} fill="none" />
        <path d={buildArcPath(leftOuterClosed, leftOuterOpen, leafSize, wallSide === 't' ? (outward ? 0 : 1) : (outward ? 1 : 0))} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
        <path d={buildLinePath(leftFoldHinge, leftFoldOpen)} stroke={theme.ink} strokeWidth={1} fill="none" />
        <path d={buildArcPath(leftFoldClosed, leftFoldOpen, leafSize, leftSweep)} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
        <path d={buildLinePath(rightFoldHinge, rightFoldOpen)} stroke={theme.ink} strokeWidth={1} fill="none" />
        <path d={buildArcPath(rightFoldClosed, rightFoldOpen, leafSize, rightSweep)} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
        <path d={buildLinePath(rightOuterHinge, rightOuterOpen)} stroke={theme.ink} strokeWidth={1} fill="none" />
        <path d={buildArcPath(rightOuterClosed, rightOuterOpen, leafSize, rightOuterSweep)} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
      </g>
    );
  }

  const inward = wallSide === 'l' ? !outward : outward;
  
  const topOuterHinge = { x, y };
  const topOuterClosed = { x, y: y + leafSize };
  const topOuterOpen = { x: x + (wallSide === 'l' ? (outward ? -leafSize : leafSize) : (outward ? leafSize : -leafSize)), y };
  
  const topFoldHinge = { x, y: y + leafSize };
  const topFoldClosed = { x, y: y + leafSize * 2 };
  const topFoldOpen = { x: x + (wallSide === 'l' ? (inward ? -leafSize : leafSize) : (inward ? leafSize : -leafSize)), y: y + leafSize };
  const topSweep: 0 | 1 = wallSide === 'l' ? (inward ? 1 : 0) : (inward ? 0 : 1);
  
  const bottomFoldHinge = { x, y: y + w - leafSize };
  const bottomFoldClosed = { x, y: y + leafSize * 2 };
  const bottomFoldOpen = { x: x + (wallSide === 'l' ? (inward ? -leafSize : leafSize) : (inward ? leafSize : -leafSize)), y: y + w - leafSize };
  const bottomSweep: 0 | 1 = wallSide === 'l' ? (inward ? 0 : 1) : (inward ? 1 : 0);
  
  const bottomOuterHinge = { x, y: y + w };
  const bottomOuterClosed = { x, y: y + w - leafSize };
  const bottomOuterOpen = { x: x + (wallSide === 'l' ? (outward ? -leafSize : leafSize) : (outward ? leafSize : -leafSize)), y: y + w };
  const bottomOuterSweep: 0 | 1 = wallSide === 'l' ? (outward ? 0 : 1) : (outward ? 1 : 0);

  return (
    <g>
      <path d={buildLinePath(topOuterHinge, topOuterOpen)} stroke={theme.ink} strokeWidth={1} fill="none" />
      <path d={buildArcPath(topOuterClosed, topOuterOpen, leafSize, wallSide === 'l' ? (outward ? 1 : 0) : (outward ? 0 : 1))} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
      <path d={buildLinePath(topFoldHinge, topFoldOpen)} stroke={theme.ink} strokeWidth={1} fill="none" />
      <path d={buildArcPath(topFoldClosed, topFoldOpen, leafSize, topSweep)} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
      <path d={buildLinePath(bottomFoldHinge, bottomFoldOpen)} stroke={theme.ink} strokeWidth={1} fill="none" />
      <path d={buildArcPath(bottomFoldClosed, bottomFoldOpen, leafSize, bottomSweep)} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
      <path d={buildLinePath(bottomOuterHinge, bottomOuterOpen)} stroke={theme.ink} strokeWidth={1} fill="none" />
      <path d={buildArcPath(bottomOuterClosed, bottomOuterOpen, leafSize, bottomOuterSweep)} stroke={theme.ink} strokeWidth={1} fill="none" strokeDasharray="3,2" />
    </g>
  );
}

function renderSlidingDoor(
  x: number, y: number, w: number,
  wallSide: DoorWall, isHorizontal: boolean,
) {
  const offset = 3; // small offset from wall

  if (isHorizontal) {
    const dy = wallSide === 't' ? offset : -offset;
    return (
      <g>
        {/* Slide track (dashed) */}
        <line
          x1={x} y1={y + dy} x2={x + w} y2={y + dy}
          stroke={theme.ink} strokeWidth={1.5} strokeDasharray="4,2"
        />
        {/* Arrow showing slide direction */}
        <line
          x1={x + w * 0.3} y1={y + dy} x2={x + w * 0.7} y2={y + dy}
          stroke={theme.ink} strokeWidth={2}
        />
        <path
          d={`M ${x + w * 0.65} ${y + dy - 2} L ${x + w * 0.7} ${y + dy} L ${x + w * 0.65} ${y + dy + 2}`}
          stroke={theme.ink} strokeWidth={1} fill="none"
        />
      </g>
    );
  } else {
    const dx = wallSide === 'l' ? offset : -offset;
    return (
      <g>
        <line
          x1={x + dx} y1={y} x2={x + dx} y2={y + w}
          stroke={theme.ink} strokeWidth={1.5} strokeDasharray="4,2"
        />
        <line
          x1={x + dx} y1={y + w * 0.3} x2={x + dx} y2={y + w * 0.7}
          stroke={theme.ink} strokeWidth={2}
        />
        <path
          d={`M ${x + dx - 2} ${y + w * 0.65} L ${x + dx} ${y + w * 0.7} L ${x + dx + 2} ${y + w * 0.65}`}
          stroke={theme.ink} strokeWidth={1} fill="none"
        />
      </g>
    );
  }
}
