import { Token, tokenize } from './lexer';
import { ParseError } from './errors';
import { DEFAULT_FURNITURE_SIZES, DEFAULT_DOOR_SIZE } from './defaults';
import {
  PlanNode, FloorNode, RoomNode, SpaceNode, FurnitureNode, StairNode, ColumnNode, DoorNode,
  FurnitureType, StairStyle, StairOrientation, DoorStyle, DoorWall, DoorSwing, WallSides, Position, Size,
} from './types';

const FURNITURE_TYPES = new Set<string>([
  'stove', 'sink', 'fridge', 'toilet', 'shower',
  'washer', 'dryer', 'sofa', 'tv', 'bed',
  'table', 'chair', 'desk', 'wardrobe', 'plant', 'bathtub',
]);

export function parse(input: string): { ast: PlanNode | null; errors: ParseError[] } {
  const tokens = tokenize(input);
  const errors: ParseError[] = [];
  let pos = 0;

  function current(): Token {
    return tokens[pos] || { type: 'eof', value: '', line: 0, col: 0 };
  }

  function advance(): Token {
    const t = current();
    pos++;
    return t;
  }

  function expect(type: string, value?: string): Token {
    const t = current();
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      throw new ParseError(
        `Expected ${value ? `'${value}'` : type}, got '${t.value}'`,
        t.line, t.col, t.value.length || 1
      );
    }
    return advance();
  }

  function parseSize(parentSize?: Size): Size {
    const t = current();
    if (t.type === 'size') {
      advance();
      const val = t.value;
      if (val.startsWith('*')) {
        // *300 → full width, specified depth
        const h = Number(val.slice(1));
        return { width: parentSize?.width ?? 0, height: h };
      } else if (val.endsWith('*')) {
        // 600* → specified width, full depth
        const w = Number(val.slice(0, -1));
        return { width: w, height: parentSize?.height ?? 0 };
      } else {
        const [w, h] = val.split('*').map(Number);
        return { width: w, height: h };
      }
    }
    throw new ParseError(`Expected size (e.g., 3200*4000), got '${t.value}'`, t.line, t.col, t.value.length);
  }

  const CORNERS = new Set(['tl', 'tr', 'bl', 'br']);

  interface NamedBlock {
    name?: string;
    position: Position;
    size: Size;
  }

  function resolveCorner(
    refName: string,
    corner: string,
    colSize: Size,
    blocks: NamedBlock[],
    token: { line: number; col: number },
  ): Position {
    const block = blocks.find(b => b.name === refName);
    if (!block) {
      throw new ParseError(`"${refName}" not found for corner reference`, token.line, token.col, refName.length);
    }
    switch (corner) {
      case 'tl': return { x: block.position.x, y: block.position.y };
      case 'tr': return { x: block.position.x + block.size.width - colSize.width, y: block.position.y };
      case 'bl': return { x: block.position.x, y: block.position.y + block.size.height - colSize.height };
      case 'br': return { x: block.position.x + block.size.width - colSize.width, y: block.position.y + block.size.height - colSize.height };
      default: return { x: block.position.x, y: block.position.y };
    }
  }

  function parsePosition(siblingBlocks?: NamedBlock[], colSize?: Size): Position | 'center' {
    const t = current();
    if (t.type === 'ident' && t.value === 'center') {
      advance();
      return 'center';
    }

    // Handle "Name".corner syntax (rooms, stairs, columns)
    if (t.type === 'string' && pos + 2 < tokens.length && tokens[pos + 1].type === 'dot') {
      const refName = t.value;
      const startToken = advance(); // consume string
      advance(); // consume dot
      const cornerToken = current();
      if (cornerToken.type === 'ident' && CORNERS.has(cornerToken.value)) {
        advance(); // consume corner
        return resolveCorner(refName, cornerToken.value, colSize || { width: 0, height: 0 }, siblingBlocks || [], startToken);
      } else {
        throw new ParseError(
          `Expected corner (tl, tr, bl, br) after '.', got '${cornerToken.value}'`,
          cornerToken.line, cornerToken.col, cornerToken.value.length,
        );
      }
    }

    const x = expect('number');
    const commaToken = current();
    expect('comma');
    const yToken = current();
    if (yToken.type !== 'number') {
      throw new ParseError(
        `Expected y coordinate after comma, got '${yToken.value}'`,
        commaToken.line, commaToken.col, 1
      );
    }
    const y = advance();
    return { x: Number(x.value), y: Number(y.value) };
  }

  function parseProperties(siblingBlocks?: NamedBlock[], colSize?: Size): Record<string, string | Position | 'center'> {
    const props: Record<string, string | Position | 'center'> = {};
    while (current().type === 'ident' || (current().type === 'keyword' && ['at', 'color', 'style', 'orientation', 'swing', 'label', 'width', 'depth', 'wall', 'walls', 'colsize'].includes(current().value))) {
      // Check for prop=value pattern
      const nameToken = current();
      const name = nameToken.value;

      // Look ahead for '='
      if (pos + 1 < tokens.length && tokens[pos + 1].type === 'equals') {
        advance(); // name
        advance(); // =
        if (name === 'at') {
          props[name] = parsePosition(siblingBlocks, colSize) as Position | 'center';
        } else if (name === 'color') {
          const colorToken = current();
          if (colorToken.type === 'color') {
            props[name] = colorToken.value;
            advance();
          } else {
            props[name] = colorToken.value;
            advance();
          }
        } else {
          const valToken = current();
          if (valToken.type === 'string') {
            props[name] = valToken.value;
            advance();
          } else {
            props[name] = valToken.value;
            advance();
          }
        }
      } else {
        break;
      }
    }
    return props;
  }

  function parseFurniture(furnitureType: FurnitureType, parentSize?: Size, siblingBlocks?: NamedBlock[]): FurnitureNode {
    const startToken = advance(); // consume keyword
    const defaultSize = DEFAULT_FURNITURE_SIZES[furnitureType];
    let size: Size = { ...defaultSize };
    let position: Position | 'center' = { x: 0, y: 0 };
    let name: string | undefined;

    // Optional name
    if (current().type === 'string') {
      name = advance().value;
    }

    // Optional size
    if (current().type === 'size') {
      size = parseSize(parentSize);
    }

    // Optional properties
    const props = parseProperties(siblingBlocks);
    if (props.at) {
      position = props.at as Position | 'center';
    }

    return {
      type: 'furniture',
      furnitureType,
      name,
      size,
      position,
      line: startToken.line,
      col: startToken.col,
    };
  }

  function parseStair(parentSize?: Size, siblingBlocks?: NamedBlock[]): StairNode {
    const startToken = advance(); // consume 'stair'
    let size: Size = { width: 1600, height: 2600 };
    let position: Position = { x: 0, y: 0 };
    let name: string | undefined;
    let stairStyle: StairStyle = 'straight';
    let orientation: StairOrientation = 'tb';

    if (current().type === 'string') {
      name = advance().value;
    }

    if (current().type === 'size') {
      size = parseSize(parentSize);
    }

    const props = parseProperties(siblingBlocks);
    if (props.at) {
      position = props.at as Position;
    }
    if (props.style) {
      const s = props.style as string;
      if (s === 'l-shaped' || s === 'u-shaped') {
        stairStyle = s;
      }
    }
    if (props.orientation) {
      const o = props.orientation as string;
      if (o === 'tb' || o === 'bt' || o === 'lr' || o === 'rl') {
        orientation = o;
      }
    }

    return {
      type: 'stair',
      name,
      size,
      position,
      stairStyle,
      orientation,
      line: startToken.line,
      col: startToken.col,
    };
  }

  function parseDoor(): DoorNode {
    const startToken = advance(); // consume 'door'
    let name: string | undefined;
    let width = DEFAULT_DOOR_SIZE.width;
    let wall: DoorWall = 't';
    let offset = 0;
    let doorStyle: DoorStyle = 'single';
    let swing: DoorSwing = 'in';

    // Optional name
    if (current().type === 'string') {
      name = advance().value;
    }

    // Optional size (just a number for width)
    if (current().type === 'size') {
      const sizeVal = current().value;
      advance();
      const parts = sizeVal.split('*').map(Number);
      width = parts[0] || width;
    }

    // Properties
    const props = parseProperties();
    if (props.class) {
      const classVal = props.class as string;
      const dashIdx = classVal.indexOf('-');
      if (dashIdx !== -1) {
        const wallChar = classVal.slice(0, dashIdx) as DoorWall;
        if (['t', 'b', 'l', 'r'].includes(wallChar)) {
          wall = wallChar;
        }
        offset = Number(classVal.slice(dashIdx + 1)) || 0;
      }
    }
    if (props.style) {
      const s = props.style as string;
      if (s === 'single' || s === 'double' || s === 'triple' || s === 'quadruple' || s === 'quadfold' || s === 'sliding') {
        doorStyle = s;
      }
    }
    if (props.swing) {
      const value = props.swing as string;
      if (value === 'in' || value === 'out') {
        swing = value;
      }
    }

    return {
      type: 'door',
      name,
      width,
      wall,
      offset,
      doorStyle,
      swing,
      line: startToken.line,
      col: startToken.col,
    };
  }

  function parseColumn(parentSize?: Size, defaultColSize?: Size, siblingBlocks?: NamedBlock[]): ColumnNode {
    const startToken = advance(); // consume 'column'
    let size: Size = defaultColSize ? { ...defaultColSize } : { width: 200, height: 200 };
    let position: Position = { x: 0, y: 0 };
    let name: string | undefined;

    // Optional name (but not if it's a corner reference like "Kitchen".tl)
    if (current().type === 'string' && !(pos + 1 < tokens.length && tokens[pos + 1].type === 'dot')) {
      name = advance().value;
    }

    const props = parseProperties(siblingBlocks, size);

    if (current().type === 'size') {
      size = parseSize(parentSize);
    }

    const propsAfter = parseProperties(siblingBlocks, size);
    const allProps = { ...props, ...propsAfter };

    if (allProps.at) {
      position = allProps.at as Position;
    }

    return {
      type: 'column',
      name,
      size,
      position,
      line: startToken.line,
      col: startToken.col,
    };
  }

  function parseRoom(parentSize?: Size, defaultWallThick?: number, siblingBlocks?: NamedBlock[]): RoomNode {
    const startToken = expect('keyword', 'room');

    // Optional name
    let name: string | undefined;
    if (current().type === 'string') {
      name = advance().value;
    }

    // Properties first (at=, color=, style=, label=), then optional size
    const props = parseProperties(siblingBlocks);

    let size: Size = { width: 1000, height: 1000 };
    if (current().type === 'size') {
      size = parseSize(parentSize);
    }

    // Allow more properties after size too
    const propsAfter = parseProperties(siblingBlocks);
    const allProps = { ...props, ...propsAfter };

    const position: Position = (allProps.at as Position) || { x: 0, y: 0 };
    const color = allProps.color as string | undefined;
    const style = (allProps.style as string) === 'dashed' ? 'dashed' : 'solid';
    const label = allProps.label as string | undefined;
    const wallThick = allProps.wall ? Number(allProps.wall) : defaultWallThick;

    const children: (FurnitureNode | StairNode | DoorNode)[] = [];

    if (current().type === 'lbrace') {
      advance(); // {
      while (current().type !== 'rbrace' && current().type !== 'eof') {
        const t = current();
        const roomChildren: NamedBlock[] = children.filter(c => c.name && 'position' in c && c.position !== 'center') as NamedBlock[];
        if (t.type === 'keyword' && FURNITURE_TYPES.has(t.value)) {
          children.push(parseFurniture(t.value as FurnitureType, size, roomChildren));
        } else if (t.type === 'keyword' && t.value === 'stair') {
          children.push(parseStair(size, roomChildren));
        } else if (t.type === 'keyword' && t.value === 'door') {
          children.push(parseDoor());
        } else {
          errors.push(new ParseError(`Unexpected token '${t.value}' in room`, t.line, t.col, t.value.length));
          advance();
        }
      }
      if (current().type === 'rbrace') advance(); // }
    }

    return {
      type: 'room',
      name,
      label,
      size,
      position,
      color,
      style: style as 'solid' | 'dashed',
      wallThick,
      children,
      line: startToken.line,
      col: startToken.col,
    };
  }

  function parseSpace(parentSize?: Size, siblingBlocks?: NamedBlock[]): SpaceNode {
    const startToken = expect('keyword', 'space');

    let name: string | undefined;
    if (current().type === 'string') {
      name = advance().value;
    }

    const props = parseProperties(siblingBlocks);

    let size: Size = { width: 1000, height: 1000 };
    if (current().type === 'size') {
      size = parseSize(parentSize);
    }

    const propsAfter = parseProperties(siblingBlocks);
    const allProps = { ...props, ...propsAfter };

    const position: Position = (allProps.at as Position) || { x: 0, y: 0 };
    const label = allProps.label as string | undefined;
    const wallThick = allProps.wall ? Number(allProps.wall) : undefined;
    const wallSides = parseWallSides(allProps.walls as string | undefined);

    const children: (FurnitureNode | StairNode | DoorNode)[] = [];

    if (current().type === 'lbrace') {
      advance();
      while (current().type !== 'rbrace' && current().type !== 'eof') {
        const t = current();
        const spaceChildren: NamedBlock[] = children.filter(c => c.name && 'position' in c && c.position !== 'center') as NamedBlock[];
        if (t.type === 'keyword' && FURNITURE_TYPES.has(t.value)) {
          children.push(parseFurniture(t.value as FurnitureType, size, spaceChildren));
        } else if (t.type === 'keyword' && t.value === 'stair') {
          children.push(parseStair(size, spaceChildren));
        } else if (t.type === 'keyword' && t.value === 'door') {
          children.push(parseDoor());
        } else {
          errors.push(new ParseError(`Unexpected token '${t.value}' in space`, t.line, t.col, t.value.length));
          advance();
        }
      }
      if (current().type === 'rbrace') advance();
    }

    return {
      type: 'space',
      name,
      label,
      size,
      position,
      wallThick,
      wallSides,
      children,
      line: startToken.line,
      col: startToken.col,
    };
  }

  function parseWallSides(value?: string): WallSides | undefined {
    if (!value) return undefined;

    const sides = value
      .split('')
      .filter((char): char is DoorWall => char === 't' || char === 'b' || char === 'l' || char === 'r');

    return sides.length > 0 ? Array.from(new Set(sides)) : undefined;
  }

  function parseFloor(planSize?: Size, defaultWallThick?: number): FloorNode {
    const startToken = expect('keyword', 'floor');
    const nameToken = expect('string');

    const props = parseProperties();
    const label = props.label as string | undefined;
    let size: Size = planSize
      ? { width: planSize.width, height: planSize.height }
      : { width: 1000, height: 1000 };
    if (current().type === 'size') {
      size = parseSize(planSize);
    }
    const propsAfter = parseProperties();
    const allProps = { ...props, ...propsAfter };
    const position: Position = (allProps.at as Position) || { x: 0, y: 0 };
    const floorLabel = allProps.label as string | undefined;

    const children: (RoomNode | SpaceNode | StairNode)[] = [];

    expect('lbrace');
    while (current().type !== 'rbrace' && current().type !== 'eof') {
      const t = current();
      // Collect previously parsed siblings for corner references
      const siblingBlocks: NamedBlock[] = children.filter(c => c.name);
      if (t.type === 'keyword' && t.value === 'room') {
        children.push(parseRoom(planSize, defaultWallThick, siblingBlocks));
      } else if (t.type === 'keyword' && t.value === 'space') {
        children.push(parseSpace(planSize, siblingBlocks));
      } else if (t.type === 'keyword' && t.value === 'stair') {
        children.push(parseStair(planSize, siblingBlocks));
      } else {
        errors.push(new ParseError(`Unexpected token '${t.value}' in floor`, t.line, t.col, t.value.length));
        advance();
      }
    }
    if (current().type === 'rbrace') advance();

    return {
      type: 'floor',
      name: nameToken.value,
      label: floorLabel || label,
      position,
      size,
      children,
      line: startToken.line,
      col: startToken.col,
    };
  }

  function parsePlan(): PlanNode {
    const startToken = expect('keyword', 'plan');
    const nameToken = expect('string');

    const props = parseProperties();
    const width = props.width ? Number(props.width) : 20000;
    const depth = props.depth ? Number(props.depth) : 5000;
    const wallThick = props.wall ? Number(props.wall) : undefined;

    // Default column size: use wall thickness if specified, otherwise 200mm
    const defaultColSize = wallThick ? { width: wallThick, height: wallThick } : { width: 200, height: 200 };
    let columnSize: Size | undefined;
    if (props.colsize) {
      const parts = (props.colsize as string).split('*').map(Number);
      columnSize = { width: parts[0] || defaultColSize.width, height: parts[1] || parts[0] || defaultColSize.height };
    }

    const planSize: Size = { width, height: depth };
    const floors: FloorNode[] = [];
    const columns: ColumnNode[] = [];

    expect('lbrace');
    while (current().type !== 'rbrace' && current().type !== 'eof') {
      const t = current();
      if (t.type === 'keyword' && t.value === 'floor') {
        floors.push(parseFloor(planSize, wallThick));
      } else if (t.type === 'keyword' && t.value === 'column') {
        // Collect all named blocks (rooms, stairs) from all parsed floors for corner references
        const allBlocks: NamedBlock[] = [
          ...floors.flatMap(f => f.children.filter(c => c.name)),
          ...columns.filter(c => c.name),
        ];
        columns.push(parseColumn(planSize, columnSize || defaultColSize, allBlocks));
      } else {
        errors.push(new ParseError(`Expected 'floor' or 'column', got '${t.value}'`, t.line, t.col, t.value.length));
        advance();
      }
    }
    if (current().type === 'rbrace') advance();

    return {
      type: 'plan',
      name: nameToken.value,
      width,
      depth,
      wallThick,
      columnSize,
      columns,
      floors,
      line: startToken.line,
      col: startToken.col,
    };
  }

  try {
    if (current().type === 'eof') {
      return { ast: null, errors: [] };
    }
    const ast = parsePlan();
    return { ast, errors };
  } catch (e) {
    if (e instanceof ParseError) {
      errors.push(e);
    }
    return { ast: null, errors };
  }
}
