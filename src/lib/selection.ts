import { Position, Size } from './dsl/types';

export interface SelectedElement {
  type: 'room' | 'space';
  floorIndex: number;
  childIndex: number;
  line: number;
  position: Position;
  size: Size;
  floorOrigin: Position;
}

export type DragMode =
  | 'move'
  | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br'
  | 'resize-t' | 'resize-b' | 'resize-l' | 'resize-r';

export interface DragState {
  mode: DragMode;
  startSvgX: number;
  startSvgY: number;
  startPosition: Position;
  startSize: Size;
}

export interface SourcePatch {
  line: number;
  position?: Position;
  size?: Size;
}
