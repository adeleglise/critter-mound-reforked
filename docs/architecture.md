# Architecture

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Build System | Vite 5.4 |
| MVVM Framework | Knockout.js 3.x |
| DOM Manipulation | jQuery 3.x |
| Tooltips | Tipped.js |
| Modals | SimpleModal |
| Notifications | Notify.js |
| Styling | CSS custom properties with design tokens |
| Testing | Playwright |

## Project Structure

```
critter-mound/
├── src/
│   ├── styles/              # Modern CSS architecture
│   │   ├── main.css         # Entry point
│   │   ├── variables.css    # Design tokens
│   │   ├── base.css         # Reset & global styles
│   │   ├── typography.css   # Font styles
│   │   ├── layout.css       # Page structure
│   │   └── components/      # Component-specific styles
│   ├── scripts/
│   │   ├── Game.js          # Core game logic (~2,215 lines)
│   │   ├── Site.js          # UI interactions
│   │   └── theme.js         # Dark mode toggle
│   └── assets/              # Images & icons
├── public/
│   └── scripts/             # Legacy scripts for compatibility
├── index.html               # Main game file with Knockout templates
├── vite.config.js           # Build configuration
└── package.json
```

## Core Systems

### Game Loop

The game runs at **20 ticks per second** (`ticksPerSecond = 20`). Each tick updates resources, processes breeding, and advances combat.

### Data Binding

All game state uses Knockout.js observables and computed observables. The HTML templates use `data-bind` attributes for automatic UI updates.

### Save System

- Auto-saves to `localStorage` every tick
- Export/import via base64 encoding (`game.Save()` / `game.Load()`)
- Backward compatibility is critical — format changes must not break existing saves

### CSS Architecture

Modern CSS with design tokens in `variables.css`:

- CSS custom properties for colors, spacing, transitions, shadows
- Component-scoped styles in `src/styles/components/`
- Dark mode via `data-theme="dark"` attribute on the root element

## Vite Path Aliases

| Alias | Path |
|-------|------|
| `@` | `./src` |
| `@styles` | `./src/styles` |
| `@scripts` | `./src/scripts` |
| `@assets` | `./src/assets` |
