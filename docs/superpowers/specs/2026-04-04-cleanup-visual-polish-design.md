# Phase 2: Cleanup & Visual Polish - Design Spec

## Overview

Cleanup the codebase (remove duplicates, dead code) then apply visual polish (modern colors, typography, animations, responsive layout). Sequential execution: cleanup first, then polish.

## Part 1: Cleanup

### 1a. Remove Duplicate Script Directories

**Current state:** Three copies of game scripts exist:
- `Scripts/` (uppercase, original upstream legacy)
- `src/scripts/` (source copy, mostly identical to public)
- `public/scripts/` (Vite public dir, what the game actually loads)

**Action:** Delete `Scripts/` and `src/scripts/`. `public/scripts/` becomes the single source of truth.

**Files to delete:**
- `Scripts/` directory (entire directory)
- `src/scripts/` directory (entire directory)

**Files to update:**
- `vite.config.js`: Remove `@scripts` alias (no longer valid). Keep `@styles` and `@assets`.
- `CLAUDE.md`: Update project structure section to reflect single `public/scripts/` location.
- `.eslintrc.js` or equivalent: Update if it references `src/scripts/`.

### 1b. Remove Unintegrated Dead Code

Delete the following from `public/scripts/Game.js`:

- **`achievementBonus` computed** (lines ~364-372): Not referenced by any game logic or UI.
- **`PrestigeSystem`** (lines ~2141-2168): Fully defined but never instantiated or called.
- **`EventSystem`** (lines ~2169-2196): Fully defined but never triggered.
- **`AutoAssignWorkers`** (lines ~2197-2215): Defined but not connected to UI or game loop.

Also remove from `Scripts/Game.js` and `src/scripts/Game.js` if they still exist at time of execution (they should already be deleted in 1a).

**Update `docs/GAME_DESIGN.md`:** Change section 6 "Unintegrated Systems" to note these were removed and are available in git history (commit `950b6bd` and earlier).

### 1c. Clean Up Vite Config

Update `vite.config.js`:
- Remove `@scripts` alias: `'@scripts': resolve(__dirname, './src/scripts')` -- directory no longer exists
- Keep `@`: `'@': resolve(__dirname, './src')` -- still valid for styles/assets
- Keep `@styles`: `'@styles': resolve(__dirname, './src/styles')` -- still valid
- Keep `@assets`: `'@assets': resolve(__dirname, './src/assets')` -- still valid

---

## Part 2: Visual Polish

### 2a. Modern Color Palette

**Current state:** Hard-coded colors throughout CSS and inline styles. Pink (#fdd) for female/queen, blue (#ddf) for male/king, various button colors.

**Action:** Replace hard-coded colors with CSS custom properties in `src/styles/variables.css`. Create a modern, cohesive palette:

- **Female/Queen accent:** Soft rose (less saturated than current pink)
- **Male/King accent:** Soft sky blue (less saturated than current blue)
- **Worker roles:** Mine (amber), Farm (green), Carrier (orange), Factory (slate)
- **Combat:** Army (dark olive), Battle active (red pulse)
- **Buttons:** Consistent button palette using the design tokens
- **Backgrounds:** Warmer off-whites for light mode, proper dark mode variants

**Files to modify:**
- `src/styles/variables.css`: Add/update color tokens
- `src/styles/components/buttons.css`: Use tokens instead of hard-coded colors
- `src/styles/components/tables.css`: Use tokens for row highlighting
- `index.html`: Replace any remaining inline color styles with CSS classes

### 2b. Typography & Spacing

**Action:** Improve readability and visual hierarchy:

- **Base font size:** Increase from current to 15-16px for better readability
- **Stat values:** Use tabular-nums font feature for aligned numbers in tables
- **Table cells:** Consistent padding (8-12px), better vertical alignment
- **Section headers:** Clearer hierarchy (Queen/King headers, Hatchery labels)
- **Tab styling:** Modernize tab appearance with better active/inactive states
- **Whitespace:** More breathing room between sections

**Files to modify:**
- `src/styles/typography.css`: Font sizes, weights, features
- `src/styles/components/tables.css`: Cell padding, alignment
- `src/styles/components/tabs.css`: Tab styling updates
- `src/styles/layout.css`: Section spacing

### 2c. Smooth Animations

**Action:** Add CSS transitions for game events:

- **Health/breeding progress bars:** `transition: width 0.3s ease` for smooth fill
- **Tab switching:** Fade transition when changing tabs (opacity + display)
- **Button interactions:** Hover scale/color transitions (150ms ease)
- **New critter highlight:** Brief background glow (1s fade) on the newest critter row using the `newestBorn` observable
- **Worker assignment:** Subtle slide transition when critters move between mounds

**Implementation:** Pure CSS transitions where possible. Use Knockout's `afterRender` callback for the new critter highlight. No new JS animation libraries.

**Files to create/modify:**
- `src/styles/components/animations.css`: New file for all animation/transition definitions
- `src/styles/main.css`: Import the new animations file
- `src/styles/components/buttons.css`: Add hover/active transitions
- `src/styles/components/tables.css`: Add row highlight animation
- `index.html`: Add animation classes to progress bar elements

### 2d. Responsive Layout (Mobile)

**Approach:** Tab-based mobile view (chosen during brainstorming).

**Breakpoints:**
- Desktop: >= 768px (current layout, side-by-side Queen/King)
- Mobile: < 768px (stacked with sub-tabs)

**Mobile changes:**
- **Main tabs:** Horizontal scroll with `-webkit-overflow-scrolling: touch`
- **Queen/King:** Replace side-by-side with sub-tabs ("Queen" | "King"). Only one visible at a time.
- **Worker tables:** Stack vertically, each in a collapsible section
- **Battle map:** Scale grid to fit screen width
- **Buttons:** Min 44px height for touch targets
- **Font adjustments:** Slightly smaller headings on mobile

**Implementation:** CSS media queries + minimal JS for sub-tab switching on mobile. Use Knockout's `visible` binding controlled by a viewport-aware observable.

**Files to modify:**
- `src/styles/components/responsive.css`: New file for all responsive rules
- `src/styles/main.css`: Import responsive.css
- `src/styles/components/tabs.css`: Scrollable tabs on mobile
- `index.html`: Add sub-tab markup for Queen/King mobile view (hidden on desktop via CSS)
- `public/scripts/Site.js`: Add mobile sub-tab switching logic + viewport detection

---

## Execution Order

1. **Cleanup 1a:** Delete duplicate directories
2. **Cleanup 1b:** Remove dead code from Game.js
3. **Cleanup 1c:** Update Vite config
4. **Polish 2a:** Color palette update
5. **Polish 2b:** Typography & spacing
6. **Polish 2c:** Animations
7. **Polish 2d:** Responsive layout

Each step should be committed separately. Steps 1a-1c are prerequisites for 2a-2d.

## Out of Scope

- ES module migration (future phase)
- Framework migration (Vue/React -- future phase)
- New game features (prestige, events)
- Accessibility audit (separate phase)
- Performance optimization
