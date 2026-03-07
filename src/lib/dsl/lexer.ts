export type TokenType =
  | 'keyword'     // plan, floor, room, stair, dimension, furniture types
  | 'string'      // "quoted string"
  | 'number'      // 123
  | 'size'        // 600*400, 600*, *300
  | 'ident'       // property names
  | 'equals'      // =
  | 'comma'       // ,
  | 'dot'         // .
  | 'lbrace'      // {
  | 'rbrace'      // }
  | 'hash'        // #
  | 'color'       // #hex
  | 'eof';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

const KEYWORDS = new Set([
  'plan', 'floor', 'room', 'space', 'stair', 'dimension', 'column', 'door',
  'stove', 'sink', 'fridge', 'toilet', 'shower',
  'washer', 'dryer', 'sofa', 'tv', 'bed',
  'table', 'chair', 'desk', 'wardrobe', 'plant', 'bathtub',
]);

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;
  let col = 1;

  function advance(n: number = 1) {
    for (let i = 0; i < n; i++) {
      if (input[pos] === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
      pos++;
    }
  }

  function peek(): string {
    return input[pos] || '';
  }

  function skipWhitespace() {
    while (pos < input.length && /\s/.test(input[pos])) {
      advance();
    }
  }

  function skipLineComment() {
    if (pos < input.length - 1 && input[pos] === '/' && input[pos + 1] === '/') {
      while (pos < input.length && input[pos] !== '\n') {
        advance();
      }
    }
  }

  function readString(): string {
    advance(); // skip opening quote
    let result = '';
    while (pos < input.length && input[pos] !== '"') {
      if (input[pos] === '\\' && pos + 1 < input.length) {
        advance();
        result += input[pos];
      } else {
        result += input[pos];
      }
      advance();
    }
    if (pos < input.length) advance(); // skip closing quote
    return result;
  }

  function readNumber(): string {
    let result = '';
    while (pos < input.length && /[0-9]/.test(input[pos])) {
      result += input[pos];
      advance();
    }
    return result;
  }

  function readIdent(): string {
    let result = '';
    while (pos < input.length && /[a-zA-Z0-9_-]/.test(input[pos])) {
      result += input[pos];
      advance();
    }
    return result;
  }

  while (pos < input.length) {
    skipWhitespace();
    skipLineComment();
    skipWhitespace();

    if (pos >= input.length) break;

    const startLine = line;
    const startCol = col;
    const ch = peek();

    if (ch === '"') {
      const value = readString();
      tokens.push({ type: 'string', value, line: startLine, col: startCol });
    } else if (ch === '{') {
      tokens.push({ type: 'lbrace', value: '{', line: startLine, col: startCol });
      advance();
    } else if (ch === '}') {
      tokens.push({ type: 'rbrace', value: '}', line: startLine, col: startCol });
      advance();
    } else if (ch === '=') {
      tokens.push({ type: 'equals', value: '=', line: startLine, col: startCol });
      advance();
    } else if (ch === ',') {
      tokens.push({ type: 'comma', value: ',', line: startLine, col: startCol });
      advance();
    } else if (ch === '.') {
      tokens.push({ type: 'dot', value: '.', line: startLine, col: startCol });
      advance();
    } else if (ch === '#') {
      advance(); // skip #
      let hex = '';
      while (pos < input.length && /[0-9a-fA-F]/.test(input[pos])) {
        hex += input[pos];
        advance();
      }
      tokens.push({ type: 'color', value: '#' + hex, line: startLine, col: startCol });
    } else if (ch === '*') {
      // *300 form (full width, specified depth)
      advance(); // skip *
      const num2 = readNumber();
      tokens.push({ type: 'size', value: '*' + num2, line: startLine, col: startCol });
    } else if (/[0-9]/.test(ch)) {
      const num1 = readNumber();
      if (pos < input.length && input[pos] === '*') {
        advance(); // skip *
        // Check if there's a number after * (600*400 vs 600*)
        if (pos < input.length && /[0-9]/.test(input[pos])) {
          const num2 = readNumber();
          tokens.push({ type: 'size', value: num1 + '*' + num2, line: startLine, col: startCol });
        } else {
          // 600* form (specified width, full depth)
          tokens.push({ type: 'size', value: num1 + '*', line: startLine, col: startCol });
        }
      } else {
        tokens.push({ type: 'number', value: num1, line: startLine, col: startCol });
      }
    } else if (/[a-zA-Z_]/.test(ch)) {
      const ident = readIdent();
      if (KEYWORDS.has(ident)) {
        tokens.push({ type: 'keyword', value: ident, line: startLine, col: startCol });
      } else {
        tokens.push({ type: 'ident', value: ident, line: startLine, col: startCol });
      }
    } else {
      // Skip unknown characters
      advance();
    }
  }

  tokens.push({ type: 'eof', value: '', line, col });
  return tokens;
}
