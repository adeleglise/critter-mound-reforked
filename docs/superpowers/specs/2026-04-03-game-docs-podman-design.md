# Critter Mound Documentation & Podman Setup - Design Spec

## Overview

Two deliverables:

1. **`docs/GAME_DESIGN.md`** - Complete game mechanics bible covering all systems, balancing formulas, and early/mid/late game progression
2. **`docs/LOCAL_DEVELOPMENT.md`** - Developer setup guide with Podman dev/prod environments

Both documents are in English, consistent with the existing codebase language.

## Deliverable 1: Game Design Document

### File: `docs/GAME_DESIGN.md`

### Structure

#### 1. Game Overview

Brief description of Critter Mound as an incremental breeding game from 2014, now modernized. Core gameplay loop:

```
Breed Critters -> Assign to Roles -> Produce Resources -> Upgrade Capacity -> Fight Wars -> Repeat
```

#### 2. Core Systems

##### 2a. Critter Traits

5 traits, each with combat and worker roles:

| Trait | Combat Role | Worker Role | Key Formula |
|-------|-----------|-------------|-------------|
| Vitality | HP pool | Sod production (factory) | Health = Vitality * 15 |
| Strength | +50% bonus to Bite in battle | Carrying capacity | carryPerSecond = 60/actionTimeSeconds * strength/60 |
| Agility | +50% bonus to Sting in battle, turn order | Action speed for all tasks | actionTime = max(3s, 30 * 0.9^log2(agility)) |
| Bite | Attack/Defense (opposes Sting) | Grass farming | grassPerSecond = 60/actionTimeSeconds * bite/60 |
| Sting | Attack/Defense (opposes Bite) | Dirt mining | dirtPerSecond = 60/actionTimeSeconds * sting/60 |

Score formula: `(vitality * strength * agility * bite * sting) ^ 0.2` (geometric mean)

Caps: traits = 999,999 | genes = 100 | level = 99

##### 2b. Breeding & Genetics

**Stat Inheritance:**
- Offspring stat = random value between `min(parent1, parent2) - variance` and `max(parent1, parent2) + variance`
- Variance: `floor(n/50) + 1` for values < 1,000; capped at 20 for values >= 1,000
- Stats clamped to [1, 999999]

**Gene Expression (Mendelian):**

| Parent 1 / Parent 2 | None | Recessive | Dominant |
|---------------------|------|-----------|----------|
| None | 100% None | 50% None / 50% Rec | 100% Rec |
| Recessive | 50% None / 50% Rec | 25% None / 50% Rec / 25% Dom | 50% Rec / 50% Dom |
| Dominant | 100% Rec | 50% Rec / 50% Dom | 100% Dom |

- Dominant genes apply their bonus (good genes add %, bad genes subtract %)
- Gene values mutate using the same stat inheritance formula, capped at 100

**New Gene Discovery:**
- Each breed has a chance to discover a new gene: base 10 in 1000 (1%)
- Pity system: each miss increases chance by `10 * (1 + floor(missCount/25 * 10) / 10)`
- Requirements: trait base > 25 AND `MutationCheck(geneCount, bonus)` passes
- MutationCheck formula: if geneCount >= 10: `bonus >= (geneCount-10)*100 + 450`; else: `bonus >= geneCount*(geneCount-1)*5`
- Available genes: 16 per trait (80 total), plus 18 enemy-specific genes from wars

**Breeding Speed:**
- Royal Hatchery: breeds when both King and Queen reach full health (health regenerates at `health/actionTime` per tick)
- Heir Hatchery: consumes sod to breed. Cost scales with `score * 5`. Unlocked at 100 sod/sec.
- Boost: instant breed, recharges at 0.1 per natural breed cycle. Starting max: 10.

##### 2c. Production Chain

```
Miners (sting-based) -----> Dirt Stockpile --|
                                             |--> Carriers (strength-based) --> Factory Stockpile
Farmers (bite-based) -----> Grass Stockpile -|
                                                              |
                                             Factories (vitality-based) --> Sod (currency)
```

- Each tick (20/sec): miners produce dirt, farmers produce grass
- Carriers move dirt and grass to factory stockpile (rate = carryPerSecond, capped by available resources)
- Factories convert min(factoryDirt, factoryGrass) into sod at sodPerSecond rate
- Production bottleneck: effective sod/sec = min(mining, farming, carrying, factory) rate
- Worker auto-assignment: new workers go to the lowest-production role where they can contribute
- Bonus percentages from war rewards apply multiplicatively per role

**Upgrade Costs:**
- Hatcheries: `UpgradeCost(currentSize, 10)` = `10 * 10^(currentSize-1)` sod
- Worker/Army slots: `UpgradeCost(currentSize, 500)` = `500 * 10^(currentSize-1)` sod
- All slots max at 10

##### 2d. Combat System

**Battle Flow:**
1. Turn order determined by actionTime (lower = faster)
2. Each turn: coin flip decides matchup (Bite attack vs Sting defense, or vice versa)
3. Damage = `attack^2 / defense`, with +/-10% random variance
4. Minimum damage = defender's HP / 20 (guaranteed progress)
5. Critical hit: % chance = attacker's level (player only), doubles attack value
6. Battle ends when all of one side are eliminated

**Army Roles (top 3 soldiers by sort order):**
- **General**: enables auto-battle; bonus = level * 10% to auto-battle speed
- **Scout**: enables exploration; bonus = level * 10% to explore speed
- **Medic**: bonus = level * 10% to healing speed between battles

**Army Upgrades (per-war artifacts):**
- Found on map tiles: +5% to Strength, Agility, Bite, or Sting (random)
- Applied to all player army critters during that war
- Reset when war ends

**XP and Leveling:**
- Killing an enemy grants XP equal to the enemy's XP value
- Level formula: `floor((sqrt(4 + 8*xp) - 2) / 4)`, max 99
- Ranks: Recruit -> Soldier (level 8+) -> Veteran (level 15+) -> Elite

##### 2e. War & Map System

**Map:** 20x20 grid with fog of war

**Danger Levels:** Scale from ~1 near your mound to ~15 near the enemy mound. Enemy base stats scale linearly: `lowBaseValue + (danger-1)/14 * (highBaseValue - lowBaseValue)`

**Enemy army size:** `armySizeBase + floor(danger/5)` per battle

**Map Rewards (one per war, permanent except artifacts):**
| Reward | Effect | Permanent? |
|--------|--------|-----------|
| Mine | +2% mining speed | Yes |
| Farm | +2% farming speed | Yes |
| Equipment | +2% carrying capacity | Yes |
| Factory | +2% sod production | Yes |
| Enemy Gene | Queen absorbs enemy mutation | Yes |
| Boost | +5 max boosts | Yes |
| High Ground | +50% explore speed (this map) | Per-war |
| Fort | +50% tracking speed (this map) | Per-war |
| Artifacts (x4) | +5% to random combat stat | Per-war |

**Nation Unlock Chain:** Defeating a nation unlocks the next one in its category.

**Explore/Auto-Battle Timers:**
- Explore: 30 seconds base, reduced by Scout bonus + High Ground + defeated enemy bonus
- Auto-Battle: 60 seconds base, reduced by General bonus + Fort + defeated enemy bonus

#### 3. Nations Reference

**6 Categories, 3 Tiers each:**

| Category | Tier 1 | Tier 2 | Tier 3 | Custom Behavior |
|----------|--------|--------|--------|-----------------|
| Balanced | Crickets (5-50) | Ants (1k-2k) | Grasshoppers (15k-25k) | No stat modifications |
| High Numbers | Gnats (50-100) | Chiggers (2k-3k) | Ladybugs (25k-50k) | 2x army size, all stats /1.2 |
| High Sting | Bees (100-200) | Wasps (3k-5k) | Scorpions (50k-75k) | custom=2: Sting *1.3, Agility *1.3, Bite /1.3, Strength /1.3 |
| High Bite | Beetles (200-300) | Horseflies (5k-7.5k) | Termites (75k-100k) | custom=1: Bite *1.3, Strength *1.3, Sting /1.3, Agility /1.3 |
| High Health | Ticks (300-500) | Mosquitoes (7.5k-10k) | Leeches (100k-125k) | Vitality *2, Bite & Strength *0.75 |
| Solo Fighter | Centipedes (500-1k) | Praying Mantis (10k-15k) | Tarantulas (125k-150k) | 1 enemy, all stats * 0.7 * normal_army_size |

**Unlock Chains:**
- Crickets (start) -> Ants -> Grasshoppers
- Crickets -> Gnats -> Chiggers -> Ladybugs
- Gnats -> Bees -> Wasps -> Scorpions
- Bees -> Beetles -> Horseflies -> Termites
- Beetles -> Ticks -> Mosquitoes -> Leeches
- Ticks -> Centipedes -> Praying Mantis -> Tarantulas

#### 4. Game Progression Phases

##### Early Game (Generations 0-50, Score ~5-100)

**Goals:** Establish breeding, first workers, first war victory

- Start with King + Queen, both with base 5 in all traits
- Breed to improve traits through stat variance
- Assign first workers to build production chain
- Accumulate sod to upgrade hatchery slots (10 -> 100 -> 1,000 sod)
- Start first war: Crickets (base 5-50, army size 1-4)
- First mutations begin appearing around base 25+
- Key milestone: First hatchery upgrades, first war victory

**Player Focus:** Understanding breeding mechanics, learning worker assignment, basic combat

##### Mid Game (Generations 50-300, Score ~100-5,000)

**Goals:** Full production chain, Heir Hatchery, defeat Tier 1-2 nations

- Production reaching 100 sod/sec unlocks Heir Hatchery
- Heir Hatchery provides parallel breeding (sod-fueled, score*5 cost)
- Work through Tier 1 nations: Crickets, Gnats, Bees, Beetles, Ticks, Centipedes
- Begin Tier 2: Ants, Chiggers, Wasps, Horseflies, Mosquitoes, Praying Mantis
- Accumulate permanent war bonuses (+2% per nation per resource type)
- Enemy gene absorption begins boosting Queen's mutations
- Upgrade worker/army slots (500 -> 500,000 sod)
- Army leveling becomes important for roles (General/Scout/Medic)

**Player Focus:** Optimizing production bottlenecks, strategic worker placement, army composition

##### Late Game (Generations 300+, Score ~5,000-100,000+)

**Goals:** Defeat all Tier 3 nations, max achievements, optimize everything

- Tier 3 nations: Grasshoppers (15k-25k), Ladybugs (25k-50k), Scorpions (50k-75k), Termites (75k-100k), Leeches (100k-125k), Tarantulas (125k-150k)
- Approaching trait cap (999,999) and gene cap (100)
- Achievement hunting: 100k+ trait values, 50+ mutations, 500k+ production rates
- All 18 maps completed
- PrestigeSystem and EventSystem exist in code but are not yet wired into the game loop

**Player Focus:** Min-maxing breeding for specific traits, completing all achievements, conquering final nations

#### 5. Balancing Formulas Quick Reference

```
StatVariance(n)        = n < 1000 ? floor(n/50) + 1 : 20
MutationCheck(genes,b) = genes >= 10 ? b >= (genes-10)*100+450 : b >= genes*(genes-1)*5
UpgradeCost(level,base) = base * 10^(level-1)
LevelFromXp(xp)        = min(99, floor((sqrt(4+8*xp)-2)/4))
Score                   = (vit * str * agi * bite * sting) ^ 0.2
Health                  = vitality * 15
ActionTime              = max(3s, 30 * 0.9^log2(agility))
WorkerOutput            = 60 / actionTimeSeconds * traitValue / 60
BattleDamage            = attack^2 / defense (+/- 10%)
MinDamage               = defenderHP / 20
CritChance              = attackerLevel% (player only, 2x attack)
NewGeneChance           = 10 * (1 + floor(missCount/25 * 10) / 10) in 1000
EnemyBaseStat           = lowBase + (danger-1)/14 * (highBase - lowBase)
EnemyArmySize           = armySizeBase + floor(danger/5)
```

#### 6. Unintegrated Systems (Code Present, Not Active)

- **PrestigeSystem**: Points = `floor(sqrt(generations * achievements))`, 10% bonus per point. Reset preserves boosts and achievements.
- **EventSystem**: Two events defined (Seasonal Swarm: 2x bonus 24h, Mutation Surge: +50 mutation chance 12h). Not triggered.
- **AutoAssignWorkers**: Auto-assign based on bottleneck. Not connected to UI.

---

## Deliverable 2: Local Development Guide

### File: `docs/LOCAL_DEVELOPMENT.md`

### Structure

#### 1. Prerequisites
- Node.js >= 18
- npm >= 9
- Podman >= 4.0 (or Docker as drop-in replacement)
- podman-compose >= 1.0

#### 2. Quick Start (Native)
```bash
npm install
npm run dev    # http://localhost:3000 with HMR
```

#### 3. Available npm Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR (port 3000) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run format` | Format code with Prettier |
| `npm run lint` | Lint JavaScript with ESLint |
| `npm test` | Run Playwright tests |
| `npm run test:ui` | Playwright test UI |
| `npm run test:headed` | Headed browser tests |

#### 4. Podman Setup

##### Containerfile (multi-stage)

**Stage 1 (build):** `node:18-alpine` - runs `npm ci && npm run build`
**Stage 2 (serve):** `nginx:alpine` - copies `dist/` to nginx html, custom nginx.conf for SPA routing

##### podman-compose.yml

Two services:

**`dev` service:**
- Image: `node:18-alpine`
- Volume mounts: entire project root (read-write)
- Command: `npm install && npm run dev -- --host 0.0.0.0`
- Port: `3000:3000`
- Hot-reload via Vite HMR through volume mount

**`prod` service:**
- Build from Containerfile (multi-stage)
- Port: `8080:80`
- No volume mounts, fully self-contained

##### Commands
```bash
# Development with hot-reload
podman-compose up dev

# Production preview
podman-compose up prod

# Build production image only
podman build -t critter-mound .

# Run production standalone
podman run -d -p 8080:80 critter-mound
```

#### 5. Troubleshooting
- Podman rootless networking notes
- Vite HMR through container (polling fallback if needed)
- Node modules volume strategy

---

## Project File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `docs/GAME_DESIGN.md` | Create | Game mechanics documentation |
| `docs/LOCAL_DEVELOPMENT.md` | Create | Developer setup guide |
| `Containerfile` | Create | Multi-stage Podman/Docker build |
| `podman-compose.yml` | Create | Dev + prod compose services |
| `Dockerfile` | Delete | Obsolete (copies wrong paths) |

---

## Out of Scope

- Modifying game code or balancing
- Integrating PrestigeSystem/EventSystem into the game loop
- MkDocs/TechDocs integration (existing setup in `mkdocs.yml` remains unchanged)
- Mobile/responsive documentation
