# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [2.1.0] - 2026-04-04

### Added
- Complete game design document (`docs/GAME_DESIGN.md`) covering all mechanics, balancing formulas, and progression phases
- Local development guide (`docs/LOCAL_DEVELOPMENT.md`) with Podman setup
- Multi-stage `Containerfile` for production builds (node:18 -> nginx:alpine)
- `compose.yml` with dev (HMR on port 6007) and prod (nginx on port 8080) services
- `nginx.conf` with gzip, caching, and SPA fallback
- CSS animations: smooth progress bars, critter birth glow, battle damage flash, button hover effects
- Responsive mobile layout: scrollable tabs, Queen/King sub-tab switching, touch-friendly 44px buttons
- Tabular number formatting for aligned stat columns

### Changed
- Consolidated game scripts to single `public/scripts/` directory (removed duplicate `Scripts/` and `src/scripts/`)
- Modernized color palette with softer, less saturated hues and full dark mode support
- Replaced all hard-coded hex colors with CSS custom properties
- Improved table spacing and typography (15px base font)
- Enhanced active tab styling with bold weight and shadow
- Updated Backstage metadata and TechDocs navigation
- Dev server port changed from 3000 to 6007

### Fixed
- Game UI crash: `gameFormatNumber is not defined` (Site.js loading order in `<head>`)
- Worker.js path casing (`Scripts/` -> `/scripts/`) for Linux compatibility

### Removed
- Old `Dockerfile` (replaced by `Containerfile`)
- Unintegrated dead code: PrestigeSystem, EventSystem, AutoAssignWorkers, achievementBonus (available in git history at commit `950b6bd`)
- `@scripts` Vite path alias (directory no longer exists)

## [2.0.0] - 2026

### Added
- Vite 5.4 build system with hot module replacement
- Modern CSS architecture with design tokens and custom properties
- Dark mode toggle with `data-theme` attribute
- Prettier and ESLint for code quality
- GitHub Pages deployment via GitHub Actions
- Playwright test infrastructure
- Path aliases (`@`, `@styles`, `@assets`)

### Changed
- Reorganized project structure into `src/` layout
- Migrated styles from inline/legacy CSS to modular component files
- Typography refresh
- Legacy scripts moved to `public/scripts/` for Vite compatibility

## [1.0.0] - Original release

### Added
- Core critter breeding with trait inheritance and mutations
- Resource management (dirt, grass, sod)
- Worker system (miners, farmers, carriers, factories)
- Combat system with army management
- Save/load system with localStorage and base64 export
- Knockout.js MVVM data binding
