'use client';

import { theme, getDefaultRoomColor } from '@/lib/renderer/theme';
import { formatMeterPair, formatMeters, formatSquareMeters } from '@/lib/renderer/units';
import { DoorWall, RoomNode, SpaceNode } from '@/lib/dsl/types';
import { toSvgCoords, toSvgSize, mmToSvg } from '@/lib/renderer/layout-engine';
import FurnitureSymbol from './FurnitureSymbol';
import StairSymbol from './StairSymbol';
import DoorSymbol from './DoorSymbol';
import { HoverCardData } from './hover';

interface Props {
  room: RoomNode | SpaceNode;
  planWidth: number;
  floorOrigin?: { x: number; y: number };
  roomIndex: number;
  defaultWallThick?: number;
  textScale?: number;
  onHoverChange?: (hover: HoverCardData | null) => void;
}

export default function RoomRect({ room, planWidth, floorOrigin = { x: 0, y: 0 }, roomIndex, defaultWallThick, textScale = 1, onHoverChange }: Props) {
  const absoluteX = floorOrigin.x + room.position.x;
  const absoluteY = floorOrigin.y + room.position.y;
  const { sx, sy } = toSvgCoords(absoluteX, absoluteY, planWidth);
  const { sw, sh } = toSvgSize(room.size.width, room.size.height, planWidth);
  const isSpace = room.type === 'space';
  const fillColor = isSpace ? 'rgba(200, 200, 200, 0.1)' : ((room as RoomNode).color || getDefaultRoomColor(roomIndex));

  const wallThick = isSpace ? (room as SpaceNode).wallThick ?? 0 : ((room as RoomNode).wallThick ?? defaultWallThick ?? 0);
  const wallSvg = wallThick > 0 ? mmToSvg(wallThick, planWidth) : 0;
  const spaceWallSides = isSpace ? ((room as SpaceNode).wallSides ?? []) : [];

  const isTallNarrow = sh > sw * 1.8;
  const fontSize = (isTallNarrow ? Math.min(sh * 0.085, 12) : Math.min(sw * 0.06, 10)) * textScale;
  const subFontSize = fontSize * 0.75;
  const dimText = `${room.size.width}×${room.size.height} mm`;
  const roomStyle = isSpace ? undefined : (room as RoomNode).style;
  const roomArea = room.size.width * room.size.height;
  const innerWidth = Math.max(0, room.size.width - wallThick * 2);
  const innerHeight = Math.max(0, room.size.height - wallThick * 2);
  const usableArea = innerWidth * innerHeight;
  const centerX = sx + sw / 2;
  const centerY = sy + sh / 2;
  const narrowTrackGap = Math.min(Math.max(sw * 0.18, subFontSize * 1.25), sw * 0.28);
  const labelTrackX = centerX - narrowTrackGap;
  const nameTrackX = centerX;
  const sizeTrackX = centerX + narrowTrackGap;

  const setRoomHover = () => onHoverChange?.({
    title: `${room.type === 'space' ? 'Space' : 'Room'} ${(room.name || 'unnamed').toUpperCase()}`,
    details: [
      `Size: ${formatMeterPair(room.size.width, room.size.height)}`,
      `Area: ${formatSquareMeters(roomArea)}`,
      `Wall: ${formatMeters(wallThick)}`,
      `Usable area: ${formatSquareMeters(usableArea)}`,
    ],
    highlight: { x: sx, y: sy, width: sw, height: sh },
    accent: isSpace ? theme.accent2 : theme.accent,
  });

  return (
    <g onMouseEnter={setRoomHover} onMouseLeave={() => onHoverChange?.(null)}>
      {/* Wall fill (outer rect as wall color, inner rect as room fill) */}
      {!isSpace && wallSvg > 0 ? (
        <>
          <rect
            x={sx}
            y={sy}
            width={sw}
            height={sh}
            fill={theme.wallFill}
            stroke={theme.ink}
            strokeWidth={1.5}
            strokeDasharray={roomStyle === 'dashed' ? '6,3' : undefined}
          />
          <rect
            x={sx + wallSvg}
            y={sy + wallSvg}
            width={Math.max(0, sw - wallSvg * 2)}
            height={Math.max(0, sh - wallSvg * 2)}
            fill={fillColor}
            stroke="none"
          />
        </>
      ) : (
        <>
          <rect
            x={sx}
            y={sy}
            width={sw}
            height={sh}
            fill={fillColor}
            stroke={isSpace ? theme.inkLight : theme.ink}
            strokeWidth={isSpace ? 1 : 1.5}
            strokeDasharray={isSpace ? '4,3' : (roomStyle === 'dashed' ? '6,3' : undefined)}
          />
          {isSpace && wallSvg > 0 && spaceWallSides.map(side => renderSpaceWall(side, sx, sy, sw, sh, wallSvg))}
        </>
      )}

      {/* Room/space label */}
      {room.label && (
        <text
          x={isTallNarrow ? labelTrackX : centerX}
          y={isTallNarrow ? centerY : sy + sh * 0.38}
          textAnchor="middle"
          fontFamily={theme.fontMono}
          fontSize={fontSize}
          fill={theme.ink}
          transform={isTallNarrow ? `rotate(-90 ${labelTrackX} ${centerY})` : undefined}
        >
          {room.label}
        </text>
      )}
      <text
        x={isTallNarrow ? nameTrackX : centerX}
        y={isTallNarrow ? centerY : sy + sh * (room.label ? 0.5 : 0.42)}
        textAnchor="middle"
        fontFamily={theme.fontMono}
        fontSize={subFontSize}
        fill={theme.inkLight}
        transform={isTallNarrow ? `rotate(-90 ${nameTrackX} ${centerY})` : undefined}
      >
        {(room.name || '').toUpperCase()}
      </text>
      <text
        x={isTallNarrow ? sizeTrackX : centerX}
        y={isTallNarrow ? centerY : sy + sh * (room.label ? 0.6 : 0.55)}
        textAnchor="middle"
        fontFamily={theme.fontMono}
        fontSize={subFontSize * 0.9}
        fill={theme.accent}
        transform={isTallNarrow ? `rotate(-90 ${sizeTrackX} ${centerY})` : undefined}
      >
        {dimText}
      </text>

      {/* Children: furniture, stairs, and doors */}
      {room.children.map((child, i) => {
        if (child.type === 'furniture') {
          let cx: number, cy: number;
          const { sw: cw, sh: ch } = toSvgSize(child.size.width, child.size.height, planWidth);

          if (child.position === 'center') {
            cx = sx + (sw - cw) / 2;
            cy = sy + (sh - ch) / 2;
          } else {
            cx = sx + mmToSvg(child.position.x, planWidth);
            cy = sy + mmToSvg(child.position.y, planWidth);
          }

          return (
            <g
              key={i}
              onMouseEnter={() => onHoverChange?.({
                title: `${child.furnitureType.toUpperCase()}${child.name ? ` ${child.name.toUpperCase()}` : ''}`,
                details: [
                  `Size: ${formatMeterPair(child.size.width, child.size.height)}`,
                  `Area: ${formatSquareMeters(child.size.width * child.size.height)}`,
                ],
                highlight: { x: cx, y: cy, width: cw, height: ch },
                accent: theme.accent2,
              })}
              onMouseLeave={() => onHoverChange?.(null)}
            >
              <rect x={cx} y={cy} width={cw} height={ch} fill="transparent" />
              <FurnitureSymbol furnitureType={child.furnitureType} x={cx} y={cy} w={cw} h={ch} />
            </g>
          );
        }
        if (child.type === 'stair') {
          const { sw: cw, sh: ch } = toSvgSize(child.size.width, child.size.height, planWidth);
          const cx = sx + mmToSvg(child.position.x, planWidth);
          const cy = sy + mmToSvg(child.position.y, planWidth);
          return (
            <g
              key={i}
              onMouseEnter={() => onHoverChange?.({
                title: `STAIR${child.name ? ` ${child.name.toUpperCase()}` : ''}`,
                details: [
                  `Style: ${child.stairStyle}`,
                  `Orientation: ${child.orientation}`,
                  `Size: ${formatMeterPair(child.size.width, child.size.height)}`,
                  `Area: ${formatSquareMeters(child.size.width * child.size.height)}`,
                ],
                highlight: { x: cx, y: cy, width: cw, height: ch },
                accent: theme.accent2,
              })}
              onMouseLeave={() => onHoverChange?.(null)}
            >
              <StairSymbol x={cx} y={cy} w={cw} h={ch} name={child.name} stairStyle={child.stairStyle} orientation={child.orientation} textScale={textScale} />
            </g>
          );
        }
        if (child.type === 'door') {
          const doorW = mmToSvg(child.width, planWidth);
          const doorOffset = mmToSvg(child.offset, planWidth);
          const wallThickSvg = wallSvg || mmToSvg(100, planWidth);
          let dx: number, dy: number;

          switch (child.wall) {
            case 't': dx = sx + doorOffset; dy = sy; break;
            case 'b': dx = sx + doorOffset; dy = sy + sh; break;
            case 'l': dx = sx; dy = sy + doorOffset; break;
            case 'r': dx = sx + sw; dy = sy + doorOffset; break;
          }

          // Swing depth = leaf size (full width for single, half for double, w/n for multi)
          const swingDepth = child.doorStyle === 'single' ? doorW
            : child.doorStyle === 'double' ? doorW / 2
            : child.doorStyle === 'triple' ? doorW / 3
            : child.doorStyle === 'quadruple' || child.doorStyle === 'quadfold' ? doorW / 4
            : doorW * 0.15; // sliding: just a small margin

          const highlight = child.wall === 't'
            ? { x: dx, y: dy - (child.swing === 'out' ? swingDepth : 0), width: doorW, height: wallThickSvg + swingDepth }
            : child.wall === 'b'
              ? { x: dx, y: dy - (child.swing === 'out' ? 0 : swingDepth), width: doorW, height: wallThickSvg + swingDepth }
              : child.wall === 'l'
                ? { x: dx - (child.swing === 'out' ? swingDepth : 0), y: dy, width: wallThickSvg + swingDepth, height: doorW }
                : { x: dx - (child.swing === 'out' ? 0 : swingDepth), y: dy, width: wallThickSvg + swingDepth, height: doorW };

          return (
            <g
              key={i}
              onMouseEnter={() => onHoverChange?.({
                title: `DOOR${child.name ? ` ${child.name.toUpperCase()}` : ''}`,
                details: [
                  `Style: ${child.doorStyle}`,
                  `Swing: ${child.swing}`,
                  `Wall: ${child.wall}`,
                  `Width: ${formatMeters(child.width)}`,
                  `Offset: ${formatMeters(child.offset)}`,
                ],
                highlight,
                accent: theme.red,
              })}
              onMouseLeave={() => onHoverChange?.(null)}
            >
              <rect x={highlight.x} y={highlight.y} width={highlight.width} height={highlight.height} fill="transparent" />
              <DoorSymbol
                x={dx}
                y={dy}
                w={doorW}
                wallThick={wallThickSvg}
                wallSide={child.wall}
                doorStyle={child.doorStyle}
                swing={child.swing}
              />
            </g>
          );
        }
        return null;
      })}
    </g>
  );
}

function renderSpaceWall(side: DoorWall, sx: number, sy: number, sw: number, sh: number, wallSvg: number) {
  if (side === 't') {
    return <rect key="space-wall-t" x={sx} y={sy} width={sw} height={wallSvg} fill={theme.wallFill} stroke={theme.ink} strokeWidth={0.8} />;
  }
  if (side === 'b') {
    return <rect key="space-wall-b" x={sx} y={sy + sh - wallSvg} width={sw} height={wallSvg} fill={theme.wallFill} stroke={theme.ink} strokeWidth={0.8} />;
  }
  if (side === 'l') {
    return <rect key="space-wall-l" x={sx} y={sy} width={wallSvg} height={sh} fill={theme.wallFill} stroke={theme.ink} strokeWidth={0.8} />;
  }
  return <rect key="space-wall-r" x={sx + sw - wallSvg} y={sy} width={wallSvg} height={sh} fill={theme.wallFill} stroke={theme.ink} strokeWidth={0.8} />;
}
