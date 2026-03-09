import { SourcePatch } from '../selection';

export function snapToGrid(value: number, gridSize = 100): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Patch room/space source line(s) to update position and/or size.
 * Searches from the given line number (1-based) for `at=X,Y` and `W*H` patterns.
 */
export function patchRoomInSource(
  source: string,
  patch: SourcePatch,
): string {
  const lines = source.split('\n');
  // line is 1-based from the parser
  const lineIdx = patch.line - 1;

  if (lineIdx < 0 || lineIdx >= lines.length) return source;

  // Search the declaration line and up to 3 following lines for patterns
  const searchEnd = Math.min(lineIdx + 4, lines.length);

  if (patch.position) {
    const pos = patch.position;
    const atPattern = /at\s*=\s*(?:"[^"]*"\s*\.\s*(?:tl|tr|bl|br)|\d+\s*,\s*\d+|center)/;
    let found = false;
    for (let i = lineIdx; i < searchEnd; i++) {
      if (atPattern.test(lines[i])) {
        lines[i] = lines[i].replace(atPattern, `at=${pos.x},${pos.y}`);
        found = true;
        break;
      }
    }
    if (!found) {
      // Insert at= before the opening brace or at end of the room line
      const braceIdx = lines[lineIdx].indexOf('{');
      if (braceIdx >= 0) {
        lines[lineIdx] =
          lines[lineIdx].slice(0, braceIdx) +
          `at=${pos.x},${pos.y} ` +
          lines[lineIdx].slice(braceIdx);
      } else {
        // Look for brace on subsequent lines; insert at end of declaration line
        lines[lineIdx] = lines[lineIdx] + ` at=${pos.x},${pos.y}`;
      }
    }
  }

  if (patch.size) {
    const size = patch.size;
    // Match full size (W*H), partial (*H), partial (W*), ensuring it's not inside at= or other props
    const sizePattern = /(?<!\w)(\*?\d+\*\d*|\d+\*\d*)(?!\w)/;
    let found = false;
    for (let i = lineIdx; i < searchEnd; i++) {
      // Don't match inside at=X,Y — strip at=... first for matching purposes
      const lineWithoutAt = lines[i].replace(/at\s*=\s*(?:"[^"]*"\s*\.\s*(?:tl|tr|bl|br)|\d+\s*,\s*\d+|center)/, '');
      if (sizePattern.test(lineWithoutAt)) {
        // Find the actual match position in the original line
        // We need to find a size token that's not part of at=
        lines[i] = replaceSize(lines[i], `${size.width}*${size.height}`);
        found = true;
        break;
      }
    }
    if (!found) {
      // Insert size before the opening brace
      const braceIdx = lines[lineIdx].indexOf('{');
      if (braceIdx >= 0) {
        lines[lineIdx] =
          lines[lineIdx].slice(0, braceIdx) +
          `${size.width}*${size.height} ` +
          lines[lineIdx].slice(braceIdx);
      } else {
        lines[lineIdx] = lines[lineIdx] + ` ${size.width}*${size.height}`;
      }
    }
  }

  return lines.join('\n');
}

/**
 * Replace the size token in a line, being careful not to touch at=X,Y coordinates.
 */
function replaceSize(line: string, newSize: string): string {
  // Strategy: find size tokens (digits*digits, *digits, digits*) that are NOT inside at=...
  // We'll walk the string and skip over at=... regions
  const atPattern = /at\s*=\s*(?:"[^"]*"\s*\.\s*(?:tl|tr|bl|br)|\d+\s*,\s*\d+|center)/g;
  const skipRanges: [number, number][] = [];
  let m;
  while ((m = atPattern.exec(line)) !== null) {
    skipRanges.push([m.index, m.index + m[0].length]);
  }

  const sizePattern = /(?<![,\w])(\*?\d+\*\d*|\d+\*\d*)(?![,\w])/g;
  while ((m = sizePattern.exec(line)) !== null) {
    const inSkip = skipRanges.some(([s, e]) => m!.index >= s && m!.index < e);
    if (!inSkip && m[0].includes('*')) {
      return line.slice(0, m.index) + newSize + line.slice(m.index + m[0].length);
    }
  }

  return line;
}
