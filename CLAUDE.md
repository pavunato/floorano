# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js 16 + Turbopack)
npm run build        # Production build (also runs type checking)
npm run lint         # ESLint
npx tsc --noEmit     # Type-check without emitting
```

No test framework is configured.

## Architecture

This is a **Floor Plan Definition Language (FPDL)** editor — a Next.js app where users write DSL code that renders as SVG floor plans in real-time.

### DSL Pipeline (`src/lib/dsl/`)

Classic compiler pipeline: **Lexer → Parser → Validator → Renderer**

- **lexer.ts**: Tokenizes FPDL source. Special tokens: sizes (`3200*4000`, `600*`, `*300`), colors (`#hex`), keywords.
- **parser.ts**: Recursive descent parser producing an AST. Node hierarchy: `PlanNode → FloorNode → RoomNode|SpaceNode|StairNode → FurnitureNode|DoorNode|StairNode`.
- **validate.ts**: Bounds checking and overlap detection. Returns warnings (non-fatal).
- **types.ts**: All AST node interfaces. Every node carries `line`/`col` for error reporting.
- **defaults.ts**: Default furniture sizes and door dimensions (all in millimeters).
- **errors.ts**: `ParseError` and `DiagnosticMessage` types.

### Rendering (`src/lib/renderer/`)

- **layout-engine.ts**: Converts mm coordinates to SVG units. Key functions: `mmToSvg()`, `toSvgCoords()`, `toSvgSize()`, `computeViewBox()`. Scale factor is based on plan width.
- **theme.ts**: Color palette, fonts, room color cycling via `getDefaultRoomColor()`.

### SVG Components (`src/components/svg/`)

- **FloorPlanSVG.tsx**: Root SVG renderer. Handles dimension lines (smart edge-based segmentation), overlap cross-hatch, columns, and delegates to child components.
- **RoomRect.tsx**: Renders rooms AND spaces. Rooms get walls (configurable thickness); spaces get dashed borders with no fill. Also renders door children using `DoorSymbol`.
- **DoorSymbol.tsx**: Three styles — single (arc swing), double (mirrored arcs), sliding (dashed track + arrow).
- **FurnitureSymbol.tsx**: Dispatches to individual symbol components in `svg/symbols/`.
- **StairSymbol.tsx**: Three stair styles (straight, L-shaped, U-shaped).

### UI Components (`src/components/`)

- **EditorLayout.tsx**: Split-pane container (horizontal/vertical toggle) managing CodeEditor + Preview.
- **CodeEditor.tsx**: CodeMirror 6 editor with custom FPDL syntax highlighting, context-aware autocomplete, error/warning gutter markers, and code folding.
- **Preview.tsx**: SVG preview with floor tabs, export, and dimension toggle.

### Hooks (`src/hooks/`)

- **useParser.ts**: Debounced (300ms) parsing hook. Returns `{ ast, errors, warnings, overlaps }`.

### API (`src/app/api/generate/`)

AI floor plan generation via OpenRouter API. System prompt in `src/lib/ai/prompt-template.ts` teaches the LLM FPDL syntax.

## Key Conventions

- All spatial dimensions are in **millimeters** in the DSL; converted to SVG units only at render time.
- The coordinate origin is top-left. Room positions are relative to the floor (plan boundary); furniture positions are relative to the parent room.
- Parser supports positional references: `at="RoomName".tl` (corners: tl, tr, bl, br).
- Size syntax supports partial expansion: `600*` = specified width, full parent depth; `*300` = full parent width, specified depth.
- Doors use `class=WALL-OFFSET` syntax (e.g., `class=t-1000` = top wall, 1000mm from left edge).
- When adding a new keyword: update `KEYWORDS` set in lexer.ts, add parser function, update `types.ts`, and add to CodeEditor autocomplete + syntax highlighting regex.

## Style

See `STYLE.md` for the full palette. Key values:
- Background: `#f5f0e8`, Paper: `#fdfaf4`, Ink: `#1a1614`
- Fonts: DM Sans (body), DM Mono (code)
- Tailwind 4 with inline `@theme` configuration in `globals.css`
