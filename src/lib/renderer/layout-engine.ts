import { PlanNode, Position, Size } from '../dsl/types';

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PADDING = 30;
const DIMENSION_SPACE = 25;
// Extra space for room measurement rows outside the plan
const ROOM_DIM_ROWS = 5; // rows of dimension lines
const ROOM_DIM_ROW_HEIGHT = 20;
const ROOM_DIM_GAP = 8; // gap between plan edge and first row

export function computeViewBox(plan: PlanNode, showRoomDimensions = false, extraDoorRight = 0, extraDoorBottom = 0): ViewBox {
  const svgWidth = mmToSvg(plan.width, plan.width) + PADDING * 2;
  const extraBottom = showRoomDimensions ? ROOM_DIM_GAP + extraDoorBottom + ROOM_DIM_ROWS * ROOM_DIM_ROW_HEIGHT + 10 : 0;
  const extraRight = showRoomDimensions ? ROOM_DIM_GAP + extraDoorRight + ROOM_DIM_ROWS * ROOM_DIM_ROW_HEIGHT + 10 : 0;
  const svgHeight = mmToSvg(plan.depth, plan.width) + PADDING * 2 + DIMENSION_SPACE + extraBottom;
  return { x: 0, y: 0, width: svgWidth + extraRight, height: svgHeight };
}

// Convert mm to SVG coordinate units
// Scale factor: 940px for 20000mm plan = 0.047 px/mm
// We normalize to a 1000-wide viewBox
export function mmToSvg(mm: number, planWidth: number): number {
  const scale = 940 / planWidth;
  return mm * scale;
}

export function positionToSvg(
  pos: Position | 'center',
  itemSize: Size,
  containerSize: Size,
  containerPos: Position,
  planWidth: number,
): { x: number; y: number } {
  if (pos === 'center') {
    return {
      x: containerPos.x + (containerSize.width - itemSize.width) / 2,
      y: containerPos.y + (containerSize.height - itemSize.height) / 2,
    };
  }
  return {
    x: containerPos.x + pos.x,
    y: containerPos.y + pos.y,
  };
}

export function toSvgCoords(
  x: number, y: number, planWidth: number
): { sx: number; sy: number } {
  return {
    sx: PADDING + mmToSvg(x, planWidth),
    sy: PADDING + mmToSvg(y, planWidth),
  };
}

export function toSvgSize(
  width: number, height: number, planWidth: number
): { sw: number; sh: number } {
  return {
    sw: mmToSvg(width, planWidth),
    sh: mmToSvg(height, planWidth),
  };
}

// Inverse of mmToSvg: convert SVG units back to mm
export function svgToMm(svg: number, planWidth: number): number {
  const scale = 940 / planWidth;
  return svg / scale;
}

// Inverse of toSvgCoords: convert SVG coordinates back to mm
export function fromSvgCoords(
  sx: number, sy: number, planWidth: number
): { x: number; y: number } {
  return {
    x: svgToMm(sx - PADDING, planWidth),
    y: svgToMm(sy - PADDING, planWidth),
  };
}
