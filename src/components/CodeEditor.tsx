'use client';

import { useEffect, useRef } from 'react';
import { EditorState, StateEffect, StateField } from '@codemirror/state';
import {
  EditorView,
  hoverTooltip,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  Decoration,
  DecorationSet,
  GutterMarker,
  gutter,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import {
  HighlightStyle,
  syntaxHighlighting,
  StreamLanguage,
  foldGutter,
  foldKeymap,
  foldService,
  foldEffect,
  unfoldEffect,
  foldable,
  foldedRanges,
} from '@codemirror/language';
import {
  autocompletion,
  CompletionContext,
  CompletionResult,
  Completion,
} from '@codemirror/autocomplete';
import { tags } from '@lezer/highlight';
import { ParseError, DiagnosticMessage } from '@/lib/dsl/errors';
import { roomColors } from '@/lib/renderer/theme';

// Custom FPDL language definition using StreamLanguage
const fpdlLanguage = StreamLanguage.define({
  token(stream) {
    // Skip whitespace
    if (stream.eatSpace()) return null;

    // Line comments
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }

    // Strings
    if (stream.match('"')) {
      while (!stream.eol()) {
        if (stream.next() === '"') break;
      }
      return 'string';
    }

    // Colors
    if (stream.match(/#[0-9a-fA-F]+/)) {
      return 'color';
    }

    // Sizes: 3200*4000, 600*, *300
    if (stream.match(/\*[0-9]+/)) {
      return 'number';
    }
    if (stream.match(/[0-9]+\*[0-9]*/)) {
      return 'number';
    }
    if (stream.match(/[0-9]+/)) {
      return 'number';
    }

    // Keywords
    if (stream.match(/\b(plan|floor|room|space|stair|dimension|column|door)\b/)) {
      return 'keyword';
    }

    // Furniture keywords
    if (stream.match(/\b(stove|sink|fridge|toilet|shower|washer|dryer|sofa|tv|bed|table|chair|desk|wardrobe|plant|bathtub)\b/)) {
      return 'typeName';
    }

    // Property names
    if (stream.match(/\b(at|color|style|orientation|swing|label|width|depth|wall|walls|colsize|class)\b/)) {
      return 'propertyName';
    }

    // Identifiers
    if (stream.match(/[a-zA-Z_][a-zA-Z0-9_-]*/)) {
      return 'variableName';
    }

    // Braces
    if (stream.match(/[{}]/)) {
      return 'brace';
    }

    // Operators
    if (stream.match(/[=,.]/)) {
      return 'operator';
    }

    stream.next();
    return null;
  },
});

// --- Autocomplete ---
const STRUCTURE_KEYWORDS = ['plan', 'floor', 'room', 'space', 'stair', 'dimension', 'column', 'door'];
const FURNITURE_KEYWORDS = [
  'stove', 'sink', 'fridge', 'toilet', 'shower',
  'washer', 'dryer', 'sofa', 'tv', 'bed',
  'table', 'chair', 'desk', 'wardrobe', 'plant', 'bathtub',
];
const PROPERTY_NAMES = ['at', 'color', 'style', 'orientation', 'swing', 'label', 'width', 'depth', 'wall', 'walls', 'colsize', 'class'];
const STYLE_VALUES = ['solid', 'dashed'];
const STAIR_STYLE_VALUES = ['straight', 'l-shaped', 'u-shaped'];
const STAIR_ORIENTATION_VALUES = ['tb', 'bt', 'lr', 'rl'];
const DOOR_STYLE_VALUES = ['single', 'double', 'triple', 'quadruple', 'sliding'];
const DOOR_SWING_VALUES = ['in', 'out'];
const KEYWORD_SYNTAX: Record<string, string> = {
  plan: 'plan "Name" width=20000 depth=5000 wall=200 { ... }',
  floor: 'floor "Name" label="Label" 18000*5000 at=1000,0 { ... }',
  room: 'room "Name" 3200*4000 at=0,0 wall=150 color=#e8dfd0 { ... }',
  space: 'space "Name" 1500*5000 at=0,0 wall=150 walls=l { door class=l-600 }',
  stair: 'stair "Name" 1600*2600 at=0,0 style=straight orientation=tb',
  column: 'column "Name" at=1200,800 300*300',
  door: 'door "Name" 900* class=t-1200 style=single swing=out',
};

const keywordTooltip = hoverTooltip((view, pos) => {
  const line = view.state.doc.lineAt(pos);
  const offset = pos - line.from;
  const match = /[A-Za-z_][\w-]*/g;
  let result: RegExpExecArray | null;

  while ((result = match.exec(line.text)) !== null) {
    const start = result.index;
    const end = start + result[0].length;
    if (offset < start || offset > end) continue;

    const syntax = KEYWORD_SYNTAX[result[0]];
    if (!syntax) return null;

    return {
      pos: line.from + start,
      end: line.from + end,
      above: true,
      create() {
        const dom = document.createElement('div');
        dom.className = 'cm-fpdl-tooltip';
        dom.style.padding = '8px 10px';
        dom.style.maxWidth = '320px';
        dom.style.background = '#fdfaf4';
        dom.style.border = '1px solid #1a1614';
        dom.style.boxShadow = '0 4px 14px rgba(26,22,20,0.12)';
        dom.style.fontFamily = "'DM Mono', monospace";
        dom.style.fontSize = '11px';
        dom.style.color = '#1a1614';
        dom.textContent = syntax;
        return { dom };
      },
    };
  }

  return null;
});

// Parse sibling rooms/stairs in the same floor block, only before cursor position
function parseSiblingsInSameFloor(
  doc: string,
  cursorOffset: number,
): { name: string; x: number; y: number; w: number; h: number }[] {
  // Find which floor block the cursor is inside
  let floorStart = -1;
  let depth = 0;
  const floorStarts: { start: number; braceStart: number }[] = [];

  // Find all floor block ranges
  const floorHeaderRegex = /\bfloor\s+"[^"]*"[^{]*\{/g;
  let m;
  while ((m = floorHeaderRegex.exec(doc)) !== null) {
    floorStarts.push({ start: m.index, braceStart: m.index + m[0].length });
  }

  // For each floor, find its closing brace and check if cursor is inside
  for (const fs of floorStarts) {
    depth = 1;
    for (let i = fs.braceStart; i < doc.length; i++) {
      if (doc[i] === '{') depth++;
      if (doc[i] === '}') depth--;
      if (depth === 0) {
        if (cursorOffset >= fs.start && cursorOffset <= i) {
          floorStart = fs.braceStart;
        }
        break;
      }
    }
    if (floorStart !== -1) break;
  }

  if (floorStart === -1) return [];

  // Only parse top-level blocks that appear BEFORE the cursor within this floor.
  const floorText = doc.slice(floorStart, cursorOffset);
  const siblings: { name: string; x: number; y: number; w: number; h: number }[] = [];

  let depthInChildBlock = 0;
  let inString = false;
  let statement = '';

  const flushStatement = () => {
    const trimmed = statement.trim();
    statement = '';
    if (!trimmed) return;

    const blockMatch = trimmed.match(/^(room|space|stair)(?:\s+"([^"]*)")?(.*)$/);
    if (!blockMatch) return;

    const [, , rawName, rest] = blockMatch;
    const atMatch = rest.match(/\bat=(\d+),(\d+)/);
    if (!atMatch) return;

    const sizeMatch = rest.match(/\b(\d+)\*(\d*)\b/);
    const width = sizeMatch?.[1] ? parseInt(sizeMatch[1], 10) : 1000;
    const height = sizeMatch?.[2] ? parseInt(sizeMatch[2], 10) : 1000;

    siblings.push({
      name: rawName || 'unnamed',
      x: parseInt(atMatch[1], 10),
      y: parseInt(atMatch[2], 10),
      w: width,
      h: height,
    });
  };

  for (let i = 0; i < floorText.length; i++) {
    const ch = floorText[i];
    statement += ch;

    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === '{') {
      if (depthInChildBlock === 0) {
        statement = statement.slice(0, -1);
        flushStatement();
      }
      depthInChildBlock++;
      statement = '';
      continue;
    }

    if (ch === '}') {
      depthInChildBlock = Math.max(0, depthInChildBlock - 1);
      statement = '';
      continue;
    }

    if (depthInChildBlock === 0 && ch === '\n') {
      flushStatement();
    }
  }

  if (depthInChildBlock === 0) {
    flushStatement();
  }

  return siblings;
}

// Parse all named component names from the entire document (for corner references)
function parseAllComponentNames(doc: string): { name: string; type: string }[] {
  const results: { name: string; type: string }[] = [];
  const seen = new Set<string>();
  const nameRegex = /(room|space|stair|column)\s+"([^"]+)"/g;
  let match;
  while ((match = nameRegex.exec(doc)) !== null) {
    if (!seen.has(match[2])) {
      seen.add(match[2]);
      results.push({ name: match[2], type: match[1] });
    }
  }
  return results;
}

function fpdlAutocomplete(context: CompletionContext): CompletionResult | null {
  const { state, pos } = context;
  const line = state.doc.lineAt(pos);
  const textBefore = line.text.slice(0, pos - line.from);

  // After "style=" → suggest style values
  const styleMatch = textBefore.match(/style=(\w*)$/);
  if (styleMatch) {
    const prefix = styleMatch[1];
    const from = pos - prefix.length;
    const fullTextBefore = state.doc.sliceString(0, pos);
    const isStair = /stair\s[^}]*$/.test(fullTextBefore);
    const isDoor = /door\s[^}]*$/.test(fullTextBefore);
    const values = isDoor ? DOOR_STYLE_VALUES : isStair ? STAIR_STYLE_VALUES : STYLE_VALUES;
    return {
      from,
      options: values.map(v => ({ label: v, type: 'enum' })),
    };
  }

  const orientationMatch = textBefore.match(/orientation=([\w-]*)$/);
  if (orientationMatch) {
    const prefix = orientationMatch[1];
    const from = pos - prefix.length;
    const fullTextBefore = state.doc.sliceString(0, pos);
    const isStair = /stair\s[^}]*$/.test(fullTextBefore);
    if (!isStair) return null;
    return {
      from,
      options: STAIR_ORIENTATION_VALUES.map(v => ({ label: v, type: 'enum' })),
    };
  }

  const swingMatch = textBefore.match(/swing=([\w-]*)$/);
  if (swingMatch) {
    const prefix = swingMatch[1];
    const from = pos - prefix.length;
    const fullTextBefore = state.doc.sliceString(0, pos);
    const isDoor = /door\s[^}]*$/.test(fullTextBefore);
    if (!isDoor) return null;
    return {
      from,
      options: DOOR_SWING_VALUES.map(v => ({ label: v, type: 'enum' })),
    };
  }

  // After "class=" → suggest wall-offset patterns (for doors)
  const classMatch = textBefore.match(/class=([a-z0-9-]*)$/);
  if (classMatch) {
    const prefix = classMatch[1];
    const from = pos - prefix.length;
    return {
      from,
      options: [
        { label: 't-0', type: 'enum', detail: 'top wall, offset 0' },
        { label: 'b-0', type: 'enum', detail: 'bottom wall, offset 0' },
        { label: 'l-0', type: 'enum', detail: 'left wall, offset 0' },
        { label: 'r-0', type: 'enum', detail: 'right wall, offset 0' },
        { label: 't-1000', type: 'enum', detail: 'top wall, offset 1000' },
        { label: 'b-1000', type: 'enum', detail: 'bottom wall, offset 1000' },
        { label: 'l-500', type: 'enum', detail: 'left wall, offset 500' },
        { label: 'r-500', type: 'enum', detail: 'right wall, offset 500' },
      ],
    };
  }

  const wallsMatch = textBefore.match(/walls=([tblr]*)$/);
  if (wallsMatch) {
    const prefix = wallsMatch[1];
    const from = pos - prefix.length;
    return {
      from,
      options: [
        { label: 't', type: 'enum', detail: 'top wall' },
        { label: 'b', type: 'enum', detail: 'bottom wall' },
        { label: 'l', type: 'enum', detail: 'left wall' },
        { label: 'r', type: 'enum', detail: 'right wall' },
        { label: 'tb', type: 'enum', detail: 'top + bottom walls' },
        { label: 'lr', type: 'enum', detail: 'left + right walls' },
        { label: 'tblr', type: 'enum', detail: 'all walls' },
      ],
    };
  }

  // After "color=" → suggest room colors
  const colorMatch = textBefore.match(/color=(#?[0-9a-fA-F]*)$/);
  if (colorMatch) {
    const prefix = colorMatch[1];
    const from = pos - prefix.length;
    return {
      from,
      options: roomColors.map((c, i) => ({
        label: c,
        type: 'constant',
        detail: `palette ${i + 1}`,
        apply: c,
      })),
    };
  }

  // After "RoomName". → suggest corner positions (tl, tr, bl, br)
  const cornerMatch = textBefore.match(/"([^"]+)"\.(\w*)$/);
  if (cornerMatch) {
    const prefix = cornerMatch[2];
    const from = pos - prefix.length;
    const corners = ['tl', 'tr', 'bl', 'br'];
    return {
      from,
      options: corners.map(c => ({
        label: c,
        type: 'enum',
        detail: c === 'tl' ? 'top-left' : c === 'tr' ? 'top-right' : c === 'bl' ? 'bottom-left' : 'bottom-right',
      })),
    };
  }

  // After at=" → suggest component names for corner references
  const atQuoteMatch = textBefore.match(/at="([^"]*)$/);
  if (atQuoteMatch) {
    const prefix = atQuoteMatch[1];
    const from = pos - prefix.length;
    const fullDoc = state.doc.toString();
    const components = parseAllComponentNames(fullDoc);
    return {
      from,
      options: components.map(c => ({
        label: c.name,
        type: 'text',
        detail: c.type,
      })),
    };
  }

  // After "at=" → suggest smart positions from nearest 2 siblings in same floor
  const atMatch = textBefore.match(/at=([0-9,]*)$/);
  if (atMatch) {
    const prefix = atMatch[1];
    const fullDoc = state.doc.toString();
    const siblings = parseSiblingsInSameFloor(fullDoc, pos);
    const commaIndex = prefix.indexOf(',');
    const from = commaIndex === -1 ? pos - prefix.length : pos - (prefix.length - commaIndex - 1);
    const options: Completion[] = commaIndex === -1
      ? [{ label: '0,0', type: 'text', detail: 'origin' }]
      : [{ label: '0', type: 'text', detail: 'origin y' }];

    // Check if we're in a column context → also suggest "Name".corner references
    const fullTextBefore = state.doc.sliceString(0, pos);
    const isColumn = /column\s[^}]*$/.test(fullTextBefore);
    if (isColumn) {
      const components = parseAllComponentNames(fullDoc);
      for (const comp of components) {
        for (const corner of ['tl', 'tr', 'bl', 'br']) {
          const label = `"${comp.name}".${corner}`;
          const cornerDetail = corner === 'tl' ? 'top-left' : corner === 'tr' ? 'top-right' : corner === 'bl' ? 'bottom-left' : 'bottom-right';
          options.unshift({
            label,
            type: 'text',
            detail: `${cornerDetail} of ${comp.type} "${comp.name}"`,
            boost: 3,
          });
        }
      }
    }

    // Take only the last 2 siblings before cursor
    const nearest = siblings.slice(-2);
    const typedX = commaIndex === -1 ? null : prefix.slice(0, commaIndex);
    for (const sib of nearest.reverse()) {
      const rightX = sib.x + sib.w;
      const belowY = sib.y + sib.h;

      if (typedX === null) {
        options.unshift({
          label: `${rightX},${sib.y}`,
          type: 'text',
          detail: `right of "${sib.name}"`,
          boost: nearest.indexOf(sib) === 0 ? 2 : 1,
        });
        options.unshift({
          label: `${sib.x},${belowY}`,
          type: 'text',
          detail: `below "${sib.name}"`,
          boost: nearest.indexOf(sib) === 0 ? 2 : 1,
        });
        continue;
      }

      if (typedX === `${rightX}`) {
        options.unshift({
          label: `${sib.y}`,
          type: 'text',
          detail: `right of "${sib.name}" (${rightX},${sib.y})`,
          boost: nearest.indexOf(sib) === 0 ? 2 : 1,
        });
      }
      if (typedX === `${sib.x}`) {
        options.unshift({
          label: `${belowY}`,
          type: 'text',
          detail: `below "${sib.name}" (${sib.x},${belowY})`,
          boost: nearest.indexOf(sib) === 0 ? 2 : 1,
        });
      }
    }
    return { from, options };
  }

  // After "column " or "column "Name" " → suggest next attributes
  const columnDoneMatch = textBefore.match(/column\s+(?:"[^"]*"\s+)?(.*)$/);
  if (columnDoneMatch) {
    const afterColumn = columnDoneMatch[1];
    // If no at= yet, suggest at=
    if (!/at=/.test(afterColumn) && /\s$/.test(textBefore)) {
      return {
        from: pos,
        options: [
          { label: 'at=', type: 'property', detail: 'position', boost: 3 },
        ],
      };
    }
    // If at= is done but no size yet, suggest a size
    if (/at=\S+\s+$/.test(afterColumn) && !/\d+\*/.test(afterColumn)) {
      const fullDoc = state.doc.toString();
      // Try to find plan colsize default
      const colsizeMatch = fullDoc.match(/colsize=(\d+\*\d*)/);
      const defaultSize = colsizeMatch ? colsizeMatch[1] : '200*200';
      return {
        from: pos,
        options: [
          { label: defaultSize, type: 'text', detail: 'default column size', boost: 2 },
          { label: '200*200', type: 'text', detail: 'size' },
          { label: '300*300', type: 'text', detail: 'size' },
        ],
      };
    }
  }

  // After "room " → suggest next attributes flow
  const roomDoneMatch = textBefore.match(/room\s+(?:"[^"]*"\s+)?(.*)$/);
  if (roomDoneMatch) {
    const afterRoom = roomDoneMatch[1];
    if (!/at=/.test(afterRoom) && /\s$/.test(textBefore)) {
      return {
        from: pos,
        options: [
          { label: 'at=', type: 'property', detail: 'position', boost: 3 },
        ],
      };
    }
  }

  // Word-level completions
  const wordMatch = textBefore.match(/([a-zA-Z_][\w-]*)$/);
  if (!wordMatch) return null;

  const prefix = wordMatch[1];
  const from = pos - prefix.length;

  // Determine context from surrounding text
  const fullTextBefore = state.doc.sliceString(0, pos);
  const options: Completion[] = [];

  // Inside a room block → suggest furniture + stair
  const insideRoom = /room\s+"[^"]*"[^}]*\{[^}]*$/.test(fullTextBefore);
  // Inside a floor block → suggest room + stair
  const insideFloor = /floor\s+"[^"]*"[^}]*\{[^}]*$/.test(fullTextBefore) && !insideRoom;
  // Inside a plan block → suggest floor
  const insidePlan = /plan\s+"[^"]*"[^}]*\{[^}]*$/.test(fullTextBefore) && !insideFloor && !insideRoom;
  // At top level
  const atTopLevel = !insideRoom && !insideFloor && !insidePlan;

  if (atTopLevel) {
    options.push({ label: 'plan', type: 'keyword', boost: 3 });
  }
  if (insidePlan) {
    options.push({ label: 'floor', type: 'keyword', boost: 3 });
    options.push({ label: 'column', type: 'keyword', detail: 'structural pillar', boost: 1 });
  }
  if (insideFloor) {
    options.push({ label: 'room', type: 'keyword', boost: 3 });
    options.push({ label: 'space', type: 'keyword', detail: 'open area (no walls)', boost: 2 });
    options.push({ label: 'stair', type: 'keyword', boost: 2 });
  }
  if (insideRoom) {
    for (const f of FURNITURE_KEYWORDS) {
      options.push({ label: f, type: 'keyword', detail: 'furniture' });
    }
    options.push({ label: 'door', type: 'keyword', detail: 'door opening', boost: 2 });
    options.push({ label: 'stair', type: 'keyword' });
  }

  // Property names (available after a size or property context)
  for (const p of PROPERTY_NAMES) {
    options.push({ label: p, type: 'property' });
  }

  // Filter by prefix
  const filtered = options.filter(o => o.label.startsWith(prefix) && o.label !== prefix);
  if (filtered.length === 0) return null;

  return { from, options: filtered };
}

const fpdlHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#7c3aed', fontWeight: 'bold' },
  { tag: tags.typeName, color: '#0891b2' },
  { tag: tags.string, color: '#059669' },
  { tag: tags.number, color: '#d97706' },
  { tag: tags.comment, color: '#9ca3af', fontStyle: 'italic' },
  { tag: tags.propertyName, color: '#dc2626' },
  { tag: tags.brace, color: '#64748b' },
  { tag: tags.operator, color: '#64748b' },
  { tag: tags.color, color: '#8b5cf6' },
  { tag: tags.variableName, color: '#1a1614' },
]);

// --- Code Folding ---
const fpdlFoldService = foldService.of((state, lineStart, _lineEnd) => {
  const line = state.doc.lineAt(lineStart);
  const text = line.text;

  // Find an opening brace on this line (not inside a string)
  let inString = false;
  let hasBrace = false;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"') inString = !inString;
    if (text[i] === '{' && !inString) {
      hasBrace = true;
      break;
    }
  }
  if (!hasBrace) return null;

  // Scan forward to find the matching closing brace
  let depth = 0;
  inString = false;
  for (let pos = lineStart; pos < state.doc.length; ) {
    const ch = state.doc.sliceString(pos, pos + 1);
    if (ch === '"') inString = !inString;
    if (!inString) {
      if (ch === '{') depth++;
      if (ch === '}') {
        depth--;
        if (depth === 0) {
          const closeLine = state.doc.lineAt(pos);
          if (closeLine.number > line.number) {
            return { from: line.to, to: closeLine.from - 1 };
          }
          return null;
        }
      }
    }
    pos++;
  }
  return null;
});

// --- Error Highlighting ---
const setErrorLines = StateEffect.define<number[]>();

const errorLineDeco = Decoration.line({ class: 'cm-error-line' });

class ErrorGutterMarker extends GutterMarker {
  toDOM() {
    const el = document.createElement('div');
    el.className = 'cm-error-gutter-dot';
    el.textContent = '\u25CF'; // filled circle
    return el;
  }
}
const errorMarker = new ErrorGutterMarker();

const errorLineField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decos, tr) {
    // Clear on doc change
    if (tr.docChanged) return Decoration.none;
    for (const e of tr.effects) {
      if (e.is(setErrorLines)) {
        const lines = e.value;
        const decorations: { from: number; deco: Decoration }[] = [];
        for (const lineNum of lines) {
          if (lineNum >= 1 && lineNum <= tr.state.doc.lines) {
            const line = tr.state.doc.line(lineNum);
            decorations.push({ from: line.from, deco: errorLineDeco });
          }
        }
        decorations.sort((a, b) => a.from - b.from);
        return Decoration.set(decorations.map(d => d.deco.range(d.from)));
      }
    }
    return decos;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const errorLineGutter = gutter({
  class: 'cm-error-gutter',
  lineMarker(view, line) {
    const decos = view.state.field(errorLineField);
    let hasError = false;
    decos.between(line.from, line.from, () => {
      hasError = true;
    });
    return hasError ? errorMarker : null;
  },
});

// --- Warning Highlighting ---
const setWarningLines = StateEffect.define<number[]>();

const warningLineDeco = Decoration.line({ class: 'cm-warning-line' });

class WarningGutterMarker extends GutterMarker {
  toDOM() {
    const el = document.createElement('div');
    el.className = 'cm-warning-gutter-icon';
    el.textContent = '\u26A0'; // warning triangle
    return el;
  }
}
const warningMarker = new WarningGutterMarker();

const warningLineField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decos, tr) {
    if (tr.docChanged) return Decoration.none;
    for (const e of tr.effects) {
      if (e.is(setWarningLines)) {
        const lines = e.value;
        const decorations: { from: number; deco: Decoration }[] = [];
        for (const lineNum of lines) {
          if (lineNum >= 1 && lineNum <= tr.state.doc.lines) {
            const line = tr.state.doc.line(lineNum);
            decorations.push({ from: line.from, deco: warningLineDeco });
          }
        }
        decorations.sort((a, b) => a.from - b.from);
        return Decoration.set(decorations.map(d => d.deco.range(d.from)));
      }
    }
    return decos;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const warningLineGutter = gutter({
  class: 'cm-warning-gutter',
  lineMarker(view, line) {
    const decos = view.state.field(warningLineField);
    let hasWarning = false;
    decos.between(line.from, line.from, () => {
      hasWarning = true;
    });
    return hasWarning ? warningMarker : null;
  },
});

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13px',
    fontFamily: "'DM Mono', monospace",
  },
  '.cm-content': {
    padding: '12px 0',
    caretColor: '#1a1614',
  },
  '.cm-gutters': {
    backgroundColor: '#f5f0e8',
    color: '#5c5048',
    border: 'none',
    borderRight: '1px solid #d4cfc8',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#e8dfd0',
  },
  '.cm-activeLine': {
    backgroundColor: '#f5f0e820',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#1a1614',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#dde0ea60',
  },
  '.cm-foldPlaceholder': {
    backgroundColor: '#e8dfd0',
    border: '1px solid #d4cfc8',
    color: '#5c5048',
    padding: '0 4px',
    borderRadius: '2px',
    fontFamily: "'DM Mono', monospace",
    fontSize: '11px',
  },
  '.cm-foldGutter .cm-gutterElement': {
    cursor: 'pointer',
    color: '#5c5048',
    padding: '0 2px',
    fontSize: '11px',
  },
  '.cm-error-gutter': {
    width: '12px',
  },
  '.cm-error-gutter .cm-gutterElement': {
    color: '#dc2626',
    fontSize: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '.cm-tooltip-autocomplete': {
    backgroundColor: '#fdfaf4',
    border: '1px solid #d4cfc8',
    borderRadius: '4px',
    fontFamily: "'DM Mono', monospace",
    fontSize: '12px',
  },
  '.cm-tooltip-autocomplete ul li': {
    padding: '2px 8px',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: '#e8dfd0',
    color: '#1a1614',
  },
  '.cm-completionLabel': {
    color: '#1a1614',
  },
  '.cm-completionDetail': {
    color: '#8b6f5e',
    fontStyle: 'italic',
    marginLeft: '8px',
  },
  '.cm-warning-gutter': {
    width: '14px',
  },
  '.cm-warning-gutter .cm-gutterElement': {
    fontSize: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: '1',
  },
});

interface Props {
  value: string;
  onChange: (value: string) => void;
  errors?: ParseError[];
  warnings?: DiagnosticMessage[];
  activeFloorIndex?: number;
}

export default function CodeEditor({ value, onChange, errors, warnings, activeFloorIndex }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        foldGutter(),
        fpdlFoldService,
        errorLineField,
        errorLineGutter,
        warningLineField,
        warningLineGutter,
        autocompletion({
          override: [fpdlAutocomplete],
          activateOnTyping: true,
          defaultKeymap: true,
        }),
        keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap]),
        fpdlLanguage,
        syntaxHighlighting(fpdlHighlight),
        keywordTooltip,
        editorTheme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update content externally (e.g., from AI generation)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentValue = view.state.doc.toString();
    if (currentValue !== value) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value },
      });
    }
  }, [value]);

  // Update error highlighting when errors change
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const lineNums = (errors ?? []).map((e) => e.line);
    view.dispatch({
      effects: setErrorLines.of(lineNums),
    });
  }, [errors]);

  // Update warning highlighting when warnings change
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const lineNums = (warnings ?? []).map((w) => w.line);
    view.dispatch({
      effects: setWarningLines.of(lineNums),
    });
  }, [warnings]);

  // Fold/unfold floors based on active floor tab
  useEffect(() => {
    const view = viewRef.current;
    if (!view || activeFloorIndex === undefined || activeFloorIndex < 0) return;

    const doc = view.state.doc;
    const effects: StateEffect<unknown>[] = [];

    // Find all "floor" lines
    let floorIdx = 0;
    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const trimmed = line.text.trimStart();
      if (/^floor\s/.test(trimmed)) {
        const range = foldable(view.state, line.from, line.to);
        if (range) {
          if (floorIdx === activeFloorIndex) {
            // Unfold the selected floor
            const folded = foldedRanges(view.state);
            let isFolded = false;
            folded.between(range.from, range.from, () => { isFolded = true; });
            if (isFolded) {
              effects.push(unfoldEffect.of({ from: range.from, to: range.to }));
            }
          } else {
            // Fold non-selected floors
            const folded = foldedRanges(view.state);
            let isFolded = false;
            folded.between(range.from, range.from, () => { isFolded = true; });
            if (!isFolded) {
              effects.push(foldEffect.of({ from: range.from, to: range.to }));
            }
          }
        }
        floorIdx++;
      }
    }

    if (effects.length > 0) {
      view.dispatch({ effects });
      // Scroll the selected floor into view
      for (let i = 1; i <= doc.lines; i++) {
        const line = doc.line(i);
        if (/^\s*floor\s/.test(line.text)) {
          if (floorIdx === 0) break; // safety
        }
      }
      // Find the active floor line and scroll to it
      let fi = 0;
      for (let i = 1; i <= doc.lines; i++) {
        const line = doc.line(i);
        if (/^\s*floor\s/.test(line.text)) {
          if (fi === activeFloorIndex) {
            view.dispatch({
              effects: EditorView.scrollIntoView(line.from, { y: 'start', yMargin: 20 }),
            });
            break;
          }
          fi++;
        }
      }
    }
  }, [activeFloorIndex]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto"
      style={{ backgroundColor: '#fdfaf4' }}
    />
  );
}
