# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [2.0.0] - 2026

### Added
- Vite 5.4 build system with hot module replacement
- Modern CSS architecture with design tokens and custom properties
- Dark mode toggle with `data-theme` attribute
- Prettier and ESLint for code quality
- GitHub Pages deployment via GitHub Actions
- Docker deployment with Nginx
- Playwright test infrastructure
- Path aliases (`@`, `@styles`, `@scripts`, `@assets`)

### Changed
- Reorganized project structure into `src/` layout
- Migrated styles from inline/legacy CSS to modular component files
- Typography refresh
- Legacy scripts moved to `public/scripts/` for Vite compatibility

## [1.1.0] - Pre-fork enhancements

### Added
- Prestige system (princesses/princes heir mechanics)
- Events system
- Auto-worker system

### Changed
- Increased max mound upgrades to 10
- Increased level cap

### Fixed
- Typos in "How to play" section
- Broken star image URL

## [1.0.0] - Original release

### Added
- Core critter breeding with trait inheritance and mutations
- Resource management (dirt, grass, sod)
- Worker system (miners, farmers, carriers, factories)
- Combat system with army management
- Save/load system with localStorage and base64 export
- Knockout.js MVVM data binding
