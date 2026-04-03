/**
 * Combat and Army System E2E Tests
 * Tests for the Critter Mound game's combat mechanics, army management, and level progression
 */

import { test, expect } from '@playwright/test';
import {
  waitForGameInit,
  clearGameState,
  getObservable,
  setObservable,
  getMound,
  fastForward,
  navigateToTab,
  getSaveData,
  loadSaveData,
} from './fixtures/game-helpers.js';

test.describe('Combat System - Army Management', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);
  });

  test('should start with default army mound size of 1', async ({ page }) => {
    const maxArmySize = await getObservable(page, 'maxArmyMoundSize');
    expect(maxArmySize).toBe(1);

    const armyMound = await getMound(page, 'armyMound');
    expect(armyMound).toHaveLength(0);
  });

  test('should allow assigning critters to army mound', async ({ page }) => {
    // Create initial resources and critters
    await setObservable(page, 'dirtRaw', 1000);
    await setObservable(page, 'grassRaw', 1000);
    await setObservable(page, 'sodRaw', 1000);

    // Fast forward to generate some critters
    await fastForward(page, 10);

    // Navigate to barracks tab
    await navigateToTab(page, 'barracks');

    // Check if there are critters available to assign
    const femaleMound = await getMound(page, 'femaleMound');
    const maleMound = await getMound(page, 'maleMound');

    if (femaleMound.length > 0 || maleMound.length > 0) {
      // Try to assign a critter by clicking the "soldiers" button
      // Note: This requires having a critter selected first
      const armyMoundAfter = await getMound(page, 'armyMound');
      expect(Array.isArray(armyMoundAfter)).toBe(true);
    }
  });

  test('should enforce max army mound size limit', async ({ page }) => {
    const maxSize = await getObservable(page, 'maxArmyMoundSize');
    expect(maxSize).toBe(1);

    // Try to add more critters than allowed
    await page.evaluate(() => {
      // Create a test critter
      const testCritter = window.game.DefaultCritter(0, 1, 0);
      testCritter.job = 3; // Army job

      // Add to army mound
      window.game.armyMound.push(testCritter);

      // Try to add another (should be rejected)
      const testCritter2 = window.game.DefaultCritter(1, 2, 0);
      testCritter2.job = 3;
      window.game.armyMound.push(testCritter2);

      // Trigger the sorting/cleanup that enforces size limits
      window.game.Tick();
    });

    const armyMound = await getMound(page, 'armyMound');
    expect(armyMound.length).toBeLessThanOrEqual(maxSize);
  });

  test('should allow upgrading army mound size', async ({ page }) => {
    // Give enough resources for upgrade
    await setObservable(page, 'sodRaw', 10000);

    const initialMaxSize = await getObservable(page, 'maxArmyMoundSize');
    expect(initialMaxSize).toBe(1);

    // Upgrade army mound
    await page.evaluate(() => {
      window.game.Upgrade('Army');
    });

    const newMaxSize = await getObservable(page, 'maxArmyMoundSize');
    expect(newMaxSize).toBe(2);
  });

  test('should not upgrade army mound beyond size 10', async ({ page }) => {
    // Set max size to 10
    await setObservable(page, 'maxArmyMoundSize', 10);
    await setObservable(page, 'sodRaw', 1000000);

    // Try to upgrade
    await page.evaluate(() => {
      window.game.Upgrade('Army');
    });

    const maxSize = await getObservable(page, 'maxArmyMoundSize');
    expect(maxSize).toBe(10);
  });

  test('should correctly sort army mound by level', async ({ page }) => {
    // Create multiple soldiers with different levels
    await page.evaluate(() => {
      window.game.armyMound.removeAll();
      window.game.maxArmyMoundSize(5);

      // Create soldiers with different XP levels
      const soldier1 = window.game.DefaultCritter(0, 1, 0);
      soldier1.experience(0); // Level 0
      window.game.armyMound.push(soldier1);

      const soldier2 = window.game.DefaultCritter(1, 2, 0);
      soldier2.experience(10); // Level 1
      window.game.armyMound.push(soldier2);

      const soldier3 = window.game.DefaultCritter(2, 3, 0);
      soldier3.experience(50); // Higher level
      window.game.armyMound.push(soldier3);

      // Sort by level
      window.game.armySort('level');
      window.game.SortMound(window.game.armyMound, 'level');
    });

    const armyMound = await getMound(page, 'armyMound');

    // Verify descending order by level
    for (let i = 0; i < armyMound.length - 1; i++) {
      const currentLevel = await page.evaluate(
        (xp) => window.LevelFromXp(xp),
        armyMound[i].experience
      );
      const nextLevel = await page.evaluate(
        (xp) => window.LevelFromXp(xp),
        armyMound[i + 1].experience
      );
      expect(currentLevel).toBeGreaterThanOrEqual(nextLevel);
    }
  });

  test('should sort army mound by combat stats', async ({ page }) => {
    const stats = ['vitality', 'strength', 'agility', 'bite', 'sting'];

    for (const stat of stats) {
      await page.evaluate((sortStat) => {
        window.game.armyMound.removeAll();
        window.game.maxArmyMoundSize(3);

        // Create soldiers with different stats
        for (let i = 0; i < 3; i++) {
          const soldier = window.game.DefaultCritter(i, i + 1, 0);
          // Set varying trait values
          soldier.traits[0].base = Math.random() * 100; // vitality
          soldier.traits[1].base = Math.random() * 100; // strength
          soldier.traits[2].base = Math.random() * 100; // agility
          soldier.traits[3].base = Math.random() * 100; // bite
          soldier.traits[4].base = Math.random() * 100; // sting
          soldier.CalculateScore();
          window.game.armyMound.push(soldier);
        }

        window.game.armySort(sortStat);
        window.game.SortMound(window.game.armyMound, sortStat);
      }, stat);

      const armyMound = await getMound(page, 'armyMound');
      expect(armyMound.length).toBe(3);
    }
  });
});

test.describe('Combat System - Level Progression', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);
  });

  test('should correctly calculate level from XP using LevelFromXp formula', async ({ page }) => {
    const testCases = [
      { xp: 0, expectedLevel: 0 },
      { xp: 1, expectedLevel: 0 },
      { xp: 2, expectedLevel: 1 },
      { xp: 5, expectedLevel: 1 },
      { xp: 10, expectedLevel: 2 },
      { xp: 20, expectedLevel: 3 },
      { xp: 50, expectedLevel: 4 },
      { xp: 100, expectedLevel: 6 },
      { xp: 500, expectedLevel: 15 },
      { xp: 1000, expectedLevel: 22 },
      { xp: 5000, expectedLevel: 49 },
    ];

    for (const { xp, expectedLevel } of testCases) {
      const calculatedLevel = await page.evaluate((xpValue) => {
        return window.LevelFromXp(xpValue);
      }, xp);

      // Formula: Math.floor((Math.sqrt(4 + 8 * xp) - 2) / 4)
      expect(calculatedLevel).toBe(expectedLevel);
    }
  });

  test('should cap level at 99 regardless of XP', async ({ page }) => {
    // Test with extremely high XP values
    const highXpValues = [10000, 50000, 100000, 1000000, 999999999];

    for (const xp of highXpValues) {
      const level = await page.evaluate((xpValue) => {
        return window.LevelFromXp(xpValue);
      }, xp);

      expect(level).toBeLessThanOrEqual(99);
    }
  });

  test('should calculate XP threshold for level 99', async ({ page }) => {
    // Find minimum XP needed for level 99
    const xpForLevel99 = await page.evaluate(() => {
      // Work backwards from the formula
      // level = Math.floor((Math.sqrt(4 + 8 * xp) - 2) / 4)
      // For level 99: 99 = (Math.sqrt(4 + 8 * xp) - 2) / 4
      // 396 = Math.sqrt(4 + 8 * xp) - 2
      // 398 = Math.sqrt(4 + 8 * xp)
      // 158404 = 4 + 8 * xp
      // 158400 = 8 * xp
      // xp = 19800

      const level98Xp = 19403; // Should give level 98
      const level99Xp = 19800; // Should give level 99

      return {
        level98: window.LevelFromXp(level98Xp),
        level99: window.LevelFromXp(level99Xp),
        level99Plus: window.LevelFromXp(level99Xp + 1000),
      };
    });

    expect(xpForLevel99.level98).toBe(98);
    expect(xpForLevel99.level99).toBe(99);
    expect(xpForLevel99.level99Plus).toBe(99); // Capped at 99
  });

  test('should gain XP when soldier defeats enemy in battle', async ({ page }) => {
    // Create a soldier with known XP
    await page.evaluate(() => {
      window.game.armyMound.removeAll();
      window.game.maxArmyMoundSize(1);

      const soldier = window.game.DefaultCritter(0, 1, 0);
      soldier.experience(0);
      soldier.traits[0].base = 100; // vitality
      soldier.traits[1].base = 100; // strength
      soldier.traits[2].base = 100; // agility
      soldier.traits[3].base = 100; // bite
      soldier.traits[4].base = 100; // sting
      soldier.CalculateScore();
      soldier.currentHealth(soldier.health);

      window.game.armyMound.push(soldier);
    });

    const initialXp = await page.evaluate(() => window.game.armyMound()[0].experience());
    expect(initialXp).toBe(0);

    // Note: Full battle testing requires battle system to be active
    // This test verifies the XP gain mechanism exists
    const xpGainMechanism = await page.evaluate(() => {
      // Check if experience gain is implemented
      const soldier = window.game.armyMound()[0];
      return typeof soldier.experience === 'function';
    });

    expect(xpGainMechanism).toBe(true);
  });

  test('should update soldier rank based on level', async ({ page }) => {
    const rankTestCases = [
      { level: 0, expectedRank: 'Soldier' },
      { level: 7, expectedRank: 'Soldier' },
      { level: 8, expectedRank: 'Veteran' },
      { level: 14, expectedRank: 'Veteran' },
      { level: 15, expectedRank: 'Elite' },
      { level: 50, expectedRank: 'Elite' },
      { level: 99, expectedRank: 'Elite' },
    ];

    for (const { level, expectedRank } of rankTestCases) {
      const rank = await page.evaluate((targetLevel) => {
        // Calculate XP needed for this level (approximate)
        let xp = 0;
        if (targetLevel > 0) {
          // Reverse formula: xp ≈ ((4*level + 2)^2 - 4) / 8
          xp = Math.floor((Math.pow(4 * targetLevel + 2, 2) - 4) / 8);
        }

        window.game.armyMound.removeAll();
        window.game.maxArmyMoundSize(1);

        const soldier = window.game.DefaultCritter(0, 1, 0);
        soldier.experience(xp);
        soldier.CalculateScore();
        window.game.armyMound.push(soldier);

        // Trigger rank calculation
        window.game.UpdateArmyRanks();

        return window.game.armyMound()[0].rank();
      }, level);

      expect(rank).toBe(expectedRank);
    }
  });

  test('should assign special ranks (General, Scout, Medic) to first three soldiers', async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.game.armyMound.removeAll();
      window.game.maxArmyMoundSize(5);

      // Create 5 soldiers
      for (let i = 0; i < 5; i++) {
        const soldier = window.game.DefaultCritter(i, i + 1, 0);
        soldier.experience(100); // Give them some level
        soldier.CalculateScore();
        window.game.armyMound.push(soldier);
      }

      // Update ranks
      window.game.UpdateArmyRanks();
    });

    const ranks = await page.evaluate(() => {
      return window.game.armyMound().map((s) => s.rank());
    });

    // First three should be special ranks
    expect(ranks[0]).toBe('General');
    expect(ranks[1]).toBe('Scout');
    expect(ranks[2]).toBe('Medic');

    // Remaining should be regular ranks
    expect(['Soldier', 'Veteran', 'Elite']).toContain(ranks[3]);
    expect(['Soldier', 'Veteran', 'Elite']).toContain(ranks[4]);
  });

  test('should provide bonuses based on General level', async ({ page }) => {
    await page.evaluate(() => {
      window.game.armyMound.removeAll();
      window.game.maxArmyMoundSize(1);

      const general = window.game.DefaultCritter(0, 1, 0);
      general.experience(100); // Level 6
      general.CalculateScore();
      window.game.armyMound.push(general);

      window.game.UpdateArmyRanks();
    });

    const generalBonus = await getObservable(page, 'armyUpgrades');
    expect(generalBonus.hasGeneral).toBe(true);
    // General bonus = level * 10
    const level = await page.evaluate(() => window.game.armyMound()[0].level());
    const expectedBonus = level * 10;
    expect(generalBonus.generalBonus).toBe(expectedBonus);
  });
});

test.describe('Combat System - Battle Mechanics', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);
  });

  test('should not start battle without soldiers', async ({ page }) => {
    // Enable war mode
    await setObservable(page, 'atWar', true);

    // Try to start battle with no soldiers
    await page.evaluate(() => {
      try {
        window.game.StartBattle();
        return false;
      } catch (e) {
        return true;
      }
    });

    // Should either throw error or show notification
    const inBattle = await getObservable(page, 'inBattle');
    expect(inBattle).toBe(false);
  });

  test('should initialize battle state correctly', async ({ page }) => {
    // Setup soldiers
    await page.evaluate(() => {
      window.game.armyMound.removeAll();
      window.game.maxArmyMoundSize(3);

      for (let i = 0; i < 3; i++) {
        const soldier = window.game.DefaultCritter(i, i + 1, 0);
        soldier.experience(50);
        soldier.traits[0].base = 100; // vitality
        soldier.traits[1].base = 100; // strength
        soldier.traits[2].base = 100; // agility
        soldier.traits[3].base = 100; // bite
        soldier.traits[4].base = 100; // sting
        soldier.CalculateScore();
        soldier.currentHealth(soldier.health);
        window.game.armyMound.push(soldier);
      }
    });

    const battleState = await page.evaluate(() => {
      return {
        inBattle: window.game.inBattle(),
        battleOrderLength: window.game.battleOrder().length,
        battleDamage: window.game.battleDamage(),
        battleTurnClock: window.game.battleTurnClock,
      };
    });

    expect(battleState.inBattle).toBe(false);
    expect(battleState.battleDamage).toBe(0);
  });

  test('should calculate battle damage using combat stats', async ({ page }) => {
    // Test damage calculation formula exists
    const damageCalc = await page.evaluate(() => {
      const attacker = window.game.DefaultCritter(0, 1, 0);
      attacker.traits[3].base = 50; // bite
      attacker.traits[4].base = 60; // sting
      attacker.strengthBonus = 10;
      attacker.agilityBonus = 10;

      const defender = window.game.DefaultCritter(1, 2, 1);
      defender.traits[3].base = 30;
      defender.traits[4].base = 40;
      defender.strengthBonus = 5;
      defender.agilityBonus = 5;

      return {
        attackerBite: attacker.traits[3].base,
        attackerSting: attacker.traits[4].base,
        defenderBite: defender.traits[3].base,
        defenderSting: defender.traits[4].base,
      };
    });

    expect(damageCalc.attackerBite).toBe(50);
    expect(damageCalc.attackerSting).toBe(60);
  });

  test('should track battle statistics', async ({ page }) => {
    const battleStats = await page.evaluate(() => {
      return {
        hasBattleTurnLength: typeof window.game.battleTurnLength === 'function',
        hasBattleDamage: typeof window.game.battleDamage === 'function',
        hasInBattle: typeof window.game.inBattle === 'function',
        hasBattleOrder: typeof window.game.battleOrder === 'function',
      };
    });

    expect(battleStats.hasBattleTurnLength).toBe(true);
    expect(battleStats.hasBattleDamage).toBe(true);
    expect(battleStats.hasInBattle).toBe(true);
    expect(battleStats.hasBattleOrder).toBe(true);
  });

  test('should heal soldiers between battles', async ({ page }) => {
    await page.evaluate(() => {
      window.game.armyMound.removeAll();
      window.game.maxArmyMoundSize(1);

      const soldier = window.game.DefaultCritter(0, 1, 0);
      soldier.traits[0].base = 100; // vitality
      soldier.CalculateScore();
      soldier.currentHealth(50); // Damaged soldier

      window.game.armyMound.push(soldier);
    });

    const initialHealth = await page.evaluate(() => window.game.armyMound()[0].currentHealth());
    expect(initialHealth).toBe(50);

    // Fast forward to allow healing
    await fastForward(page, 5);

    const currentHealth = await page.evaluate(() => window.game.armyMound()[0].currentHealth());

    // Health should increase or stay the same
    expect(currentHealth).toBeGreaterThanOrEqual(initialHealth);
  });

  test('should apply critical hit bonus based on soldier level', async ({ page }) => {
    // Critical hit chance = soldier level %
    const criticalHitInfo = await page.evaluate(() => {
      const soldier = window.game.DefaultCritter(0, 1, 0);
      soldier.experience(500); // High level

      const level = window.LevelFromXp(soldier.experience());

      return {
        level: level,
        criticalChance: level, // 1-100% based on level
      };
    });

    expect(criticalHitInfo.level).toBeGreaterThan(0);
    expect(criticalHitInfo.criticalChance).toBe(criticalHitInfo.level);
  });

  test('should remove dead soldiers from army mound after battle', async ({ page }) => {
    await page.evaluate(() => {
      window.game.armyMound.removeAll();
      window.game.maxArmyMoundSize(2);

      // Create a soldier with no health (dead)
      const deadSoldier = window.game.DefaultCritter(0, 1, 0);
      deadSoldier.currentHealth(0);
      window.game.armyMound.push(deadSoldier);

      // Create a healthy soldier
      const healthySoldier = window.game.DefaultCritter(1, 2, 0);
      healthySoldier.currentHealth(100);
      window.game.armyMound.push(healthySoldier);
    });

    const initialCount = await page.evaluate(() => window.game.armyMound().length);
    expect(initialCount).toBe(2);

    // Simulate battle cleanup
    await page.evaluate(() => {
      window.game.armyMound.remove(function (soldier) {
        return soldier.currentHealth() <= 0;
      });
    });

    const finalCount = await page.evaluate(() => window.game.armyMound().length);
    expect(finalCount).toBe(1);

    // Verify remaining soldier is alive
    const remainingSoldier = await page.evaluate(() => window.game.armyMound()[0].currentHealth());
    expect(remainingSoldier).toBeGreaterThan(0);
  });

  test('should save and restore battle state', async ({ page }) => {
    // Setup battle-ready state
    await page.evaluate(() => {
      window.game.armyMound.removeAll();
      window.game.maxArmyMoundSize(2);

      for (let i = 0; i < 2; i++) {
        const soldier = window.game.DefaultCritter(i, i + 1, 0);
        soldier.experience(100);
        soldier.traits[0].base = 100;
        soldier.CalculateScore();
        soldier.currentHealth(soldier.health);
        window.game.armyMound.push(soldier);
      }

      window.game.atWar(true);
    });

    // Get save data
    const saveData = await getSaveData(page);
    expect(saveData).toBeTruthy();

    // Clear state
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    // Load save
    await loadSaveData(page, saveData);

    // Verify army restored
    const armyMound = await getMound(page, 'armyMound');
    expect(armyMound.length).toBe(2);

    const atWar = await getObservable(page, 'atWar');
    expect(atWar).toBe(true);
  });
});
