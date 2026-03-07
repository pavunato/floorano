export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type FurnitureType =
  | 'stove' | 'sink' | 'fridge' | 'toilet' | 'shower'
  | 'washer' | 'dryer' | 'sofa' | 'tv' | 'bed'
  | 'table' | 'chair' | 'desk' | 'wardrobe' | 'plant'
  | 'bathtub';

export interface FurnitureNode {
  type: 'furniture';
  furnitureType: FurnitureType;
  name?: string;
  size: Size;
  position: Position | 'center';
  line: number;
  col: number;
}

export type DoorStyle = 'single' | 'double' | 'triple' | 'quadruple' | 'sliding';
export type DoorWall = 't' | 'b' | 'l' | 'r';
export type DoorSwing = 'in' | 'out';
export type WallSides = DoorWall[];

export interface DoorNode {
  type: 'door';
  name?: string;
  width: number;
  wall: DoorWall;
  offset: number;
  doorStyle: DoorStyle;
  swing: DoorSwing;
  line: number;
  col: number;
}

export type StairStyle = 'straight' | 'l-shaped' | 'u-shaped';
export type StairOrientation = 'tb' | 'bt' | 'lr' | 'rl';

export interface StairNode {
  type: 'stair';
  name?: string;
  size: Size;
  position: Position;
  stairStyle: StairStyle;
  orientation: StairOrientation;
  line: number;
  col: number;
}

export interface DimensionNode {
  type: 'dimension';
  axis: 'horizontal' | 'vertical';
  value: number;
  position: Position;
  line: number;
  col: number;
}

export interface ColumnNode {
  type: 'column';
  name?: string;
  size: Size;
  position: Position;
  line: number;
  col: number;
}

export interface RoomNode {
  type: 'room';
  name?: string;
  label?: string;
  size: Size;
  position: Position;
  color?: string;
  style?: 'solid' | 'dashed';
  wallThick?: number;
  children: (FurnitureNode | StairNode | DimensionNode | DoorNode)[];
  line: number;
  col: number;
}

export interface SpaceNode {
  type: 'space';
  name?: string;
  label?: string;
  size: Size;
  position: Position;
  wallThick?: number;
  wallSides?: WallSides;
  children: (FurnitureNode | StairNode | DimensionNode | DoorNode)[];
  line: number;
  col: number;
}

export interface FloorNode {
  type: 'floor';
  name: string;
  label?: string;
  position: Position;
  size: Size;
  children: (RoomNode | SpaceNode | StairNode)[];
  line: number;
  col: number;
}

export interface PlanNode {
  type: 'plan';
  name: string;
  width: number;
  depth: number;
  wallThick?: number;
  columnSize?: Size;
  columns: ColumnNode[];
  floors: FloorNode[];
  line: number;
  col: number;
}
