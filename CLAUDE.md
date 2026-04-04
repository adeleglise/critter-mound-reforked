# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Critter Mound is an incremental browser game featuring critter breeding, worker management, combat, and prestige mechanics. The project is undergoing modernization from a 2014-era codebase to modern web standards while maintaining backward compatibility.

**Current Status**: Phase 1 Complete (Foundation & Tooling)

## Development Commands

### Modern Development (Vite)
```bash
# Install dependencies
npm install

# Start development server with hot module replacement
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Format code
npm run format

# Lint JavaScript
npm run lint
```

The dev server automatically opens at `http://localhost:3000` with hot module replacement enabled.

### Legacy Development
Alternatively, open `index.html` directly or run:
```bash
python3 -m http.server 3000
```

## Architecture

### Technology Stack

**Current (Hybrid Legacy/Modern)**:
- **Build System**: Vite 5.4 (modern dev server with HMR)
- **MVVM Framework**: Knockout.js 3.1.0 (legacy, still in use)
- **DOM Manipulation**: jQuery 2.1.1 (legacy dependencies)
- **UI Libraries**: Tipped.js (tooltips), SimpleModal (modals), Notify.js (notifications)
- **Styling**: Modern CSS with custom properties, organized architecture

**Build Configuration**:
- Vite config at [vite.config.js](vite.config.js) with path aliases (`@`, `@styles`, `@assets`)
- PostCSS with autoprefixer for browser compatibility
- Source maps enabled for debugging
- GitHub Pages base path handling

### Core Game Architecture

**Game Logic** ([public/scripts/Game.js](public/scripts/Game.js) - ~2,140 lines):
- Main `GameController` function with Knockout.js observables
- Game loop runs at 20 ticks per second (`ticksPerSecond = 20`)
- Key systems:
  - **Breeding System**: Trait inheritance, mutations, genetic scoring
  - **Resource Management**: Dirt, grass, sod production and consumption
  - **Worker System**: Miners, farmers, carriers, factories
  - **Combat System**: Army management, battles, levels
  - **Prestige Mechanics**: Heir system (princesses/princes)

**Key Functions**:
- `StatVariance(n)`: Calculate stat variance for breeding
- `MutationCheck(n,t)`: Determine mutation probability
- `LevelFromXp(n)`: Convert XP to level (max 99)
- `Shuffle(n)`: Randomize arrays

**UI Controller** ([public/scripts/Site.js](public/scripts/Site.js) - ~102 lines):
- jQuery-based UI interactions
- Tooltip management with Tipped.js (refreshes every 500ms)
- Event handlers for critter selection, shift-key modifiers
- Save/load functionality (localStorage + base64 export/import)

**Data Binding**:
- Knockout.js MVVM pattern throughout
- All game state is observable/computed observables
- HTML templates use `data-bind` attributes extensively
- Automatic UI updates when observables change

### Project Structure

```
critter-mound/
├── src/
│   ├── styles/              # Modern CSS architecture
│   │   ├── main.css         # Entry point
│   │   ├── variables.css    # Design tokens (colors, spacing, etc.)
│   │   ├── base.css         # Reset & global styles
│   │   ├── typography.css   # Font styles
│   │   ├── layout.css       # Page structure, grid
│   │   ├── tipped.css       # Tooltip library styles
│   │   └── components/      # Component-specific styles
│   └── assets/              # Images & icons
├── public/
│   └── scripts/             # Game scripts (single source of truth)
│       ├── Game.js          # Core game logic (~2,140 lines)
│       ├── Site.js          # UI interactions (~102 lines)
│       ├── Worker.js        # Web Worker for game tick
│       ├── theme.js         # Dark mode toggle
│       ├── tabcontent.js    # Tab switching
│       └── [vendor libs]    # jQuery, Knockout, Tipped, etc.
├── index.html               # Main game file (~1,000+ lines with templates)
├── vite.config.js           # Build configuration
├── compose.yml              # Podman dev + prod services
├── Containerfile            # Multi-stage production build
└── package.json
```

### CSS Architecture

Modern CSS with design tokens organized by concern:

- **variables.css**: CSS custom properties (colors, spacing, transitions, shadows)
- **base.css**: Resets, box-sizing, body defaults
- **typography.css**: Font families, sizes, weights
- **layout.css**: Page structure, containers, grids
- **components/**: Buttons, tables, tabs, modals, cards, etc.

**Dark Mode**: Implemented via `data-theme="dark"` attribute with CSS custom properties. Theme toggle in [public/scripts/theme.js](public/scripts/theme.js).

**Path Aliases** (Vite):
- `@` → `./src`
- `@styles` → `./src/styles`
- `@assets` → `./src/assets`

## Deployment

### GitHub Pages
Automatically deploys on push to main/master via `.github/workflows/deploy-pages.yml`.

**Setup**: Go to Settings → Pages → Source: "GitHub Actions"

### Docker
```bash
# Build image
docker build -t critter-mound .

# Run container
docker run -d -p 8080:80 critter-mound

# Or use published image
docker pull ghcr.io/<username>/<repository-name>:main
docker run -d -p 8080:80 ghcr.io/<username>/<repository-name>:main
```

Auto-builds via `.github/workflows/docker-build-push.yml` on push to main/master.

## Modernization Context

**Phase 1 Complete** (Foundation & Tooling):
- Modern build system (Vite)
- Organized CSS with design tokens
- Dark mode support
- Code quality tools (Prettier, ESLint)

**Upcoming Phases** (see [MODERNIZATION_PLAN.md](MODERNIZATION_PLAN.md)):
- Phase 2: Visual refresh with modern color scheme
- Phase 3: Responsive layout for mobile/tablet
- Phase 4: Animations, accessibility improvements
- Phase 5: Optional framework migration (Vue 3 recommended)

## Important Constraints

### Legacy Code Preservation
- Knockout.js observables drive all game state - maintain compatibility
- jQuery used extensively for DOM manipulation and events
- Game loop timing (`ticksPerSecond = 20`) is critical for balance
- Save/load system uses base64 encoding - don't break existing saves

### Game Balance
- Mutation rates, stat variance, and XP formulas are tuned - changes affect gameplay
- Max values: traits = 999,999, genes = 100, level = 99
- Worker/army mechanics balanced around specific rates

### Build System
- Vite handles both legacy scripts (in `public/`) and modern source (in `src/`)
- Production builds must work on GitHub Pages with base path `/critter-mound-reforked/`
- Legacy scripts remain in both `Scripts/` (old) and `public/scripts/` (new) for compatibility

## Development Guidelines

1. **Use Vite dev server** (`npm run dev`) for development - don't edit files in `dist/`
2. **Follow CSS architecture** - use variables from `variables.css`, add new styles to appropriate component files
3. **Run formatters before commits** - `npm run format`
4. **Test dark mode** - toggle with theme button (top-right)
5. **Preserve Knockout bindings** - game state management relies on observables
6. **Check on multiple screen sizes** - modernization plan targets mobile responsiveness

## Common Tasks

### Adding a New Critter Trait
1. Add observable in `GameController` constructor ([Game.js](public/scripts/Game.js))
2. Add to breeding logic in relevant functions
3. Add to UI templates in [index.html](index.html) with `data-bind`
4. Update sorting arrays if needed (`this.sorts`, `this.armySorts`)

### Modifying Game Balance
- Stat variance: `StatVariance()` function
- Mutation rates: `MutationCheck()` function
- Upgrade costs: `UpgradeCost()` function
- Level progression: `LevelFromXp()` function

### Styling Changes
1. Use CSS custom properties from [src/styles/variables.css](src/styles/variables.css)
2. Add component-specific styles to [src/styles/components/](src/styles/components/)
3. Maintain both light and dark mode variants
4. Test theme toggle functionality

### Save System
- Auto-saves to localStorage every tick
- Export/import uses base64 encoding via `game.Save()` and `game.Load()`
- Format changes must maintain backward compatibility
