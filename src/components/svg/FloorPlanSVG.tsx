'use client';

import { useState } from 'react';
import { FloorNode, PlanNode, RoomNode, SpaceNode, StairNode, Position, Size } from '@/lib/dsl/types';
import { OverlapRegion } from '@/lib/dsl/validate';
import { theme } from '@/lib/renderer/theme';
import { computeViewBox, toSvgCoords, toSvgSize, mmToSvg } from '@/lib/renderer/layout-engine';
import { formatMeters, formatMeterPair, formatSquareMeters } from '@/lib/renderer/units';
import RoomRect from './RoomRect';
import StairSymbol from './StairSymbol';
import DimensionLine from './DimensionLine';
import { HoverCardData } from './hover';

interface Props {
  plan: PlanNode;
  floor: FloorNode;
  floorIndex: number;
  overlaps?: OverlapRegion[];
  showRoomDimensions?: boolean;
  textScale?: number;
}

// A measurable block (room, stair, or column)
interface MeasurableBlock {
  name?: string;
  position: Position;
  size: Size;
}

interface DimensionSpan {
  start: number;
  end: number;
  label: string;
  row: number;
}

interface DimensionHover {
  axis: 'x' | 'y';
  start: number;
  end: number;
  row: number;
}

function toBlocks(children: (RoomNode | SpaceNode | StairNode)[]): MeasurableBlock[] {
  return children.map(c => ({
    name: c.name,
    position: c.position,
    size: c.size,
  }));
}

function getOutsideFloorRegions(plan: PlanNode, floor: FloorNode) {
  const fx = floor.position.x;
  const fy = floor.position.y;
  const fw = floor.size.width;
  const fh = floor.size.height;

  return [
    { x: 0, y: 0, width: plan.width, height: Math.max(0, fy) },
    { x: 0, y: fy, width: Math.max(0, fx), height: Math.max(0, fh) },
    { x: fx + fw, y: fy, width: Math.max(0, plan.width - (fx + fw)), height: Math.max(0, fh) },
    { x: 0, y: fy + fh, width: plan.width, height: Math.max(0, plan.depth - (fy + fh)) },
  ].filter(region => region.width > 0 && region.height > 0);
}

// Collect unique sorted edge positions along an axis
function getEdges(blocks: MeasurableBlock[], axis: 'x' | 'y'): number[] {
  const edges = new Set<number>();
  for (const b of blocks) {
    if (axis === 'x') {
      edges.add(b.position.x);
      edges.add(b.position.x + b.size.width);
    } else {
      edges.add(b.position.y);
      edges.add(b.position.y + b.size.height);
    }
  }
  return Array.from(edges).sort((a, b) => a - b);
}

// Check if any block covers a given segment
function hasBlockSpanning(
  blocks: MeasurableBlock[],
  segStart: number,
  segEnd: number,
  axis: 'x' | 'y',
): boolean {
  return blocks.some(b => {
    const bStart = axis === 'x' ? b.position.x : b.position.y;
    const bEnd = axis === 'x' ? b.position.x + b.size.width : b.position.y + b.size.height;
    return bStart <= segStart && bEnd >= segEnd;
  });
}

function assignRows(items: { start: number; end: number; label: string }[]): DimensionSpan[] {
  const rows: number[] = [];

  return [...items]
    .sort((a, b) => a.start - b.start || a.end - b.end)
    .map(item => {
      let row = 0;
      while (rows[row] !== undefined && item.start < rows[row]) {
        row++;
      }
      rows[row] = item.end;
      return { ...item, row };
    });
}

function getBottomAnchor(blocks: MeasurableBlock[], edge: number, fallback: number) {
  const values = blocks
    .filter(block => block.position.x === edge || block.position.x + block.size.width === edge)
    .map(block => block.position.y + block.size.height);
  return values.length > 0 ? Math.max(...values) : fallback;
}

function getRightAnchor(blocks: MeasurableBlock[], edge: number, fallback: number) {
  const values = blocks
    .filter(block => block.position.y === edge || block.position.y + block.size.height === edge)
    .map(block => block.position.x + block.size.width);
  return values.length > 0 ? Math.max(...values) : fallback;
}

export default function FloorPlanSVG({ plan, floor, floorIndex, overlaps = [], showRoomDimensions = false, textScale = 1 }: Props) {
  const [hovered, setHovered] = useState<HoverCardData | null>(null);
  const [hoveredDimension, setHoveredDimension] = useState<DimensionHover | null>(null);
  const vb = computeViewBox(plan, showRoomDimensions);
  const padding = 30;
  const { sw: planW, sh: planH } = toSvgSize(plan.width, plan.depth, plan.width);
  const { sx: floorX, sy: floorY } = toSvgCoords(floor.position.x, floor.position.y, plan.width);
  const { sw: floorW, sh: floorH } = toSvgSize(floor.size.width, floor.size.height, plan.width);
  const outsideFloorRegions = getOutsideFloorRegions(plan, floor);

  const widthLabel = `${floor.size.width.toLocaleString()} mm`;
  const depthLabel = `${floor.size.height.toLocaleString()} mm`;

  // All measurable blocks: rooms + stairs
  const blocks = showRoomDimensions ? toBlocks(floor.children) : [];

  // Compute dimension rows for bottom (horizontal) and right (vertical)
  const dimRowGap = 8;
  const dimRowHeight = 20;

  // Get unique x and y edges from all blocks
  const xEdges = showRoomDimensions ? getEdges(blocks, 'x') : [];
  const yEdges = showRoomDimensions ? getEdges(blocks, 'y') : [];

  // Row 1 segments: each pair of adjacent edges
  const xSegments = xEdges.slice(0, -1).map((start, i) => ({ start, end: xEdges[i + 1], width: xEdges[i + 1] - start }));
  const ySegments = yEdges.slice(0, -1).map((start, i) => ({ start, end: yEdges[i + 1], height: yEdges[i + 1] - start }));

  // Row 1 segment keys for dedup checking
  const xSegmentKeys = new Set(xSegments.map(s => `${s.start}-${s.end}`));
  const ySegmentKeys = new Set(ySegments.map(s => `${s.start}-${s.start + s.height}`));

  // Row 2: per-block spans, only if they span more than one segment (deduplicated)
  const xBlockSpans = showRoomDimensions ? Array.from(
    new Map(blocks.map(b => {
      const key = `${b.position.x}-${b.position.x + b.size.width}`;
      return [key, { start: b.position.x, end: b.position.x + b.size.width, name: b.name }] as const;
    })).values()
  ).filter(span => !xSegmentKeys.has(`${span.start}-${span.end}`)) : [];

  const yBlockSpans = showRoomDimensions ? Array.from(
    new Map(blocks.map(b => {
      const key = `${b.position.y}-${b.position.y + b.size.height}`;
      return [key, { start: b.position.y, end: b.position.y + b.size.height, name: b.name }] as const;
    })).values()
  ).filter(span => !ySegmentKeys.has(`${span.start}-${span.end}`)) : [];

  const xDimensionItems = assignRows([
    ...xSegments
      .filter(seg => hasBlockSpanning(blocks, seg.start, seg.end, 'x'))
      .map(seg => ({ start: seg.start, end: seg.end, label: `${seg.width}` })),
    ...xBlockSpans.map(span => ({ start: span.start, end: span.end, label: `${span.end - span.start}` })),
  ]);
  const yDimensionItems = assignRows([
    ...ySegments
      .filter(seg => hasBlockSpanning(blocks, seg.start, seg.start + seg.height, 'y'))
      .map(seg => ({ start: seg.start, end: seg.start + seg.height, label: `${seg.height}` })),
    ...yBlockSpans.map(span => ({ start: span.start, end: span.end, label: `${span.end - span.start}` })),
  ]);
  const maxBottomRow = xDimensionItems.reduce((max, item) => Math.max(max, item.row), 0);
  const maxRightRow = yDimensionItems.reduce((max, item) => Math.max(max, item.row), 0);

  return (
    <svg
      viewBox={`${vb.x} ${vb.y} ${vb.width} ${vb.height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', padding: "5px" }}
    >
      <defs>
        <pattern id={`tile-${floorIndex}`} patternUnits="userSpaceOnUse" width="12" height="12">
          <rect width="12" height="12" fill="#e8f4f8" />
          <rect x="0" y="0" width="6" height="6" fill="#ddeef5" />
          <rect x="6" y="6" width="6" height="6" fill="#ddeef5" />
        </pattern>
        <pattern id={`cross-hatch-${floorIndex}`} patternUnits="userSpaceOnUse" width="8" height="8">
          <rect width="8" height="8" fill="rgba(220,38,38,0.15)" />
          <path d="M0,0 L8,8 M8,0 L0,8" stroke="#dc2626" strokeWidth="1" opacity="0.5" />
        </pattern>
      </defs>

      {/* Outer boundary */}
      <rect
        x={padding}
        y={padding}
        width={planW}
        height={planH}
        fill={theme.bg}
        stroke={theme.ink}
        strokeWidth={3}
      />

      {outsideFloorRegions.map((region, i) => {
        const { sx, sy } = toSvgCoords(region.x, region.y, plan.width);
        const { sw, sh } = toSvgSize(region.width, region.height, plan.width);
        return (
          <rect
            key={`outside-floor-${i}`}
            x={sx}
            y={sy}
            width={sw}
            height={sh}
            fill={`url(#cross-hatch-${floorIndex})`}
            stroke="none"
          />
        );
      })}

      <rect
        x={floorX}
        y={floorY}
        width={floorW}
        height={floorH}
        fill="none"
        stroke={theme.inkLight}
        strokeWidth={1.2}
        strokeDasharray="5,3"
      />

      {/* Rooms and Spaces */}
      {floor.children.map((child, i) => {
        if (child.type === 'room' || child.type === 'space') {
          return <RoomRect key={i} room={child} planWidth={plan.width} floorOrigin={floor.position} roomIndex={i} defaultWallThick={plan.wallThick} textScale={textScale} onHoverChange={setHovered} />;
        }
        if (child.type === 'stair') {
          const { sx, sy } = toSvgCoords(floor.position.x + child.position.x, floor.position.y + child.position.y, plan.width);
          const { sw, sh } = toSvgSize(child.size.width, child.size.height, plan.width);
          return (
            <g
              key={i}
              onMouseEnter={() => setHovered({
                title: `STAIR${child.name ? ` ${child.name.toUpperCase()}` : ''}`,
                details: [
                  `Style: ${child.stairStyle}`,
                  `Orientation: ${child.orientation}`,
                  `Size: ${formatMeterPair(child.size.width, child.size.height)}`,
                  `Area: ${formatSquareMeters(child.size.width * child.size.height)}`,
                ],
                highlight: { x: sx, y: sy, width: sw, height: sh },
                accent: theme.accent2,
              })}
              onMouseLeave={() => setHovered(null)}
            >
              <StairSymbol x={sx} y={sy} w={sw} h={sh} name={child.name} stairStyle={child.stairStyle} orientation={child.orientation} textScale={textScale} />
            </g>
          );
        }
        return null;
      })}

      {/* Structural columns (plan-level, rendered on every floor) */}
      {plan.columns.map((col, i) => {
        const { sx, sy } = toSvgCoords(col.position.x, col.position.y, plan.width);
        const { sw, sh } = toSvgSize(col.size.width, col.size.height, plan.width);
        return (
          <g key={`col-${i}`}>
            <rect
              x={sx} y={sy} width={sw} height={sh}
              fill={theme.ink}
              stroke={theme.ink}
              strokeWidth={1}
            />
            <line x1={sx} y1={sy} x2={sx + sw} y2={sy + sh} stroke={theme.bg} strokeWidth={0.5} />
            <line x1={sx + sw} y1={sy} x2={sx} y2={sy + sh} stroke={theme.bg} strokeWidth={0.5} />
          </g>
        );
      })}

      {/* Overlap cross-hatch regions */}
      {overlaps.map((overlap, i) => {
        const { sx, sy } = toSvgCoords(overlap.x, overlap.y, plan.width);
        const { sw, sh } = toSvgSize(overlap.width, overlap.height, plan.width);
        return (
          <g key={`overlap-${i}`}>
            <rect
              x={sx}
              y={sy}
              width={sw}
              height={sh}
              fill={`url(#cross-hatch-${floorIndex})`}
              stroke="#dc2626"
              strokeWidth={1.5}
              strokeDasharray="4,2"
            />
            <text
              x={sx + sw / 2}
              y={sy + sh / 2 + 3}
              textAnchor="middle"
              fontFamily={theme.fontMono}
              fontSize={Math.min(sw * 0.12, 7)}
              fill="#dc2626"
              fontWeight="bold"
            >
              OVERLAP
            </text>
          </g>
        );
      })}

      {hovered && (
        <g pointerEvents="none">
          <rect
            x={hovered.highlight.x}
            y={hovered.highlight.y}
            width={hovered.highlight.width}
            height={hovered.highlight.height}
            fill="none"
            stroke={hovered.accent || theme.red}
            strokeWidth={2}
            strokeDasharray="5,3"
          />
          <rect
            x={padding + 8}
            y={padding + 8}
            width={130}
            height={26 + hovered.details.length * 12}
            fill="rgba(253,250,244,0.96)"
            stroke={hovered.accent || theme.ink}
            strokeWidth={1}
            rx={3}
          />
          <text
            x={padding + 14}
            y={padding + 22}
            fontFamily={theme.fontMono}
            fontSize={8 * textScale}
            fill={theme.ink}
          >
            {hovered.title}
          </text>
          {hovered.details.map((detail, i) => (
            <text
              key={`${hovered.title}-${i}`}
              x={padding + 14}
              y={padding + 34 + i * 12}
              fontFamily={theme.fontMono}
              fontSize={7 * textScale}
              fill={theme.inkLight}
            >
              {detail}
            </text>
          ))}
        </g>
      )}

      {hoveredDimension?.axis === 'x' && (
        <g pointerEvents="none">
          {([hoveredDimension.start, hoveredDimension.end] as const).map((edge, i) => {
            const x = floorX + mmToSvg(edge, plan.width);
            const anchorY = floorY + mmToSvg(getBottomAnchor(blocks, edge, floor.size.height), plan.width);
            const guideY = floorY + floorH + dimRowGap + dimRowHeight * (hoveredDimension.row + 1);
            return (
              <g key={`xhover-guide-${i}`}>
                <line x1={x} y1={anchorY} x2={x} y2={guideY} stroke={theme.red} strokeWidth={1.5} strokeDasharray="4,2" />
                <circle cx={x} cy={anchorY} r={4} fill={theme.red} opacity={0.9} />
              </g>
            );
          })}
          <line
            x1={floorX + mmToSvg(hoveredDimension.start, plan.width)}
            y1={floorY + floorH + dimRowGap + dimRowHeight * (hoveredDimension.row + 0.5)}
            x2={floorX + mmToSvg(hoveredDimension.end, plan.width)}
            y2={floorY + floorH + dimRowGap + dimRowHeight * (hoveredDimension.row + 0.5)}
            stroke={theme.red}
            strokeWidth={2}
          />
        </g>
      )}

      {hoveredDimension?.axis === 'y' && (
        <g pointerEvents="none">
          {([hoveredDimension.start, hoveredDimension.end] as const).map((edge, i) => {
            const y = floorY + mmToSvg(edge, plan.width);
            const anchorX = floorX + mmToSvg(getRightAnchor(blocks, edge, floor.size.width), plan.width);
            const guideX = floorX + floorW + dimRowGap + dimRowHeight * (hoveredDimension.row + 1);
            return (
              <g key={`yhover-guide-${i}`}>
                <line x1={anchorX} y1={y} x2={guideX} y2={y} stroke={theme.red} strokeWidth={1.5} strokeDasharray="4,2" />
                <circle cx={anchorX} cy={y} r={4} fill={theme.red} opacity={0.9} />
              </g>
            );
          })}
          <line
            x1={floorX + floorW + dimRowGap + dimRowHeight * (hoveredDimension.row + 0.5)}
            y1={floorY + mmToSvg(hoveredDimension.start, plan.width)}
            x2={floorX + floorW + dimRowGap + dimRowHeight * (hoveredDimension.row + 0.5)}
            y2={floorY + mmToSvg(hoveredDimension.end, plan.width)}
            stroke={theme.red}
            strokeWidth={2}
          />
        </g>
      )}

      {/* Room dimension lines - bottom (horizontal segments) */}
      {showRoomDimensions && xSegments.length > 0 && (
        <g>
          {xDimensionItems.map((item, i) => {
            const x1 = floorX + mmToSvg(item.start, plan.width);
            const x2 = floorX + mmToSvg(item.end, plan.width);
            const y = floorY + floorH + dimRowGap + dimRowHeight * (item.row + 0.5);
            const yBot = floorY + floorH + dimRowGap + dimRowHeight * (item.row + 1);
            const startAnchorY = floorY + mmToSvg(getBottomAnchor(blocks, item.start, floor.size.height), plan.width);
            const endAnchorY = floorY + mmToSvg(getBottomAnchor(blocks, item.end, floor.size.height), plan.width);
            const isActive = hoveredDimension?.axis === 'x' && hoveredDimension.start === item.start && hoveredDimension.end === item.end && hoveredDimension.row === item.row;
            return (
              <g key={`xdim-${i}`}>
                {isActive && (
                  <>
                    <line x1={x1} y1={startAnchorY} x2={x1} y2={yBot} stroke={theme.red} strokeWidth={1.2} strokeDasharray="2,2" />
                    <line x1={x2} y1={endAnchorY} x2={x2} y2={yBot} stroke={theme.red} strokeWidth={1.2} strokeDasharray="2,2" />
                  </>
                )}
                <DimensionLine
                  x1={x1} y1={y} x2={x2} y2={y}
                  label={item.label}
                  textScale={textScale}
                  onLabelMouseEnter={() => setHoveredDimension({ axis: 'x', start: item.start, end: item.end, row: item.row })}
                  onLabelMouseLeave={() => setHoveredDimension(null)}
                />
              </g>
            );
          })}
          {/* Circled reference numbers at bottom */}
          {xEdges.map((edge, i) => {
            const x = floorX + mmToSvg(edge, plan.width);
            const y = floorY + floorH + dimRowGap + dimRowHeight * (maxBottomRow + 1) + 10;
            const isActive = hoveredDimension?.axis === 'x' && (hoveredDimension.start === edge || hoveredDimension.end === edge);
            return (
              <g key={`xref-${i}`}>
                <circle cx={x} cy={y} r={6} fill={isActive ? 'rgba(192,57,43,0.12)' : 'none'} stroke={isActive ? theme.red : theme.ink} strokeWidth={isActive ? 1.4 : 0.8} />
                <text
                  x={x}
                  y={y + 3}
                  textAnchor="middle"
                  fontFamily={theme.fontMono}
                  fontSize={7 * textScale}
                  fill={isActive ? theme.red : theme.ink}
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Room dimension lines - right (vertical segments) */}
      {showRoomDimensions && ySegments.length > 0 && (
        <g>
          {yDimensionItems.map((item, i) => {
            const y1 = floorY + mmToSvg(item.start, plan.width);
            const y2 = floorY + mmToSvg(item.end, plan.width);
            const x = floorX + floorW + dimRowGap + dimRowHeight * (item.row + 0.5);
            const xRight = floorX + floorW + dimRowGap + dimRowHeight * (item.row + 1);
            const startAnchorX = floorX + mmToSvg(getRightAnchor(blocks, item.start, floor.size.width), plan.width);
            const endAnchorX = floorX + mmToSvg(getRightAnchor(blocks, item.end, floor.size.width), plan.width);
            const isActive = hoveredDimension?.axis === 'y' && hoveredDimension.start === item.start && hoveredDimension.end === item.end && hoveredDimension.row === item.row;
            return (
              <g key={`ydim-${i}`}>
                {isActive && (
                  <>
                    <line x1={startAnchorX} y1={y1} x2={xRight} y2={y1} stroke={theme.red} strokeWidth={1.2} strokeDasharray="2,2" />
                    <line x1={endAnchorX} y1={y2} x2={xRight} y2={y2} stroke={theme.red} strokeWidth={1.2} strokeDasharray="2,2" />
                  </>
                )}
                <DimensionLine
                  x1={x} y1={y1} x2={x} y2={y2}
                  label={item.label}
                  vertical
                  textScale={textScale}
                  onLabelMouseEnter={() => setHoveredDimension({ axis: 'y', start: item.start, end: item.end, row: item.row })}
                  onLabelMouseLeave={() => setHoveredDimension(null)}
                />
              </g>
            );
          })}
          {/* Circled reference letters on right */}
          {yEdges.map((edge, i) => {
            const y = floorY + mmToSvg(edge, plan.width);
            const x = floorX + floorW + dimRowGap + dimRowHeight * (maxRightRow + 1) + 10;
            const letter = String.fromCharCode(65 + i); // A, B, C...
            const isActive = hoveredDimension?.axis === 'y' && (hoveredDimension.start === edge || hoveredDimension.end === edge);
            return (
              <g key={`yref-${i}`}>
                <circle cx={x} cy={y} r={6} fill={isActive ? 'rgba(192,57,43,0.12)' : 'none'} stroke={isActive ? theme.red : theme.ink} strokeWidth={isActive ? 1.4 : 0.8} />
                <text
                  x={x}
                  y={y + 3}
                  textAnchor="middle"
                  fontFamily={theme.fontMono}
                  fontSize={7 * textScale}
                  fill={isActive ? theme.red : theme.ink}
                >
                  {letter}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Overall plan dimension lines */}
      {!showRoomDimensions && (
        <>
          <DimensionLine
            x1={floorX}
            y1={floorY + floorH + 10}
            x2={floorX + floorW}
            y2={floorY + floorH + 10}
            label={widthLabel}
          />
          <DimensionLine
            x1={floorX - 22}
            y1={floorY}
            x2={floorX - 22}
            y2={floorY + floorH}
            label={depthLabel}
            vertical
          />
        </>
      )}
      {showRoomDimensions && (
        <>
          <DimensionLine
            x1={floorX - 22}
            y1={floorY}
            x2={floorX - 22}
            y2={floorY + floorH}
            label={depthLabel}
            vertical
            textScale={textScale}
          />
          <DimensionLine
            x1={floorX}
            y1={floorY - 15}
            x2={floorX + floorW}
            y2={floorY - 15}
            label={widthLabel}
            textScale={textScale}
            labelPosition="above"
          />
        </>
      )}

      {/* Floor label badge */}
      <rect
        x={floorX + floorW - 95}
        y={floorY - 20}
        width={95}
        height={18}
        fill={theme.ink}
        rx={1}
      />
      <text
        x={floorX + floorW - 47}
        y={floorY - 8}
        textAnchor="middle"
        fontFamily={theme.fontMono}
        fontSize={8 * textScale}
        fill="white"
        letterSpacing={1}
      >
        {floor.label || floor.name.toUpperCase()}
      </text>
    </svg>
  );
}
