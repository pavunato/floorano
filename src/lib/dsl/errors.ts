export class ParseError extends Error {
  line: number;
  col: number;
  length: number;

  constructor(message: string, line: number, col: number, length: number = 1) {
    super(message);
    this.name = 'ParseError';
    this.line = line;
    this.col = col;
    this.length = length;
  }
}

export interface DiagnosticMessage {
  message: string;
  severity: 'error' | 'warning';
  line: number;
  col: number;
  length: number;
}
