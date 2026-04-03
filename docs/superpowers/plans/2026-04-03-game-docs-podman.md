# Game Documentation & Podman Setup - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create complete game design documentation and a working Podman dev/prod environment for Critter Mound.

**Architecture:** Two independent markdown documents (game design + dev setup), plus container infrastructure files (Containerfile, podman-compose.yml, nginx config). The obsolete Dockerfile is deleted and replaced.

**Tech Stack:** Markdown, Podman/Docker, nginx, Vite, Node 18

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `docs/GAME_DESIGN.md` | Create | Complete game mechanics bible |
| `docs/LOCAL_DEVELOPMENT.md` | Create | Developer setup guide with Podman |
| `Containerfile` | Create | Multi-stage build (node -> nginx) |
| `nginx.conf` | Create | nginx config for SPA routing in prod container |
| `podman-compose.yml` | Create | Dev (HMR) + prod services |
| `.dockerignore` | Modify | Add `Containerfile`, `podman-compose.yml`, `node_modules` |
| `Dockerfile` | Delete | Obsolete, copies wrong paths |

---

### Task 1: Create `docs/GAME_DESIGN.md`

**Files:**
- Create: `docs/GAME_DESIGN.md`

- [ ] **Step 1: Write the game design document**

Create `docs/GAME_DESIGN.md` with the following complete content:

```markdown
# Critter Mound - Game Design Document

## 1. Game Overview

Critter Mound is an incremental browser game originally created in 2014, now modernized with Vite tooling. Players breed critters, manage workers, produce resources, and wage wars against enemy nations.

### Core Gameplay Loop

```
Breed Critters -> Assign to Roles -> Produce Resources -> Upgrade Capacity -> Fight Wars -> Repeat
```

The game runs at 20 ticks per second. All production, breeding, and combat calculations happen each tick.

---

## 2. Core Systems

### 2.1 Critter Traits

Every critter has 5 base traits, each serving dual purposes in combat and work:

| Trait | Combat Role | Worker Role | Key Formula |
|-------|-----------|-------------|-------------|
| Vitality | HP pool | Sod production (factory) | `Health = Vitality × 15` |
| Strength | +50% bonus to Bite in battle | Carrying capacity | `carryPerSecond = traitValue / actionTimeSeconds` |
| Agility | +50% bonus to Sting in battle, turn order | Action speed for all tasks | `actionTime = max(3s, 30 × 0.9^log₂(agility))` |
| Bite | Attack/Defense (opposes Sting) | Grass farming | `grassPerSecond = traitValue / actionTimeSeconds` |
| Sting | Attack/Defense (opposes Bite) | Dirt mining | `dirtPerSecond = traitValue / actionTimeSeconds` |

**Score** is the geometric mean of all traits: `(vitality × strength × agility × bite × sting) ^ 0.2`

**Caps:** Trait values max at 999,999. Gene values max at 100. Soldier level max at 99.

### 2.2 Breeding & Genetics

#### Stat Inheritance

When two critters breed, each offspring trait is a random value between:
- **Low end:** `min(parent1, parent2) - StatVariance`
- **High end:** `max(parent1, parent2) + StatVariance`

**StatVariance formula:**
- For values < 1,000: `floor(value / 50) + 1`
- For values >= 1,000: capped at 20

This means early breeding has tight variance (a parent with stat 50 has variance of 2), while late-game breeding with stats in the thousands always varies by up to 20 points.

#### Gene Expression (Mendelian Genetics)

Genes follow a simplified Mendelian inheritance model with three expression states:

| Parent 1 \ Parent 2 | None | Recessive | Dominant |
|---------------------|------|-----------|----------|
| **None** | 100% None | 50% None / 50% Rec | 100% Rec |
| **Recessive** | 50% None / 50% Rec | 25% None / 50% Rec / 25% Dom | 50% Rec / 50% Dom |
| **Dominant** | 100% Rec | 50% Rec / 50% Dom | 100% Dom |

- Only **Dominant** genes apply their bonus to the trait
- **Good genes** add a percentage bonus; **bad genes** subtract
- Gene values mutate using the same StatVariance formula as traits, capped at 100

#### New Gene Discovery

Each breeding cycle has a chance to discover a new gene:

- **Base chance:** 10 in 1,000 (1%)
- **Pity system:** Every miss increments a counter. Chance increases: `10 × (1 + floor(missCount / 25 × 10) / 10)` per 1,000
- **Requirements for mutation to stick:** trait base > 25 AND MutationCheck passes
- **MutationCheck formula:**
  - If gene count < 10: `bonus >= geneCount × (geneCount - 1) × 5`
  - If gene count >= 10: `bonus >= (geneCount - 10) × 100 + 450`

There are 16 available genes per trait (80 total), plus 18 enemy-specific genes obtainable through wars.

#### Breeding Speed

- **Royal Hatchery:** Breeds when both King and Queen reach full health. Health regenerates at `health / actionTime` per tick. Faster agility = faster breeding.
- **Heir Hatchery:** Consumes sod to breed. Breeding cost scales with `score × 5`. Unlocked when sod production reaches 100/sec.
- **Boost:** Triggers an instant breed. Recharges at +0.1 per natural breed cycle. Starting maximum: 10 boosts.

### 2.3 Production Chain

```
Miners (sting)  ──→  Dirt Stockpile  ──┐
                                        ├──→  Carriers (strength)  ──→  Factory Stockpile
Farmers (bite)  ──→  Grass Stockpile ──┘                                      │
                                                                   Factories (vitality)  ──→  Sod
```

**Per tick (20/sec):**
1. Miners produce dirt at `dirtPerSecond / 20` rate
2. Farmers produce grass at `grassPerSecond / 20` rate
3. Carriers move `min(available dirt, carryPerSecond/20)` dirt and `min(available grass, carryPerSecond/20)` grass to factory stockpile
4. Factories convert `min(factoryDirt, factoryGrass, sodPerSecond/20)` into sod

**Bottleneck dynamics:** Effective sod production is limited by the weakest link. The game automatically assigns new workers to the role with the lowest production rate.

**Bonus percentages** from war rewards (e.g., +2% mining from captured mine) apply multiplicatively to each role's total output.

#### Upgrade Costs

| Slot Type | Base Cost | Formula | Max Slots |
|-----------|-----------|---------|-----------|
| Hatchery (King/Queen) | 10 sod | `10 × 10^(currentSize - 1)` | 10 |
| Heir Hatchery | 10 sod | `10 × 10^(currentSize - 1)` | 10 |
| Worker slots (Mine/Farm/Carrier/Factory) | 500 sod | `500 × 10^(currentSize - 1)` | 10 |
| Army slots | 500 sod | `500 × 10^(currentSize - 1)` | 10 |

### 2.4 Combat System

#### Battle Flow

1. All critters (player + enemy) are sorted by actionTime (lower = faster)
2. Each turn, the next critter in order attacks
3. **Coin flip** decides the matchup:
   - Heads: Attacker's Bite (+Strength bonus) vs Defender's Sting (+Agility bonus)
   - Tails: Attacker's Sting (+Agility bonus) vs Defender's Bite (+Strength bonus)
4. **Damage formula:** `attack² / defense`, with ±10% random variance
5. **Minimum damage:** `defender HP / 20` (guarantees battles always progress)
6. **Critical hit (player only):** chance = attacker's level %. Doubles attack value.
7. Battle ends when all critters on one side reach 0 HP

#### Army Roles

The top 3 soldiers (by sort order) receive special ranks:

| Rank | Role | Bonus |
|------|------|-------|
| **General** | Enables auto-battle | `level × 10%` faster auto-battle timer |
| **Scout** | Enables map exploration | `level × 10%` faster explore timer |
| **Medic** | Heals army between battles | `level × 10%` faster healing |

Remaining soldiers are ranked: Recruit → Soldier (level 8+) → Veteran (level 15+) → Elite.

#### XP and Leveling

- Killing an enemy grants XP equal to the enemy's experience value
- **Level formula:** `min(99, floor((√(4 + 8×xp) - 2) / 4))`
- All soldiers gain a critical hit chance bonus equal to their level percentage

#### Army Upgrades (Per-War)

Found on map tiles as artifacts. Each gives +5% to a random combat stat (Strength, Agility, Bite, or Sting). Applied to all player army critters during that war. Reset when the war ends.

### 2.5 War & Map System

#### Map Structure

Each war generates a **20×20 grid** with fog of war. Your mound spawns near one edge, the enemy base near the opposite edge.

#### Danger Levels

Tile danger scales with distance from your mound and proximity to the enemy:
- Near your mound: danger ~1-5
- Mid map: danger ~5-10
- Near enemy base: danger ~10-15
- Enemy base tile: danger 15+

**Enemy base stats** scale linearly with danger: `lowBaseValue + (danger - 1) / 14 × (highBaseValue - lowBaseValue)`

**Enemy army size** per battle: `armySizeBase + floor(danger / 5)`

#### Map Rewards

Each nation's map contains unique discoverable locations:

| Reward | Effect | Persistence |
|--------|--------|------------|
| Mine | +2% mining speed | Permanent |
| Farm | +2% farming speed | Permanent |
| Equipment | +2% carrying capacity | Permanent |
| Factory | +2% sod production | Permanent |
| Enemy Gene | Queen absorbs an enemy-specific mutation | Permanent |
| Boost | +5 maximum boosts | Permanent |
| High Ground | +50% explore speed on current map | Per-war |
| Fort | +50% auto-battle tracking speed on current map | Per-war |
| Artifacts (×4) | +5% to a random combat stat | Per-war |

#### Explore & Auto-Battle Timers

- **Explore:** 30 seconds base. Reduced by: Scout bonus + High Ground (+50%) + defeated enemy bonus (+100%)
- **Auto-Battle:** 60 seconds base. Reduced by: General bonus + Fort (+50%) + defeated enemy bonus (+100%)

Both require the respective army role (Scout/General) to be assigned. Without them, the timer does not advance.

---

## 3. Nations Reference

### 6 Categories, 3 Tiers Each

| Category | Tier 1 (Base Stats) | Tier 2 (Base Stats) | Tier 3 (Base Stats) |
|----------|-------|-------|-------|
| **Balanced** | Crickets (5–50) | Ants (1k–2k) | Grasshoppers (15k–25k) |
| **High Numbers** | Gnats (50–100) | Chiggers (2k–3k) | Ladybugs (25k–50k) |
| **High Sting** | Bees (100–200) | Wasps (3k–5k) | Scorpions (50k–75k) |
| **High Bite** | Beetles (200–300) | Horseflies (5k–7.5k) | Termites (75k–100k) |
| **High Health** | Ticks (300–500) | Mosquitoes (7.5k–10k) | Leeches (100k–125k) |
| **Solo Fighter** | Centipedes (500–1k) | Praying Mantis (10k–15k) | Tarantulas (125k–150k) |

### Category Combat Modifiers

| Category | Modifier |
|----------|----------|
| **Balanced** | No stat modifications |
| **High Numbers** | 2× army size, all stats ÷1.2 |
| **High Sting** | Sting ×1.3, Agility ×1.3, Bite ÷1.3, Strength ÷1.3 |
| **High Bite** | Bite ×1.3, Strength ×1.3, Sting ÷1.3, Agility ÷1.3 |
| **High Health** | Vitality ×2, Bite ×0.75, Strength ×0.75 |
| **Solo Fighter** | 1 enemy unit, all stats × 0.7 × normal army size (concentrated power) |

### Nation Unlock Chains

```
Crickets (start) ──→ Ants ──→ Grasshoppers
    │
    └──→ Gnats ──→ Chiggers ──→ Ladybugs
            │
            └──→ Bees ──→ Wasps ──→ Scorpions
                   │
                   └──→ Beetles ──→ Horseflies ──→ Termites
                            │
                            └──→ Ticks ──→ Mosquitoes ──→ Leeches
                                    │
                                    └──→ Centipedes ──→ Praying Mantis ──→ Tarantulas
```

Defeating a nation unlocks the next in its chain.

### Enemy Gene Rewards

Each defeated nation grants a unique gene to your Queen:

| Nation | Gene | Trait |
|--------|------|-------|
| Gnats | Gnat Agility | Agility |
| Ladybugs | Ladybug Agility | Agility |
| Chiggers | Chigger Agility | Agility |
| Wasps | Wasp Sting | Sting |
| Scorpions | Scorpion Sting | Sting |
| Bees | Bee Sting | Sting |
| Tarantulas | Tarantula Bite | Bite |
| Praying Mantis | PM Agility + PM Strength | Agility + Strength |
| Centipedes | Centipede Vitality + Centipede Sting | Vitality + Sting |
| Beetles | Beetle Bite | Bite |
| Horseflies | Horsefly Bite | Bite |
| Termites | Termite Bite | Bite |
| Ticks | Tick Vitality | Vitality |
| Mosquitoes | Mosquito Vitality | Vitality |
| Leeches | Leech Vitality | Vitality |
| Crickets | Cricket Strength | Strength |
| Ants | Ant Strength | Strength |
| Grasshoppers | Grasshopper Strength | Strength |

---

## 4. Game Progression Phases

### Early Game (Generations 0–50, Score ~5–100)

**Goals:** Establish breeding, first workers, first war victory.

- Start with King + Queen, both base 5 in all traits
- Breed to slowly improve traits through stat variance
- Assign first workers to build the production chain (Dirt → Grass → Carry → Factory → Sod)
- Accumulate sod to upgrade hatchery slots (costs: 10 → 100 → 1,000 → 10,000 sod)
- Start your first war against **Crickets** (balanced, base 5–50, army size 1–4)
- First mutations appear when trait base exceeds 25
- **Key milestones:** First hatchery upgrade, first war victory, first mutation

**Player Focus:** Understanding breeding mechanics, learning worker assignment, basic combat.

### Mid Game (Generations 50–300, Score ~100–5,000)

**Goals:** Full production chain optimization, Heir Hatchery, defeat Tier 1–2 nations.

- Production reaching **100 sod/sec** unlocks the **Heir Hatchery** (parallel breeding line fueled by sod)
- Work through Tier 1 nations across all 6 categories
- Begin Tier 2 nations (base stats 1,000–15,000)
- Accumulate **permanent war bonuses** (+2% per nation for mining, farming, carrying, factory)
- **Enemy gene absorption** starts significantly boosting Queen's mutation pool
- Upgrade worker/army slots (costs escalate: 500 → 5,000 → 50,000 → 500,000 sod)
- Army leveling becomes important: General, Scout, and Medic roles unlock auto-battle and exploration
- Boost capacity grows through war rewards (+5 per Boost found)

**Player Focus:** Optimizing production bottlenecks, strategic worker placement, army composition and leveling.

### Late Game (Generations 300+, Score ~5,000–100,000+)

**Goals:** Defeat all Tier 3 nations, max achievements, optimize everything.

- Tier 3 nations range from 15,000 to 150,000 base stats
- Hardest nation: **Tarantulas** (solo fighter, base 125k–150k, concentrated stats)
- Approaching trait cap (999,999) and gene cap (100)
- Achievement hunting: breed 100,000+ in each trait, 50+ mutations, 500,000+ production rates
- Complete all 18 maps for maximum permanent bonuses
- Total possible bonuses: +36% to each worker type (18 nations × 2%)

**Player Focus:** Min-maxing breeding for specific traits, completing all achievements, conquering final nations.

---

## 5. Balancing Formulas Quick Reference

```
StatVariance(n)         = n < 1000 ? floor(n/50) + 1 : 20
MutationCheck(genes, b) = genes >= 10 ? b >= (genes-10)*100+450 : b >= genes*(genes-1)*5
UpgradeCost(level, base) = base * 10^(level-1)
LevelFromXp(xp)         = min(99, floor((sqrt(4 + 8*xp) - 2) / 4))
Score                    = (vit * str * agi * bite * sting) ^ 0.2
Health                   = vitality * 15
ActionTime               = max(3s, 30 * 0.9^log2(agility))
WorkerOutput             = traitValue / actionTimeSeconds
BattleDamage             = attack^2 / defense (±10%)
MinDamage                = defenderHP / 20
CritChance               = attackerLevel% (player only, 2x multiplier)
NewGeneChance            = 10 * (1 + floor(missCount/25 * 10) / 10) per 1000
EnemyBaseStat            = lowBase + (danger-1)/14 * (highBase - lowBase)
EnemyArmySize            = armySizeBase + floor(danger/5)
```

---

## 6. Unintegrated Systems

The following systems are defined in the code but **not yet connected** to the game loop:

- **PrestigeSystem:** Prestige points = `floor(sqrt(generations × achievements))`. Each point gives +10% bonus multiplier. Reset preserves max boosts and achievements.
- **EventSystem:** Two events — Seasonal Swarm (2× bonus, 24h) and Mutation Surge (+50 mutation chance, 12h). Not triggered by any game logic.
- **AutoAssignWorkers:** Automatically assigns workers based on production bottlenecks. UI toggle exists in code but is not rendered.
```

- [ ] **Step 2: Verify the file renders correctly**

Run: `head -5 docs/GAME_DESIGN.md`
Expected: Shows the title and first heading.

- [ ] **Step 3: Commit**

```bash
git add docs/GAME_DESIGN.md
git commit -m "docs: add complete game design document with mechanics, balancing, and progression phases"
```

---

### Task 2: Create `docs/LOCAL_DEVELOPMENT.md`

**Files:**
- Create: `docs/LOCAL_DEVELOPMENT.md`

- [ ] **Step 1: Write the local development guide**

Create `docs/LOCAL_DEVELOPMENT.md` with the following complete content:

```markdown
# Local Development Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >= 18 | [nodejs.org](https://nodejs.org/) |
| npm | >= 9 | Bundled with Node.js |
| Podman | >= 4.0 | [podman.io](https://podman.io/docs/installation) |
| podman-compose | >= 1.0 | `pip install podman-compose` or `brew install podman-compose` |

> Podman is a drop-in Docker replacement. All `podman` commands also work with `docker`, and `podman-compose` with `docker-compose`.

---

## Quick Start (Native)

```bash
# Install dependencies
npm install

# Start dev server with hot module replacement
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000) with HMR enabled.

---

## Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR (port 3000) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run format` | Format code with Prettier |
| `npm run lint` | Lint JavaScript with ESLint |
| `npm test` | Run Playwright end-to-end tests |
| `npm run test:ui` | Playwright test runner UI |
| `npm run test:headed` | Run tests in headed browser mode |
| `npm run test:debug` | Debug Playwright tests |
| `npm run test:report` | Show Playwright HTML report |

---

## Podman Setup

### Development (with Hot Reload)

```bash
podman-compose up dev
```

This starts a Node.js container with your project root mounted as a volume. Vite's HMR works through the volume mount — edit files locally, see changes instantly at [http://localhost:3000](http://localhost:3000).

### Production Preview

```bash
podman-compose up prod
```

This builds the project inside a container and serves it with nginx at [http://localhost:8080](http://localhost:8080).

### Standalone Commands

```bash
# Build production image
podman build -t critter-mound -f Containerfile .

# Run production container
podman run -d -p 8080:80 critter-mound

# Stop all services
podman-compose down

# Rebuild after dependency changes
podman-compose up --build dev
podman-compose up --build prod
```

---

## Troubleshooting

### Podman Rootless Networking

If `localhost` doesn't work on macOS, try:
```bash
# Check the Podman machine IP
podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}'

# Or use 0.0.0.0 binding (already configured in podman-compose.yml)
```

### Vite HMR Not Working in Container

If hot-reload doesn't pick up changes, Vite may need filesystem polling. Add to `vite.config.js`:
```js
server: {
  watch: {
    usePolling: true,
    interval: 1000
  }
}
```

This is already handled in the dev container via the `CHOKIDAR_USEPOLLING=true` environment variable.

### Node Modules Issues

The dev container installs `node_modules` inside the container. If you see version mismatches:
```bash
# Rebuild the dev container from scratch
podman-compose down
podman-compose up --build dev
```

### Port Conflicts

If port 3000 or 8080 is already in use:
```bash
# Check what's using the port
lsof -i :3000

# Or override the port
podman-compose run -p 3001:3000 dev
```
```

- [ ] **Step 2: Commit**

```bash
git add docs/LOCAL_DEVELOPMENT.md
git commit -m "docs: add local development guide with Podman setup"
```

---

### Task 3: Create `Containerfile` (Multi-Stage Build)

**Files:**
- Create: `Containerfile`

- [ ] **Step 1: Write the Containerfile**

Create `Containerfile` at the project root with the following content:

```dockerfile
# Stage 1: Build the application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source files
COPY index.html ./
COPY vite.config.js ./
COPY postcss.config.js ./
COPY src/ ./src/
COPY public/ ./public/

# Build for production
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 2: Commit**

```bash
git add Containerfile
git commit -m "build: add multi-stage Containerfile for Podman/Docker"
```

---

### Task 4: Create `nginx.conf`

**Files:**
- Create: `nginx.conf`

- [ ] **Step 1: Write the nginx config**

Create `nginx.conf` at the project root:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1000;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add nginx.conf
git commit -m "build: add nginx config for production container"
```

---

### Task 5: Create `podman-compose.yml`

**Files:**
- Create: `podman-compose.yml`

- [ ] **Step 1: Write the compose file**

Create `podman-compose.yml` at the project root:

```yaml
version: "3.8"

services:
  dev:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    ports:
      - "3000:3000"
    environment:
      - CHOKIDAR_USEPOLLING=true
    command: sh -c "npm install && npm run dev -- --host 0.0.0.0"

  prod:
    build:
      context: .
      dockerfile: Containerfile
    ports:
      - "8080:80"

volumes:
  node_modules:
```

- [ ] **Step 2: Commit**

```bash
git add podman-compose.yml
git commit -m "build: add podman-compose with dev (HMR) and prod services"
```

---

### Task 6: Update `.dockerignore` and Delete `Dockerfile`

**Files:**
- Modify: `.dockerignore`
- Delete: `Dockerfile`

- [ ] **Step 1: Update `.dockerignore`**

Replace the contents of `.dockerignore` with:

```
# Dependencies
node_modules

# Build output
dist

# Git
.git
.gitignore
.gitattributes

# GitHub
.github

# Container files (don't copy into context recursively)
Dockerfile
Containerfile
.dockerignore
podman-compose.yml

# Documentation (not needed in container)
*.md
docs/

# IDE and editor files
.vscode
.idea
.replit
.claude
.serena
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Test artifacts
playwright-report/
test-results/
```

- [ ] **Step 2: Delete the obsolete Dockerfile**

```bash
rm Dockerfile
```

- [ ] **Step 3: Commit**

```bash
git add .dockerignore
git rm Dockerfile
git commit -m "build: update .dockerignore, remove obsolete Dockerfile"
```

---

### Task 7: Smoke Test the Podman Build

- [ ] **Step 1: Test the production build locally with Podman**

```bash
podman build -t critter-mound-test -f Containerfile .
```

Expected: Build completes with no errors. Two stages (build + serve) should both succeed.

- [ ] **Step 2: Run the container**

```bash
podman run -d --name cm-test -p 8080:80 critter-mound-test
```

Expected: Container starts without errors.

- [ ] **Step 3: Verify the game loads**

```bash
curl -s http://localhost:8080 | head -5
```

Expected: Shows `<!DOCTYPE html>` and the Critter Mound HTML.

- [ ] **Step 4: Clean up**

```bash
podman stop cm-test
podman rm cm-test
podman rmi critter-mound-test
```

- [ ] **Step 5: Test podman-compose dev service starts**

```bash
podman-compose up dev -d
sleep 10
curl -s http://localhost:3000 | head -5
podman-compose down
```

Expected: Shows the game HTML after Vite dev server starts.

---

### Task 8: Final Verification

- [ ] **Step 1: Verify all files exist**

```bash
ls -la docs/GAME_DESIGN.md docs/LOCAL_DEVELOPMENT.md Containerfile nginx.conf podman-compose.yml
```

Expected: All 5 files present.

- [ ] **Step 2: Verify Dockerfile is deleted**

```bash
test -f Dockerfile && echo "ERROR: Dockerfile still exists" || echo "OK: Dockerfile removed"
```

Expected: `OK: Dockerfile removed`

- [ ] **Step 3: Review git log**

```bash
git log --oneline -6
```

Expected: 6 commits covering docs, Containerfile, nginx, compose, and cleanup.
