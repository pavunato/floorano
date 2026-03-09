import { PlanNode, RoomNode, SpaceNode, FurnitureNode, StairNode, DoorNode, FloorNode } from './types';
import { DiagnosticMessage } from './errors';

export interface OverlapRegion {
  floorIndex: number;
  roomA: string;
  roomB: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ValidationResult {
  warnings: DiagnosticMessage[];
  overlaps: OverlapRegion[];
}

export function validateBounds(ast: PlanNode): DiagnosticMessage[] {
  return validateAll(ast).warnings;
}

export function validateAll(ast: PlanNode): ValidationResult {
  const warnings: DiagnosticMessage[] = [];
  const overlaps: OverlapRegion[] = [];
  const planW = ast.width;
  const planD = ast.depth;

  for (let fi = 0; fi < ast.floors.length; fi++) {
    const floor = ast.floors[fi];
    const roomsAndSpaces = floor.children.filter((c): c is RoomNode | SpaceNode => c.type === 'room' || c.type === 'space');

    checkFloorBounds(warnings, floor, planW, planD);

    for (const child of floor.children) {
      if (child.type === 'room' || child.type === 'space') {
        checkBounds(warnings, child, floor.size.width, floor.size.height, `floor "${floor.name}"`);
        for (const item of child.children) {
          if (item.type === 'furniture') {
            checkFurnitureBounds(warnings, item, child);
          } else if (item.type === 'stair') {
            checkBounds(warnings, item, child.size.width, child.size.height, `${child.type} "${child.name || 'unnamed'}"`);
          } else if (item.type === 'door') {
            checkDoorBounds(warnings, item, child);
          }
        }
      } else if (child.type === 'stair') {
        checkBounds(warnings, child, floor.size.width, floor.size.height, `floor "${floor.name}"`);
      }
    }

    // Check room/space overlaps on this floor
    for (let i = 0; i < roomsAndSpaces.length; i++) {
      for (let j = i + 1; j < roomsAndSpaces.length; j++) {
        const a = roomsAndSpaces[i];
        const b = roomsAndSpaces[j];
        // Spaces can overlap with other spaces
        if (a.type === 'space' && b.type === 'space') continue;

        const overlap = getRectOverlap(
          a.position.x, a.position.y, a.size.width, a.size.height,
          b.position.x, b.position.y, b.size.width, b.size.height,
        );
        if (overlap) {
          const nameA = a.name || `${a.type} ${i + 1}`;
          const nameB = b.name || `${b.type} ${j + 1}`;
          overlaps.push({
            floorIndex: fi,
            roomA: nameA,
            roomB: nameB,
            ...overlap,
          });
          warnings.push({
            message: `${a.type} "${nameA}" overlaps with "${nameB}" (${overlap.width}×${overlap.height}mm)`,
            severity: 'warning',
            line: b.line,
            col: b.col,
            length: 1,
          });
        }
      }
    }
  }

  return { warnings, overlaps };
}

function checkFloorBounds(
  warnings: DiagnosticMessage[],
  floor: FloorNode,
  planW: number,
  planD: number,
) {
  const overflowParts = getOverflowParts(
    floor.position.x,
    floor.position.y,
    floor.size.width,
    floor.size.height,
    planW,
    planD,
  );

  if (floor.position.x < 0 || floor.position.y < 0) {
    warnings.push({
      message: `floor "${floor.name}" has negative position (${floor.position.x}, ${floor.position.y})`,
      severity: 'warning',
      line: floor.line,
      col: floor.col,
      length: 1,
    });
  }

  if (overflowParts.length > 0) {
    warnings.push({
      message: `floor "${floor.name}" overflows plan (${overflowParts.join(', ')})`,
      severity: 'warning',
      line: floor.line,
      col: floor.col,
      length: 1,
    });
  }
}

function getRectOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): { x: number; y: number; width: number; height: number } | null {
  const overlapX = Math.max(ax, bx);
  const overlapY = Math.max(ay, by);
  const overlapR = Math.min(ax + aw, bx + bw);
  const overlapB = Math.min(ay + ah, by + bh);
  const w = overlapR - overlapX;
  const h = overlapB - overlapY;
  if (w > 0 && h > 0) {
    return { x: overlapX, y: overlapY, width: w, height: h };
  }
  return null;
}

function checkDoorBounds(
  warnings: DiagnosticMessage[],
  door: DoorNode,
  parent: RoomNode | SpaceNode,
) {
  if (parent.type === 'space' && parent.wallSides && !parent.wallSides.includes(door.wall)) {
    warnings.push({
      message: `door is attached to undefined wall "${door.wall}" on space "${parent.name || 'unnamed'}"`,
      severity: 'warning',
      line: door.line,
      col: door.col,
      length: 1,
    });
  }

  const wallLength = (door.wall === 't' || door.wall === 'b')
    ? parent.size.width
    : parent.size.height;
  if (door.offset + door.width > wallLength) {
    warnings.push({
      message: `door exceeds ${door.wall === 't' ? 'top' : door.wall === 'b' ? 'bottom' : door.wall === 'l' ? 'left' : 'right'} wall of "${parent.name || 'unnamed'}" by ${door.offset + door.width - wallLength}mm`,
      severity: 'warning',
      line: door.line,
      col: door.col,
      length: 1,
    });
  }
}

function checkBounds(
  warnings: DiagnosticMessage[],
  node: RoomNode | SpaceNode | StairNode,
  parentW: number,
  parentH: number,
  parentLabel: string,
) {
  const pos = node.position;
  const w = node.size.width;
  const h = node.size.height;
  const name = (node.type === 'room' || node.type === 'space') ? `"${node.name || 'unnamed'}"` : (node.name ? `"${node.name}"` : 'stair');

  if (pos.x < 0 || pos.y < 0) {
    warnings.push({
      message: `${node.type} ${name} has negative position (${pos.x}, ${pos.y})`,
      severity: 'warning',
      line: node.line,
      col: node.col,
      length: 1,
    });
  }

  const overflowParts = getOverflowParts(pos.x, pos.y, w, h, parentW, parentH);
  if (overflowParts.length > 0) {
    warnings.push({
      message: `${node.type} ${name} overflows ${parentLabel} (${overflowParts.join(', ')})`,
      severity: 'warning',
      line: node.line,
      col: node.col,
      length: 1,
    });
  }
}

function checkFurnitureBounds(
  warnings: DiagnosticMessage[],
  node: FurnitureNode,
  room: RoomNode | SpaceNode,
) {
  if (node.position === 'center') return;

  const pos = node.position;
  const w = node.size.width;
  const h = node.size.height;
  const roomW = room.size.width;
  const roomH = room.size.height;

  if (pos.x < 0 || pos.y < 0) {
    warnings.push({
      message: `${node.furnitureType} has negative position in room "${room.name || 'unnamed'}"`,
      severity: 'warning',
      line: node.line,
      col: node.col,
      length: 1,
    });
  }

  const overflowParts = getOverflowParts(pos.x, pos.y, w, h, roomW, roomH);
  if (overflowParts.length > 0) {
    warnings.push({
      message: `${node.furnitureType} overflows room "${room.name || 'unnamed'}" (${overflowParts.join(', ')})`,
      severity: 'warning',
      line: node.line,
      col: node.col,
      length: 1,
    });
  }
}

function getOverflowParts(
  x: number,
  y: number,
  width: number,
  height: number,
  boundsWidth: number,
  boundsHeight: number,
) {
  const overflowParts: string[] = [];

  if (x < 0) {
    overflowParts.push(`left by ${Math.abs(x)}mm`);
  }
  if (y < 0) {
    overflowParts.push(`top by ${Math.abs(y)}mm`);
  }
  if (x + width > boundsWidth) {
    overflowParts.push(`right by ${x + width - boundsWidth}mm`);
  }
  if (y + height > boundsHeight) {
    overflowParts.push(`bottom by ${y + height - boundsHeight}mm`);
  }

  return overflowParts;
}
