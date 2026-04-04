# Architecture

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Build System | Vite 5.4 |
| MVVM Framework | Knockout.js 3.x |
| DOM Manipulation | jQuery 2.x |
| Tooltips | Tipped.js |
| Modals | SimpleModal |
| Notifications | Notify.js |
| Styling | CSS custom properties with design tokens |
| Testing | Playwright |
| Container | Podman / Docker (nginx:alpine) |

## Project Structure

```
critter-mound/
├── src/
│   ├── styles/              # Modern CSS architecture
│   │   ├── main.css         # Entry point (imports all)
│   │   ├── variables.css    # Design tokens (colors, spacing, etc.)
│   │   ├── base.css         # Reset & global styles
│   │   ├── typography.css   # Font styles & tabular nums
│   │   ├── layout.css       # Page structure, tabs, progress bars
│   │   ├── tipped.css       # Tooltip library styles
│   │   └── components/      # Component-specific styles
│   │       ├── buttons.css
│   │       ├── tables.css
│   │       ├── modals.css
│   │       ├── theme-toggle.css
│   │       ├── animations.css   # Transitions & keyframes
│   │       └── responsive.css   # Mobile layout (<768px)
│   └── assets/              # Images & icons
├── public/
│   └── scripts/             # Game scripts (single source of truth)
│       ├── Game.js          # Core game logic (~2,131 lines)
│       ├── Site.js          # UI interactions & mobile sub-tabs
│       ├── Worker.js        # Web Worker for game tick
│       ├── theme.js         # Dark mode toggle
│       ├── tabcontent.js    # Tab switching
│       └── [vendor libs]    # jQuery, Knockout, Tipped, etc.
├── index.html               # Main game file with Knockout templates
├── vite.config.js           # Build configuration
├── compose.yml              # Podman dev + prod services
├── Containerfile            # Multi-stage production build
├── nginx.conf               # Production nginx config
└── package.json
```

## Core Systems

### Game Loop

The game runs at **20 ticks per second** (`ticksPerSecond = 20`). Each tick updates resources, processes breeding, and advances combat.

### Data Binding

All game state uses Knockout.js observables and computed observables. The HTML templates use `data-bind` attributes for automatic UI updates.

### Save System

- Auto-saves to `localStorage` every 60 seconds
- Export/import via base64 encoding (`game.Save()` / `game.Load()`)
- Backward compatibility is critical -- format changes must not break existing saves

### CSS Architecture

Modern CSS with design tokens in `variables.css`:

- CSS custom properties for colors, spacing, transitions, shadows
- Component-scoped styles in `src/styles/components/`
- Dark mode via `data-theme="dark"` attribute on the root element
- Responsive mobile layout with sub-tab navigation for Queen/King
- Smooth animations for progress bars, critter births, and battle events

## Vite Path Aliases

| Alias | Path |
|-------|------|
| `@` | `./src` |
| `@styles` | `./src/styles` |
| `@assets` | `./src/assets` |
