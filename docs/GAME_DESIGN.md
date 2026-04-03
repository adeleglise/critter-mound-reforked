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
| Vitality | HP pool | Sod production (factory) | `Health = Vitality x 15` |
| Strength | +50% bonus to Bite in battle | Carrying capacity | `carryPerSecond = traitValue / actionTimeSeconds` |
| Agility | +50% bonus to Sting in battle, turn order | Action speed for all tasks | `actionTime = max(3s, 30 x 0.9^log2(agility))` |
| Bite | Attack/Defense (opposes Sting) | Grass farming | `grassPerSecond = traitValue / actionTimeSeconds` |
| Sting | Attack/Defense (opposes Bite) | Dirt mining | `dirtPerSecond = traitValue / actionTimeSeconds` |

**Score** is the geometric mean of all traits: `(vitality x strength x agility x bite x sting) ^ 0.2`

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
- **Pity system:** Every miss increments a counter. Chance increases: `10 x (1 + floor(missCount / 25 x 10) / 10)` per 1,000
- **Requirements for mutation to stick:** trait base > 25 AND MutationCheck passes
- **MutationCheck formula:**
  - If gene count < 10: `bonus >= geneCount x (geneCount - 1) x 5`
  - If gene count >= 10: `bonus >= (geneCount - 10) x 100 + 450`

There are 16 available genes per trait (80 total), plus 18 enemy-specific genes obtainable through wars.

#### Breeding Speed

- **Royal Hatchery:** Breeds when both King and Queen reach full health. Health regenerates at `health / actionTime` per tick. Faster agility = faster breeding.
- **Heir Hatchery:** Consumes sod to breed. Breeding cost scales with `score x 5`. Unlocked when sod production reaches 100/sec.
- **Boost:** Triggers an instant breed. Recharges at +0.1 per natural breed cycle. Starting maximum: 10 boosts.

### 2.3 Production Chain

```
Miners (sting)  -->  Dirt Stockpile  --+
                                       +--> Carriers (strength) --> Factory Stockpile
Farmers (bite)  -->  Grass Stockpile --+                                   |
                                                                Factories (vitality) --> Sod
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
| Hatchery (King/Queen) | 10 sod | `10 x 10^(currentSize - 1)` | 10 |
| Heir Hatchery | 10 sod | `10 x 10^(currentSize - 1)` | 10 |
| Worker slots (Mine/Farm/Carrier/Factory) | 500 sod | `500 x 10^(currentSize - 1)` | 10 |
| Army slots | 500 sod | `500 x 10^(currentSize - 1)` | 10 |

### 2.4 Combat System

#### Battle Flow

1. All critters (player + enemy) are sorted by actionTime (lower = faster)
2. Each turn, the next critter in order attacks
3. **Coin flip** decides the matchup:
   - Heads: Attacker's Bite (+Strength bonus) vs Defender's Sting (+Agility bonus)
   - Tails: Attacker's Sting (+Agility bonus) vs Defender's Bite (+Strength bonus)
4. **Damage formula:** `attack^2 / defense`, with +/-10% random variance
5. **Minimum damage:** `defender HP / 20` (guarantees battles always progress)
6. **Critical hit (player only):** chance = attacker's level %. Doubles attack value.
7. Battle ends when all critters on one side reach 0 HP

#### Army Roles

The top 3 soldiers (by sort order) receive special ranks:

| Rank | Role | Bonus |
|------|------|-------|
| **General** | Enables auto-battle | `level x 10%` faster auto-battle timer |
| **Scout** | Enables map exploration | `level x 10%` faster explore timer |
| **Medic** | Heals army between battles | `level x 10%` faster healing |

Remaining soldiers are ranked: Recruit -> Soldier (level 8+) -> Veteran (level 15+) -> Elite.

#### XP and Leveling

- Killing an enemy grants XP equal to the enemy's experience value
- **Level formula:** `min(99, floor((sqrt(4 + 8*xp) - 2) / 4))`
- All soldiers gain a critical hit chance bonus equal to their level percentage

#### Army Upgrades (Per-War)

Found on map tiles as artifacts. Each gives +5% to a random combat stat (Strength, Agility, Bite, or Sting). Applied to all player army critters during that war. Reset when the war ends.

### 2.5 War & Map System

#### Map Structure

Each war generates a **20x20 grid** with fog of war. Your mound spawns near one edge, the enemy base near the opposite edge.

#### Danger Levels

Tile danger scales with distance from your mound and proximity to the enemy:
- Near your mound: danger ~1-5
- Mid map: danger ~5-10
- Near enemy base: danger ~10-15
- Enemy base tile: danger 15+

**Enemy base stats** scale linearly with danger: `lowBaseValue + (danger - 1) / 14 x (highBaseValue - lowBaseValue)`

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
| Artifacts (x4) | +5% to a random combat stat | Per-war |

#### Explore & Auto-Battle Timers

- **Explore:** 30 seconds base. Reduced by: Scout bonus + High Ground (+50%) + defeated enemy bonus (+100%)
- **Auto-Battle:** 60 seconds base. Reduced by: General bonus + Fort (+50%) + defeated enemy bonus (+100%)

Both require the respective army role (Scout/General) to be assigned. Without them, the timer does not advance.

---

## 3. Nations Reference

### 6 Categories, 3 Tiers Each

| Category | Tier 1 (Base Stats) | Tier 2 (Base Stats) | Tier 3 (Base Stats) |
|----------|-------|-------|-------|
| **Balanced** | Crickets (5-50) | Ants (1k-2k) | Grasshoppers (15k-25k) |
| **High Numbers** | Gnats (50-100) | Chiggers (2k-3k) | Ladybugs (25k-50k) |
| **High Sting** | Bees (100-200) | Wasps (3k-5k) | Scorpions (50k-75k) |
| **High Bite** | Beetles (200-300) | Horseflies (5k-7.5k) | Termites (75k-100k) |
| **High Health** | Ticks (300-500) | Mosquitoes (7.5k-10k) | Leeches (100k-125k) |
| **Solo Fighter** | Centipedes (500-1k) | Praying Mantis (10k-15k) | Tarantulas (125k-150k) |

### Category Combat Modifiers

| Category | Modifier |
|----------|----------|
| **Balanced** | No stat modifications |
| **High Numbers** | 2x army size, all stats /1.2 |
| **High Sting** | Sting x1.3, Agility x1.3, Bite /1.3, Strength /1.3 |
| **High Bite** | Bite x1.3, Strength x1.3, Sting /1.3, Agility /1.3 |
| **High Health** | Vitality x2, Bite x0.75, Strength x0.75 |
| **Solo Fighter** | 1 enemy unit, all stats x 0.7 x normal army size (concentrated power) |

### Nation Unlock Chains

```
Crickets (start) --> Ants --> Grasshoppers
    |
    +---> Gnats --> Chiggers --> Ladybugs
            |
            +---> Bees --> Wasps --> Scorpions
                   |
                   +---> Beetles --> Horseflies --> Termites
                            |
                            +---> Ticks --> Mosquitoes --> Leeches
                                    |
                                    +---> Centipedes --> Praying Mantis --> Tarantulas
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

### Early Game (Generations 0-50, Score ~5-100)

**Goals:** Establish breeding, first workers, first war victory.

- Start with King + Queen, both base 5 in all traits
- Breed to slowly improve traits through stat variance
- Assign first workers to build the production chain (Dirt -> Grass -> Carry -> Factory -> Sod)
- Accumulate sod to upgrade hatchery slots (costs: 10 -> 100 -> 1,000 -> 10,000 sod)
- Start your first war against **Crickets** (balanced, base 5-50, army size 1-4)
- First mutations appear when trait base exceeds 25
- **Key milestones:** First hatchery upgrade, first war victory, first mutation

**Player Focus:** Understanding breeding mechanics, learning worker assignment, basic combat.

### Mid Game (Generations 50-300, Score ~100-5,000)

**Goals:** Full production chain optimization, Heir Hatchery, defeat Tier 1-2 nations.

- Production reaching **100 sod/sec** unlocks the **Heir Hatchery** (parallel breeding line fueled by sod)
- Work through Tier 1 nations across all 6 categories
- Begin Tier 2 nations (base stats 1,000-15,000)
- Accumulate **permanent war bonuses** (+2% per nation for mining, farming, carrying, factory)
- **Enemy gene absorption** starts significantly boosting Queen's mutation pool
- Upgrade worker/army slots (costs escalate: 500 -> 5,000 -> 50,000 -> 500,000 sod)
- Army leveling becomes important: General, Scout, and Medic roles unlock auto-battle and exploration
- Boost capacity grows through war rewards (+5 per Boost found)

**Player Focus:** Optimizing production bottlenecks, strategic worker placement, army composition and leveling.

### Late Game (Generations 300+, Score ~5,000-100,000+)

**Goals:** Defeat all Tier 3 nations, max achievements, optimize everything.

- Tier 3 nations range from 15,000 to 150,000 base stats
- Hardest nation: **Tarantulas** (solo fighter, base 125k-150k, concentrated stats)
- Approaching trait cap (999,999) and gene cap (100)
- Achievement hunting: breed 100,000+ in each trait, 50+ mutations, 500,000+ production rates
- Complete all 18 maps for maximum permanent bonuses
- Total possible bonuses: +36% to each worker type (18 nations x 2%)

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
BattleDamage             = attack^2 / defense (+/- 10%)
MinDamage                = defenderHP / 20
CritChance               = attackerLevel% (player only, 2x multiplier)
NewGeneChance            = 10 * (1 + floor(missCount/25 * 10) / 10) per 1000
EnemyBaseStat            = lowBase + (danger-1)/14 * (highBase - lowBase)
EnemyArmySize            = armySizeBase + floor(danger/5)
```

---

## 6. Unintegrated Systems

The following systems are defined in the code but **not yet connected** to the game loop:

- **PrestigeSystem:** Prestige points = `floor(sqrt(generations x achievements))`. Each point gives +10% bonus multiplier. Reset preserves max boosts and achievements.
- **EventSystem:** Two events -- Seasonal Swarm (2x bonus, 24h) and Mutation Surge (+50 mutation chance, 12h). Not triggered by any game logic.
- **AutoAssignWorkers:** Automatically assigns workers based on production bottlenecks. UI toggle exists in code but is not rendered.
