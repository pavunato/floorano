# Floor Plan Editor - Style Guide

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| `--bg` | `#f5f0e8` | Background |
| `--paper` | `#fdfaf4` | Paper/Card surfaces |
| `--ink` | `#1a1614` | Primary text |
| `--ink-light` | `#5c5048` | Secondary text |
| `--wall` | `#2a2420` | Walls/Borders |
| `--wall-fill` | `#d4cfc8` | Wall fills, dividers |
| `--accent` | `#8b6f5e` | Primary accent |
| `--accent2` | `#5e7b6f` | Secondary accent |

## Typography

- **Sans-serif**: `DM Sans` (default body text)
- **Monospace**: `DM Mono` (code/editor)

## Tailwind Theme

```css
@theme inline {
  --color-background: var(--bg);
  --color-foreground: var(--ink);
  --font-sans: 'DM Sans', sans-serif;
  --font-mono: 'DM Mono', monospace;
}
```

## CodeMirror Theme

### Error Line
- Background: `#fee2e2`
- Border-left: `3px solid #dc2626`

### Warning Line
- Background: `#fef3c7`
- Border-left: `3px solid #d97706`

## Scrollbar

- Width/Height: `6px`
- Track: `var(--bg)`
- Thumb: `var(--wall-fill)`
- Thumb hover: `var(--ink-light)`
