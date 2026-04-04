# Phase 2: Cleanup & Visual Polish - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up duplicate files and dead code, then apply modern visual polish (colors, typography, animations, responsive mobile layout).

**Architecture:** Sequential cleanup first (delete duplicates, dead code, fix config), then CSS-focused visual polish. All polish work uses existing CSS custom properties system in `src/styles/variables.css`. No new JS libraries. Responsive uses CSS media queries + minimal Knockout observable for mobile sub-tabs.

**Tech Stack:** CSS custom properties, CSS animations/transitions, Knockout.js (existing), Vite (dev server on port 6007)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `Scripts/` | Delete | Legacy duplicate directory |
| `src/scripts/` | Delete | Unused duplicate directory |
| `public/scripts/Game.js` | Modify | Remove dead code (PrestigeSystem, EventSystem, AutoAssign, achievementBonus) |
| `vite.config.js` | Modify | Remove `@scripts` alias |
| `CLAUDE.md` | Modify | Update project structure |
| `docs/GAME_DESIGN.md` | Modify | Update section 6 (removed systems) |
| `src/styles/variables.css` | Modify | Refine game color palette |
| `src/styles/typography.css` | Modify | Add tabular-nums, adjust base size |
| `src/styles/components/tables.css` | Modify | Replace hard-coded colors, improve spacing, add animations |
| `src/styles/components/buttons.css` | Modify | Replace remaining hard-coded colors |
| `src/styles/layout.css` | Modify | Improve spacing, tab scrolling, responsive |
| `src/styles/components/animations.css` | Create | Animation/transition definitions |
| `src/styles/components/responsive.css` | Create | Mobile-specific responsive rules |
| `src/styles/main.css` | Modify | Import new CSS files |
| `index.html` | Modify | Add mobile sub-tab markup, replace inline styles |
| `public/scripts/Site.js` | Modify | Add mobile sub-tab switching logic |

---

### Task 1: Delete Duplicate Script Directories

**Files:**
- Delete: `Scripts/` (entire directory)
- Delete: `src/scripts/` (entire directory)

- [ ] **Step 1: Delete the legacy Scripts/ directory**

```bash
rm -rf Scripts/
```

- [ ] **Step 2: Delete the src/scripts/ directory**

```bash
rm -rf src/scripts/
```

- [ ] **Step 3: Verify public/scripts/ still has all game files**

```bash
ls public/scripts/
```

Expected: `Game.js`, `Site.js`, `Worker.js`, `theme.js`, `tabcontent.js`, plus all library files (jquery, knockout, tipped, etc.)

- [ ] **Step 4: Verify the game still loads**

```bash
curl -s http://localhost:6007/scripts/Game.js | head -3
```

Expected: Shows `function StatVariance(n)` — confirms Vite serves from `public/scripts/`.

- [ ] **Step 5: Commit**

```bash
git rm -r Scripts/
git rm -r src/scripts/
git commit -m "cleanup: remove duplicate Scripts/ and src/scripts/ directories

public/scripts/ is now the single source of truth for game scripts."
```

---

### Task 2: Remove Dead Code from Game.js

**Files:**
- Modify: `public/scripts/Game.js`

- [ ] **Step 1: Remove achievementBonus computed**

In `public/scripts/Game.js`, find and delete these lines (after `this.achievementsUnlocked=ko.observable(0);`):

```javascript
this.achievementBonus = ko.computed(function() {
    var bonus = 1;
    for(var i = 0; i < this.achievements().length; i++) {
        if(this.achievements()[i].isUnlocked() && this.achievements()[i].value >= 100000) {
            bonus *= 1.05; // 5% bonus for high-tier achievements
        }
    }
    return bonus;
}, this);
```

- [ ] **Step 2: Remove PrestigeSystem, EventSystem, and AutoAssignWorkers**

In `public/scripts/Game.js`, find and delete everything after the closing `);` of the `$(document).ready` block (after line ~2140). This is all the code from `var PrestigeSystem = function()` through the end of `function AutoAssignWorkers()`.

Delete these blocks:
- `var PrestigeSystem = function() { ... };`
- `var EventSystem = function() { ... };`
- `function AutoAssignWorkers() { ... }`

- [ ] **Step 3: Verify the game still loads**

```bash
curl -s http://localhost:6007 | grep -c 'Critter Mound'
```

Expected: `1`

- [ ] **Step 4: Update docs/GAME_DESIGN.md section 6**

Replace the "Unintegrated Systems" section (section 6) with:

```markdown
## 6. Removed Systems

The following systems were previously defined in the code but have been removed during the Phase 2 cleanup. They are available in git history (commit `950b6bd` and earlier) if needed for future development:

- **PrestigeSystem:** Reset-based progression with prestige points.
- **EventSystem:** Timed bonus events (Seasonal Swarm, Mutation Surge).
- **AutoAssignWorkers:** Automatic worker assignment based on bottlenecks.
```

- [ ] **Step 5: Commit**

```bash
git add public/scripts/Game.js docs/GAME_DESIGN.md
git commit -m "cleanup: remove unintegrated dead code from Game.js

Remove PrestigeSystem, EventSystem, AutoAssignWorkers, and unused
achievementBonus computed. All available in git history if needed."
```

---

### Task 3: Clean Up Vite Config and CLAUDE.md

**Files:**
- Modify: `vite.config.js`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Remove @scripts alias from vite.config.js**

In `vite.config.js`, in the `resolve.alias` section, remove the `@scripts` line:

```javascript
      '@scripts': resolve(__dirname, './src/scripts'),
```

Keep the other three aliases (`@`, `@styles`, `@assets`).

- [ ] **Step 2: Update CLAUDE.md project structure**

In `CLAUDE.md`, find the project structure section and replace it with:

```markdown
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
```

Also update the "Path Aliases" subsection to remove `@scripts`:

```markdown
**Path Aliases** (Vite):
- `@` → `./src`
- `@styles` → `./src/styles`
- `@assets` → `./src/assets`
```

- [ ] **Step 3: Commit**

```bash
git add vite.config.js CLAUDE.md
git commit -m "cleanup: update vite config and CLAUDE.md after directory consolidation"
```

---

### Task 4: Modern Color Palette

**Files:**
- Modify: `src/styles/variables.css`
- Modify: `src/styles/components/tables.css`
- Modify: `src/styles/components/buttons.css`

- [ ] **Step 1: Update game-specific colors in variables.css**

In `src/styles/variables.css`, replace the `/* Game-Specific Colors */` section in `:root` with:

```css
  /* Game-Specific Colors */
  --color-female: #f5d0d0;
  --color-female-dark: #e8a8a8;
  --color-female-light: #faf0f0;
  --color-male: #cce0f5;
  --color-male-dark: #a3c4e8;
  --color-male-light: #eef5fc;
  --color-mine: #e8dcc8;
  --color-mine-dark: #d4c8a8;
  --color-mine-highlight: #f5f0e5;
  --color-farm: #d4e8c8;
  --color-farm-dark: #b8d4a8;
  --color-farm-highlight: #eef5e5;
  --color-carrier: #e8ccc0;
  --color-carrier-dark: #d4a898;
  --color-carrier-highlight: #f5e8e0;
  --color-factory: #ccc8e8;
  --color-factory-dark: #a8a0d4;
  --color-factory-highlight: #eeedf5;
  --color-army: #3d4a3d;
  --color-army-hover: #4d5a4d;
  --color-enemy: #6b1a1a;
  --color-enemy-hover: #8b2a2a;

  /* Button Colors */
  --color-recycle: #2d6b2d;
  --color-recycle-hover: #1d4d1d;
  --color-upgrade: #c8e8c8;
  --color-upgrade-hover: #a8d4a8;
  --color-achievement: #1a1a6b;
  --color-achievement-hover: #2a2a8b;

  /* Battle Colors */
  --color-selected: #d0f5d4;
  --color-newest: #f5ecd0;
  --color-attacker: #d0f5d4;
  --color-attacker-highlight: #a8e8b0;
  --color-defender: #f5e0e0;
  --color-defender-highlight: #e8c0c0;
```

And in the `[data-theme="dark"]` section, replace the game-specific colors with:

```css
  /* Game-Specific Colors - Dark mode */
  --color-female: #8b4a4a;
  --color-female-dark: #6b3a3a;
  --color-female-light: #3d2828;
  --color-male: #4a6a8b;
  --color-male-dark: #3a5a6b;
  --color-male-light: #28343d;
  --color-mine: #6b5a40;
  --color-mine-dark: #5a4a30;
  --color-mine-highlight: #3d3428;
  --color-farm: #4a6b40;
  --color-farm-dark: #3a5a30;
  --color-farm-highlight: #283d28;
  --color-carrier: #6b4a3a;
  --color-carrier-dark: #5a3a2a;
  --color-carrier-highlight: #3d2820;
  --color-factory: #4a4a6b;
  --color-factory-dark: #3a3a5a;
  --color-factory-highlight: #28283d;
  --color-army: #4a5a4a;
  --color-army-hover: #5a6a5a;
  --color-enemy: #8b2a2a;
  --color-enemy-hover: #ab3a3a;

  /* Button Colors - Dark mode */
  --color-recycle: #3a8b3a;
  --color-recycle-hover: #2a6b2a;
  --color-upgrade: #3a6b3a;
  --color-upgrade-hover: #2a5a2a;
  --color-achievement: #3a3a8b;
  --color-achievement-hover: #4a4aab;

  /* Battle Colors - Dark mode */
  --color-selected: #2a4a2c;
  --color-newest: #4a4028;
  --color-attacker: #2a4a2c;
  --color-attacker-highlight: #3a6a3e;
  --color-defender: #4a2828;
  --color-defender-highlight: #6a3838;
```

- [ ] **Step 2: Replace hard-coded colors in buttons.css**

In `src/styles/components/buttons.css`, replace the recycle and upgrade button blocks:

Replace:
```css
button.recycle {
  background-color: #006400;
  border-color: #004d00;
  color: white;
}

button.recycle:hover:not(:disabled) {
  background-color: #004d00;
}

button.upgrade {
  background-color: #bfebbf;
  border-color: #9fdb9f;
}

button.upgrade:hover:not(:disabled) {
  background-color: #9fdb9f;
}
```

With:
```css
button.recycle {
  background-color: var(--color-recycle);
  border-color: var(--color-recycle-hover);
  color: white;
}

button.recycle:hover:not(:disabled) {
  background-color: var(--color-recycle-hover);
}

button.upgrade {
  background-color: var(--color-upgrade);
  border-color: var(--color-upgrade-hover);
}

button.upgrade:hover:not(:disabled) {
  background-color: var(--color-upgrade-hover);
}
```

- [ ] **Step 3: Replace hard-coded colors in tables.css**

In `src/styles/components/tables.css`, replace the following hard-coded colors:

Replace `background-color: #f3ce8b;` in `table.critter th` with:
```css
background-color: var(--color-surface);
```

Replace `background-color: #f8eed0 !important;` in `table.critter tr.newest` with:
```css
background-color: var(--color-newest) !important;
```

Replace `background-color: #daf8dc !important;` in `table.critter tr.selected` with:
```css
background-color: var(--color-selected) !important;
```

Replace `background-color: #fee;` in `table.critter tr.defender` with:
```css
background-color: var(--color-defender);
```

Replace `background-color: #e6bfbf;` in `table.critter tr.defender .defendTrait` with:
```css
background-color: var(--color-defender-highlight);
```

Replace `background-color: #daf8dc;` in `table.critter tr.attacker` with:
```css
background-color: var(--color-attacker);
```

Replace `background-color: #abebb0;` in `table.critter tr.attacker .attackTrait` with:
```css
background-color: var(--color-attacker-highlight);
```

Replace `background-color: #00008b;` in `ul.tabs li.achievement a` (in layout.css) with:
```css
background-color: var(--color-achievement);
```

Also in tables.css, replace the hard-coded worker highlight colors:

Replace `background-color: #f8e0d5 !important;` in `table.critter.carrier td.carry` with:
```css
background-color: var(--color-carrier-highlight) !important;
```

Replace `background-color: #eae1d1 !important;` in `table.critter.mine td.mine` with:
```css
background-color: var(--color-mine-highlight) !important;
```

Replace `background-color: #e7eedc !important;` in `table.critter.farm td.farm` with:
```css
background-color: var(--color-farm-highlight) !important;
```

Replace `background-color: #e3e2f2 !important;` in `table.critter.factory td.factory` with:
```css
background-color: var(--color-factory-highlight) !important;
```

Replace all hard-coded health bar colors in tables.css with variables. Add these to variables.css `:root`:
```css
  /* Worker Health Bar Colors */
  --color-health-carrier: #833111;
  --color-health-mine: #5c4e40;
  --color-health-farm: #607049;
  --color-health-factory: #575170;
  --color-health-defender: #8b0000;
```

Then replace each `background-color: #833111 !important;` etc. with the corresponding `var(--color-health-*)`.

- [ ] **Step 4: Verify game looks correct**

Open http://localhost:6007 in browser. Check that:
- Queen table headers have a soft neutral background (not gold)
- King table headers have a soft blue tint
- Buttons have consistent colors
- Dark mode toggle works and all colors adapt

- [ ] **Step 5: Commit**

```bash
git add src/styles/variables.css src/styles/components/buttons.css src/styles/components/tables.css src/styles/layout.css
git commit -m "style: modernize color palette with CSS custom properties

Replace all hard-coded hex colors with design tokens. Add dark mode
variants for game-specific colors. Softer, more cohesive palette."
```

---

### Task 5: Typography & Spacing

**Files:**
- Modify: `src/styles/typography.css`
- Modify: `src/styles/components/tables.css`
- Modify: `src/styles/layout.css`
- Modify: `src/styles/base.css`

- [ ] **Step 1: Update base font size**

In `src/styles/base.css`, find the `body` rule and ensure the font-size is set:

```css
body {
  font-size: 15px;
}
```

- [ ] **Step 2: Add tabular-nums to stat displays in typography.css**

Add at the end of the `/* Game-Specific Text Styles */` section in `src/styles/typography.css`:

```css
/* Tabular numbers for aligned stat columns */
table.critter td {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}

table.critter .trait {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}
```

- [ ] **Step 3: Improve table spacing in tables.css**

In `src/styles/components/tables.css`, update the `table.critter td` rule. Change:
```css
  padding: var(--space-2);
```
to:
```css
  padding: var(--space-2) var(--space-3);
```

Update `table.critter th` padding similarly:
```css
  padding: var(--space-2) var(--space-3);
```

- [ ] **Step 4: Improve tab active state in layout.css**

In `src/styles/layout.css`, update the `ul.tabs li.selected a` rule. Replace the entire block:

```css
ul.tabs li.selected a,
ul.tabs li.selected a:hover {
  background-color: var(--color-background);
  border-bottom-color: var(--color-background);
  color: var(--color-text);
  position: relative;
  top: 1px;
  font-weight: var(--font-bold);
  box-shadow: var(--shadow-sm);
}
```

- [ ] **Step 5: Commit**

```bash
git add src/styles/base.css src/styles/typography.css src/styles/components/tables.css src/styles/layout.css
git commit -m "style: improve typography and spacing

Increase base font to 15px, add tabular-nums for stat alignment,
improve table cell padding, enhance active tab styling."
```

---

### Task 6: Smooth Animations

**Files:**
- Create: `src/styles/components/animations.css`
- Modify: `src/styles/main.css`

- [ ] **Step 1: Create animations.css**

Create `src/styles/components/animations.css`:

```css
/**
 * Animations & Transitions
 * Smooth visual feedback for game events
 */

/* ========================================
   NEW CRITTER HIGHLIGHT
   ======================================== */

@keyframes critter-born {
  0% {
    background-color: var(--color-newest);
    box-shadow: 0 0 8px rgba(245, 236, 208, 0.6);
  }
  100% {
    background-color: transparent;
    box-shadow: none;
  }
}

table.critter tr.newest td {
  animation: critter-born 2s ease-out forwards;
}

/* ========================================
   TAB CONTENT TRANSITIONS
   ======================================== */

.tab {
  opacity: 0;
  transition: opacity var(--transition-base);
}

.tab[style*="display: block"],
.tab[style*="display:block"] {
  opacity: 1;
}

/* ========================================
   PROGRESS BAR SMOOTHING
   ======================================== */

.progressbar {
  transition: width var(--transition-slow);
}

table.critter tr.health div {
  transition: width var(--transition-base);
}

/* ========================================
   BUTTON INTERACTIONS
   ======================================== */

button {
  transition: background-color var(--transition-fast),
              border-color var(--transition-fast),
              transform var(--transition-fast),
              box-shadow var(--transition-fast);
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
}

button:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

/* ========================================
   TABLE ROW TRANSITIONS
   ======================================== */

table.critter tr {
  transition: background-color var(--transition-fast);
}

/* ========================================
   BATTLE DAMAGE FLASH
   ======================================== */

@keyframes damage-flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

table.critter tr.defender {
  animation: damage-flash 0.4s ease;
}
```

- [ ] **Step 2: Import animations.css in main.css**

In `src/styles/main.css`, add after the `@import './components/theme-toggle.css';` line:

```css
@import './components/animations.css';
```

- [ ] **Step 3: Verify animations work**

Open http://localhost:6007. Check:
- Health bars fill smoothly (not jumping)
- Buttons have subtle hover lift effect
- Tab switching has a brief fade

- [ ] **Step 4: Commit**

```bash
git add src/styles/components/animations.css src/styles/main.css
git commit -m "style: add smooth animations for game events

CSS transitions for health bars, button hovers, tab switching,
new critter highlight glow, and battle damage flash."
```

---

### Task 7: Responsive Mobile Layout

**Files:**
- Create: `src/styles/components/responsive.css`
- Modify: `src/styles/main.css`
- Modify: `index.html`
- Modify: `public/scripts/Site.js`

- [ ] **Step 1: Create responsive.css**

Create `src/styles/components/responsive.css`:

```css
/**
 * Responsive Layout
 * Mobile-first responsive rules for < 768px
 */

/* ========================================
   MOBILE TABS - Scrollable
   ======================================== */

@media (max-width: 767px) {
  ul.tabs {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    gap: var(--space-1);
    padding-bottom: var(--space-2);
  }

  ul.tabs::-webkit-scrollbar {
    display: none;
  }

  ul.tabs li {
    flex: 0 0 auto;
  }

  ul.tabs li a {
    white-space: nowrap;
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-xs);
  }

  /* ========================================
     QUEEN/KING SUB-TABS
     ======================================== */

  .mobile-subtabs {
    display: flex;
    gap: var(--space-1);
    margin-bottom: var(--space-3);
  }

  .mobile-subtabs button {
    flex: 1;
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--border-radius-md);
    background: var(--color-surface);
    cursor: pointer;
  }

  .mobile-subtabs button.active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

  .mobile-subtabs button.queen-tab.active {
    background: var(--color-female-dark);
    border-color: var(--color-female-dark);
    color: var(--color-text);
  }

  .mobile-subtabs button.king-tab.active {
    background: var(--color-male-dark);
    border-color: var(--color-male-dark);
    color: var(--color-text);
  }

  /* ========================================
     STACKED LAYOUT
     ======================================== */

  /* Hatchery: stack Queen and King tables */
  #tabs-hatchery > table > tbody > tr {
    display: block;
  }

  #tabs-hatchery > table > tbody > tr > td {
    display: block;
    width: 100% !important;
    padding: 0;
    margin-bottom: var(--space-3);
  }

  /* Heirs: same stacking */
  #tabs-heirs > table > tbody > tr {
    display: block;
  }

  #tabs-heirs > table > tbody > tr > td {
    display: block;
    width: 100% !important;
    padding: 0;
    margin-bottom: var(--space-3);
  }

  /* ========================================
     TOUCH-FRIENDLY TARGETS
     ======================================== */

  button {
    min-height: 44px;
  }

  select {
    min-height: 44px;
  }

  /* ========================================
     TABLE ADJUSTMENTS
     ======================================== */

  table.critter td {
    font-size: 11px;
    padding: var(--space-1) var(--space-2);
  }

  table.critter th {
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-2);
  }

  /* ========================================
     BATTLE MAP SCALING
     ======================================== */

  table.map {
    font-size: 10px;
  }

  table.map td {
    width: 14px !important;
    height: 14px !important;
  }

  /* ========================================
     HEADER ADJUSTMENTS
     ======================================== */

  .title {
    font-size: var(--text-lg);
  }

  /* Worker production tables */
  #tabs-production table {
    font-size: var(--text-xs);
  }
}

/* ========================================
   DESKTOP: HIDE MOBILE-ONLY ELEMENTS
   ======================================== */

@media (min-width: 768px) {
  .mobile-subtabs {
    display: none;
  }

  .mobile-hidden {
    display: block;
  }
}
```

- [ ] **Step 2: Import responsive.css in main.css**

In `src/styles/main.css`, add at the very end (after all other imports):

```css

/* ========================================
   RESPONSIVE
   ======================================== */
@import './components/responsive.css';
```

- [ ] **Step 3: Add mobile sub-tab markup to index.html**

In `index.html`, find the `<div id="tabs-hatchery" class="tab" style="display:none">` section. Add the mobile sub-tab buttons right after the opening div:

```html
            <div id="tabs-hatchery" class="tab" style="display:none">
                <!-- Mobile sub-tabs for Queen/King switching -->
                <div class="mobile-subtabs" id="hatchery-subtabs">
                    <button class="queen-tab active" onclick="mobileSubTab('hatchery', 'queen')">Queen</button>
                    <button class="king-tab" onclick="mobileSubTab('hatchery', 'king')">King</button>
                </div>
                <table cellspacing="10">
```

- [ ] **Step 4: Add mobile sub-tab switching to Site.js**

In `public/scripts/Site.js`, add this function before the closing of the file (before the last line):

```javascript
function mobileSubTab(section, tab) {
    if (window.innerWidth >= 768) return;

    var container = document.getElementById('tabs-' + section);
    if (!container) return;

    var cells = container.querySelectorAll(':scope > table > tbody > tr > td');
    var buttons = container.querySelectorAll('.mobile-subtabs button');

    buttons.forEach(function(btn) { btn.classList.remove('active'); });

    if (tab === 'queen') {
        if (cells[0]) cells[0].style.display = 'block';
        if (cells[1]) cells[1].style.display = 'none';
        buttons[0].classList.add('active');
    } else {
        if (cells[0]) cells[0].style.display = 'none';
        if (cells[1]) cells[1].style.display = 'block';
        buttons[1].classList.add('active');
    }
}

// Auto-apply mobile layout on resize
window.addEventListener('resize', function() {
    var subtabs = document.querySelectorAll('.mobile-subtabs');
    subtabs.forEach(function(el) {
        if (window.innerWidth >= 768) {
            var container = el.parentElement;
            var cells = container.querySelectorAll(':scope > table > tbody > tr > td');
            cells.forEach(function(cell) { cell.style.display = ''; });
        }
    });
});
```

- [ ] **Step 5: Verify responsive layout**

Open http://localhost:6007 in browser. Use DevTools to toggle mobile view (375px width). Check:
- Main tabs scroll horizontally
- Queen/King sub-tab buttons appear
- Clicking "King" shows only the King table
- Buttons are touch-friendly (44px min height)
- Resize back to desktop: both Queen and King visible side-by-side again

- [ ] **Step 6: Commit**

```bash
git add src/styles/components/responsive.css src/styles/main.css index.html public/scripts/Site.js
git commit -m "style: add responsive mobile layout with sub-tab navigation

Mobile (<768px): scrollable tabs, Queen/King sub-tab switching,
stacked layouts, touch-friendly 44px buttons, scaled battle map.
Desktop: unchanged layout, mobile elements hidden."
```

---

### Task 8: Final Verification

- [ ] **Step 1: Check all files are correct**

```bash
ls src/styles/components/animations.css src/styles/components/responsive.css
test -d Scripts && echo "ERROR: Scripts/ still exists" || echo "OK"
test -d src/scripts && echo "ERROR: src/scripts/ still exists" || echo "OK"
```

Expected: Both CSS files exist. Both directories gone.

- [ ] **Step 2: Verify dev server works**

```bash
curl -s http://localhost:6007 | head -5
```

Expected: HTML with Critter Mound title.

- [ ] **Step 3: Review git log**

```bash
git log --oneline -7
```

Expected: 7 commits covering cleanup (3) and polish (4).
