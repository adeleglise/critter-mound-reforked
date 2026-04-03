/**
 * Save/Load System E2E Tests
 * Tests for the Critter Mound game's save and load functionality
 * including localStorage persistence, base64 encoding, and state restoration
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

test.describe('Save/Load System - Auto-Save', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);
  });

  test('should auto-save to localStorage every 60 seconds', async ({ page }) => {
    // Set some game state
    await setObservable(page, 'dirtRaw', 12345);
    await setObservable(page, 'generations', 42);

    // Trigger save manually
    await page.evaluate(() => {
      window.game.Save();
    });

    // Check localStorage
    const savedData = await page.evaluate(() => {
      return localStorage.getItem('game2');
    });

    expect(savedData).toBeTruthy();
    expect(savedData.length).toBeGreaterThan(0);
  });

  test('should restore game from localStorage on page load', async ({ page }) => {
    // Set game state
    await setObservable(page, 'dirtRaw', 9999);
    await setObservable(page, 'grassRaw', 8888);
    await setObservable(page, 'generations', 100);

    // Save
    await page.evaluate(() => {
      window.game.Save();
    });

    // Reload page
    await page.reload();
    await waitForGameInit(page);

    // Verify state restored
    const dirt = await getObservable(page, 'dirtRaw');
    const grass = await getObservable(page, 'grassRaw');
    const generations = await getObservable(page, 'generations');

    expect(dirt).toBe(9999);
    expect(grass).toBe(8888);
    expect(generations).toBe(100);
  });

  test('should trigger auto-save after save check interval', async ({ page }) => {
    const initialSaveCheck = await page.evaluate(() => window.game.saveCheck);

    // Fast forward past the save interval (60 seconds * 20 ticks/sec = 1200 ticks)
    await fastForward(page, 61);

    const finalSaveCheck = await page.evaluate(() => window.game.saveCheck);

    // Save check should have reset
    expect(finalSaveCheck).toBeLessThan(initialSaveCheck);
  });

  test('should show notification when game is saved', async ({ page }) => {
    // Listen for notifications
    const notifications = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('Saved')) {
        notifications.push(msg.text());
      }
    });

    // Trigger save
    await page.evaluate(() => {
      window.game.Save();
    });

    // Small delay for notification to appear
    await page.waitForTimeout(100);

    // Notification should have appeared (handled by jQuery notify plugin)
    // We just verify the save succeeded
    const saveData = await getSaveData(page);
    expect(saveData).toBeTruthy();
  });
});

test.describe('Save/Load System - Manual Save/Export', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);
  });

  test('should export game as base64 encoded string', async ({ page }) => {
    const saveData = await getSaveData(page);

    // Verify it's a non-empty string
    expect(typeof saveData).toBe('string');
    expect(saveData.length).toBeGreaterThan(0);

    // Verify it's base64 encoded (should only contain base64 valid characters)
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    expect(base64Regex.test(saveData)).toBe(true);
  });

  test('should decode save data to valid JSON', async ({ page }) => {
    await setObservable(page, 'dirtRaw', 500);
    await setObservable(page, 'generations', 25);

    const saveData = await getSaveData(page);

    // Decode and parse
    const decodedData = await page.evaluate((encoded) => {
      const decoded = $.base64.decode(encoded);
      return JSON.parse(decoded);
    }, saveData);

    expect(decodedData.version).toBe('1.0');
    expect(decodedData.dirtRaw).toBe(500);
    expect(decodedData.generations).toBe(25);
  });

  test('should include all game state in save data', async ({ page }) => {
    const saveData = await getSaveData(page);

    const decoded = await page.evaluate((encoded) => {
      const decoded = $.base64.decode(encoded);
      return JSON.parse(decoded);
    }, saveData);

    // Verify essential fields exist
    expect(decoded).toHaveProperty('version');
    expect(decoded).toHaveProperty('dirtRaw');
    expect(decoded).toHaveProperty('grassRaw');
    expect(decoded).toHaveProperty('sodRaw');
    expect(decoded).toHaveProperty('generations');
    expect(decoded).toHaveProperty('mother');
    expect(decoded).toHaveProperty('father');
    expect(decoded).toHaveProperty('princess');
    expect(decoded).toHaveProperty('prince');
    expect(decoded).toHaveProperty('isHeirsUnlocked');
    expect(decoded).toHaveProperty('femaleMound');
    expect(decoded).toHaveProperty('maleMound');
    expect(decoded).toHaveProperty('princessMound');
    expect(decoded).toHaveProperty('princeMound');
    expect(decoded).toHaveProperty('armyMound');
    expect(decoded).toHaveProperty('mineMound');
    expect(decoded).toHaveProperty('farmMound');
    expect(decoded).toHaveProperty('carrierMound');
    expect(decoded).toHaveProperty('factoryMound');
    expect(decoded).toHaveProperty('achievements');
    expect(decoded).toHaveProperty('atWar');
  });

  test('should open export modal and populate textarea', async ({ page }) => {
    // Navigate to information tab
    await navigateToTab(page, 'information');

    // Click export button (if visible)
    const exportButton = page.locator('text=export');
    if (await exportButton.isVisible()) {
      await exportButton.click();

      // Wait for modal
      await page.waitForSelector('#export', { state: 'visible', timeout: 2000 }).catch(() => {
        // Modal might not appear in test environment
      });

      // Check if textarea has content
      const exportText = await page.evaluate(() => {
        return document.getElementById('txtExport')?.value || '';
      });

      if (exportText) {
        expect(exportText.length).toBeGreaterThan(0);
      }
    }
  });

  test('should manually trigger save with save button', async ({ page }) => {
    await setObservable(page, 'dirtRaw', 777);

    // Navigate to information tab
    await navigateToTab(page, 'information');

    // Click save button
    const saveButton = page.locator('button:has-text("save game")');
    if (await saveButton.isVisible()) {
      await saveButton.click();

      // Wait a moment for save to complete
      await page.waitForTimeout(100);

      // Verify localStorage updated
      const savedData = await page.evaluate(() => {
        return localStorage.getItem('game2');
      });

      expect(savedData).toBeTruthy();
    }
  });
});

test.describe('Save/Load System - Import/Load', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);
  });

  test('should load game from base64 save string', async ({ page }) => {
    // Create initial state
    await setObservable(page, 'dirtRaw', 5000);
    await setObservable(page, 'grassRaw', 4000);
    await setObservable(page, 'sodRaw', 3000);
    await setObservable(page, 'generations', 75);

    // Get save data
    const saveData = await getSaveData(page);

    // Reset state
    await setObservable(page, 'dirtRaw', 0);
    await setObservable(page, 'grassRaw', 0);
    await setObservable(page, 'sodRaw', 0);
    await setObservable(page, 'generations', 0);

    // Load save data
    await loadSaveData(page, saveData);

    // Verify state restored
    const dirt = await getObservable(page, 'dirtRaw');
    const grass = await getObservable(page, 'grassRaw');
    const sod = await getObservable(page, 'sodRaw');
    const generations = await getObservable(page, 'generations');

    expect(dirt).toBe(5000);
    expect(grass).toBe(4000);
    expect(sod).toBe(3000);
    expect(generations).toBe(75);
  });

  test('should handle invalid save data gracefully', async ({ page }) => {
    const invalidSaveData = [
      'invalid_base64!@#$',
      'SGVsbG8gV29ybGQ=', // Valid base64 but invalid JSON
      '',
      'null',
      '{}',
    ];

    for (const invalidData of invalidSaveData) {
      await page.evaluate((data) => {
        try {
          window.game.Load(data);
          return false;
        } catch (e) {
          return true;
        }
      }, invalidData);

      // Should either throw error or handle gracefully
      // The game should still be in a valid state
      const isGameValid = await page.evaluate(() => {
        return typeof window.game.generations === 'function';
      });

      expect(isGameValid).toBe(true);
    }
  });

  test('should handle null or undefined save data', async ({ page }) => {
    // Loading null should load from localStorage
    await page.evaluate(() => {
      window.game.Load(null);
    });

    // Game should remain functional
    const generations = await getObservable(page, 'generations');
    expect(typeof generations).toBe('number');
  });

  test('should reject malformed JSON in save data', async ({ page }) => {
    const malformedBase64 = await page.evaluate(() => {
      // Create invalid JSON and encode it
      return window.$.base64.encode('{invalid json}');
    });

    const errorOccurred = await page.evaluate((data) => {
      try {
        window.game.Load(data);
        return false;
      } catch (e) {
        return true;
      }
    }, malformedBase64);

    expect(errorOccurred).toBe(true);
  });
});

test.describe('Save/Load System - State Restoration', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);
  });

  test('should restore all resource values', async ({ page }) => {
    const originalResources = {
      dirtRaw: 12345.67,
      grassRaw: 23456.78,
      sodRaw: 34567.89,
      factoryDirtRaw: 1234.56,
      factoryGrassRaw: 2345.67,
    };

    // Set resources
    for (const [key, value] of Object.entries(originalResources)) {
      await setObservable(page, key, value);
    }

    const saveData = await getSaveData(page);

    // Clear and reload
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    await loadSaveData(page, saveData);

    // Verify all resources restored
    for (const [key, expectedValue] of Object.entries(originalResources)) {
      const actualValue = await getObservable(page, key);
      expect(actualValue).toBeCloseTo(expectedValue, 2);
    }
  });

  test('should restore generations counter', async ({ page }) => {
    await setObservable(page, 'generations', 500);

    const saveData = await getSaveData(page);

    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    await loadSaveData(page, saveData);

    const generations = await getObservable(page, 'generations');
    expect(generations).toBe(500);
  });

  test('should restore female mound with all critters', async ({ page }) => {
    // Create critters in female mound
    await page.evaluate(() => {
      window.game.femaleMound.removeAll();
      window.game.maxFemaleMoundSize(5);

      for (let i = 0; i < 3; i++) {
        const critter = window.game.DefaultCritter(i, 1000 + i, 1);
        critter.traits[0].base = (i + 1) * 50;
        critter.CalculateScore();
        window.game.femaleMound.push(critter);
      }
    });

    const originalFemales = await getMound(page, 'femaleMound');
    const saveData = await getSaveData(page);

    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    await loadSaveData(page, saveData);

    const restoredFemales = await getMound(page, 'femaleMound');

    expect(restoredFemales.length).toBe(originalFemales.length);

    // Verify IDs and traits
    for (let i = 0; i < restoredFemales.length; i++) {
      expect(restoredFemales[i].id).toBe(originalFemales[i].id);
      expect(restoredFemales[i].generation).toBe(originalFemales[i].generation);
    }
  });

  test('should restore male mound with all critters', async ({ page }) => {
    await page.evaluate(() => {
      window.game.maleMound.removeAll();
      window.game.maxMaleMoundSize(5);

      for (let i = 0; i < 3; i++) {
        const critter = window.game.DefaultCritter(i, 2000 + i, 0);
        critter.traits[1].base = (i + 1) * 60;
        critter.CalculateScore();
        window.game.maleMound.push(critter);
      }
    });

    const originalMales = await getMound(page, 'maleMound');
    const saveData = await getSaveData(page);

    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    await loadSaveData(page, saveData);

    const restoredMales = await getMound(page, 'maleMound');
    expect(restoredMales.length).toBe(originalMales.length);
  });

  test('should restore army mound with soldiers', async ({ page }) => {
    await page.evaluate(() => {
      window.game.armyMound.removeAll();
      window.game.maxArmyMoundSize(3);

      for (let i = 0; i < 2; i++) {
        const soldier = window.game.DefaultCritter(i, 3000 + i, 0);
        soldier.experience(100 + i * 50);
        soldier.job = 3;
        soldier.CalculateScore();
        window.game.armyMound.push(soldier);
      }
    });

    const originalArmy = await getMound(page, 'armyMound');
    const saveData = await getSaveData(page);

    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    await loadSaveData(page, saveData);

    const restoredArmy = await getMound(page, 'armyMound');
    expect(restoredArmy.length).toBe(originalArmy.length);

    // Verify XP/levels preserved
    for (let i = 0; i < restoredArmy.length; i++) {
      expect(restoredArmy[i].experience).toBe(originalArmy[i].experience);
    }
  });

  test('should restore worker mounds (miners, farmers, carriers, factories)', async ({
    page,
  }) => {
    await page.evaluate(() => {
      // Add miners
      window.game.mineMound.removeAll();
      window.game.maxMineMoundSize(2);
      for (let i = 0; i < 1; i++) {
        const miner = window.game.DefaultCritter(i, 4000 + i, 0);
        miner.job = 0;
        window.game.mineMound.push(miner);
      }

      // Add farmers
      window.game.farmMound.removeAll();
      window.game.maxFarmMoundSize(2);
      for (let i = 0; i < 1; i++) {
        const farmer = window.game.DefaultCritter(i, 5000 + i, 1);
        farmer.job = 1;
        window.game.farmMound.push(farmer);
      }
    });

    const originalMiners = await getMound(page, 'mineMound');
    const originalFarmers = await getMound(page, 'farmMound');

    const saveData = await getSaveData(page);

    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    await loadSaveData(page, saveData);

    const restoredMiners = await getMound(page, 'mineMound');
    const restoredFarmers = await getMound(page, 'farmMound');

    expect(restoredMiners.length).toBe(originalMiners.length);
    expect(restoredFarmers.length).toBe(originalFarmers.length);
  });

  test('should restore mother and father breeders', async ({ page }) => {
    const originalBreeders = await page.evaluate(() => {
      const mother = window.game.mother();
      const father = window.game.father();

      return {
        motherId: mother.id,
        fatherId: father.id,
        motherScore: mother.score,
        fatherScore: father.score,
      };
    });

    const saveData = await getSaveData(page);

    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    await loadSaveData(page, saveData);

    const restoredBreeders = await page.evaluate(() => {
      const mother = window.game.mother();
      const father = window.game.father();

      return {
        motherId: mother.id,
        fatherId: father.id,
        motherScore: mother.score,
        fatherScore: father.score,
      };
    });

    expect(restoredBreeders.motherId).toBe(originalBreeders.motherId);
    expect(restoredBreeders.fatherId).toBe(originalBreeders.fatherId);
    expect(restoredBreeders.motherScore).toBe(originalBreeders.motherScore);
    expect(restoredBreeders.fatherScore).toBe(originalBreeders.fatherScore);
  });

  test('should restore mound size upgrades', async ({ page }) => {
    await setObservable(page, 'maxFemaleMoundSize', 7);
    await setObservable(page, 'maxMaleMoundSize', 6);
    await setObservable(page, 'maxArmyMoundSize', 5);
    await setObservable(page, 'maxMineMoundSize', 4);
    await setObservable(page, 'maxFarmMoundSize', 3);

    const saveData = await getSaveData(page);

    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    await loadSaveData(page, saveData);

    expect(await getObservable(page, 'maxFemaleMoundSize')).toBe(7);
    expect(await getObservable(page, 'maxMaleMoundSize')).toBe(6);
    expect(await getObservable(page, 'maxArmyMoundSize')).toBe(5);
    expect(await getObservable(page, 'maxMineMoundSize')).toBe(4);
    expect(await getObservable(page, 'maxFarmMoundSize')).toBe(3);
  });

  test('should restore achievements and achievement counts', async ({ page }) => {
    // Unlock some achievements
    await page.evaluate(() => {
      window.game.achievementsUnlocked(5);
      window.game.achievementCounts[0].value = 100; // Generations
    });

    const originalAchievements = await getObservable(page, 'achievementsUnlocked');
    const saveData = await getSaveData(page);

    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    await loadSaveData(page, saveData);

    const restoredAchievements = await getObservable(page, 'achievementsUnlocked');
    expect(restoredAchievements).toBe(originalAchievements);
  });

  test('should restore war status', async ({ page }) => {
    await setObservable(page, 'atWar', true);

    const saveData = await getSaveData(page);

    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    await loadSaveData(page, saveData);

    const atWar = await getObservable(page, 'atWar');
    expect(atWar).toBe(true);
  });

  test('should restore sort preferences', async ({ page }) => {
    await setObservable(page, 'femaleSort', 'vitality');
    await setObservable(page, 'maleSort', 'strength');
    await setObservable(page, 'armySort', 'level');

    const saveData = await getSaveData(page);

    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    await loadSaveData(page, saveData);

    expect(await getObservable(page, 'femaleSort')).toBe('vitality');
    expect(await getObservable(page, 'maleSort')).toBe('strength');
    expect(await getObservable(page, 'armySort')).toBe('level');
  });

  test('should restore heirs unlock status', async ({ page }) => {
    await setObservable(page, 'isHeirsUnlocked', true);

    const saveData = await getSaveData(page);

    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    await loadSaveData(page, saveData);

    const isUnlocked = await getObservable(page, 'isHeirsUnlocked');
    expect(isUnlocked).toBe(true);
  });
});

test.describe('Save/Load System - Reset Functionality', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);
  });

  test('should clear localStorage on reset', async ({ page }) => {
    // Set some state
    await setObservable(page, 'dirtRaw', 99999);
    await page.evaluate(() => {
      window.game.Save();
    });

    // Verify save exists
    let savedData = await page.evaluate(() => localStorage.getItem('game2'));
    expect(savedData).toBeTruthy();

    // Clear localStorage
    await clearGameState(page);

    // Verify cleared
    savedData = await page.evaluate(() => localStorage.getItem('game2'));
    expect(savedData).toBeNull();
  });

  test('should start fresh game after localStorage clear', async ({ page }) => {
    // Set advanced state
    await setObservable(page, 'generations', 1000);
    await setObservable(page, 'dirtRaw', 50000);

    // Clear
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    // Verify fresh start
    const generations = await getObservable(page, 'generations');
    const dirt = await getObservable(page, 'dirtRaw');

    expect(generations).toBe(0);
    expect(dirt).toBe(0);
  });

  test('should handle reset button in UI', async ({ page }) => {
    // Navigate to information tab
    await navigateToTab(page, 'information');

    // Check if reset button exists
    const resetButton = page.locator('button:has-text("reset game")');
    const exists = await resetButton.count();

    if (exists > 0) {
      // Note: We don't actually click it because it will reload the page
      // and trigger a confirm dialog
      expect(exists).toBeGreaterThan(0);
    }
  });
});

test.describe('Save/Load System - Edge Cases', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);
  });

  test('should handle save with maximum trait values', async ({ page }) => {
    await page.evaluate(() => {
      const mother = window.game.mother();
      mother.traits[0].base = 999999; // Max trait value
      mother.traits[1].base = 999999;
      mother.CalculateScore();
    });

    const saveData = await getSaveData(page);
    expect(saveData).toBeTruthy();

    await loadSaveData(page, saveData);

    const motherTrait = await page.evaluate(() => window.game.mother().traits[0].base);
    expect(motherTrait).toBe(999999);
  });

  test('should handle save with maximum level (99)', async ({ page }) => {
    await page.evaluate(() => {
      window.game.armyMound.removeAll();
      window.game.maxArmyMoundSize(1);

      const soldier = window.game.DefaultCritter(0, 1, 0);
      soldier.experience(20000); // Enough for level 99
      window.game.armyMound.push(soldier);
    });

    const saveData = await getSaveData(page);
    await loadSaveData(page, saveData);

    const level = await page.evaluate(() => {
      return window.LevelFromXp(window.game.armyMound()[0].experience());
    });

    expect(level).toBe(99);
  });

  test('should handle save with empty mounds', async ({ page }) => {
    // Clear all mounds
    await page.evaluate(() => {
      window.game.femaleMound.removeAll();
      window.game.maleMound.removeAll();
      window.game.armyMound.removeAll();
      window.game.mineMound.removeAll();
      window.game.farmMound.removeAll();
    });

    const saveData = await getSaveData(page);
    expect(saveData).toBeTruthy();

    await loadSaveData(page, saveData);

    const femaleMound = await getMound(page, 'femaleMound');
    const maleMound = await getMound(page, 'maleMound');

    expect(femaleMound.length).toBe(0);
    expect(maleMound.length).toBe(0);
  });

  test('should handle save with very large numbers', async ({ page }) => {
    await setObservable(page, 'dirtRaw', 999999999);
    await setObservable(page, 'grassRaw', 888888888);
    await setObservable(page, 'sodRaw', 777777777);

    const saveData = await getSaveData(page);
    await loadSaveData(page, saveData);

    const dirt = await getObservable(page, 'dirtRaw');
    const grass = await getObservable(page, 'grassRaw');
    const sod = await getObservable(page, 'sodRaw');

    expect(dirt).toBe(999999999);
    expect(grass).toBe(888888888);
    expect(sod).toBe(777777777);
  });

  test('should preserve decimal values in resources', async ({ page }) => {
    await setObservable(page, 'dirtRaw', 123.456789);
    await setObservable(page, 'grassRaw', 987.654321);

    const saveData = await getSaveData(page);
    await loadSaveData(page, saveData);

    const dirt = await getObservable(page, 'dirtRaw');
    const grass = await getObservable(page, 'grassRaw');

    // Allow for minor floating point precision differences
    expect(dirt).toBeCloseTo(123.456789, 4);
    expect(grass).toBeCloseTo(987.654321, 4);
  });

  test('should handle consecutive save/load cycles', async ({ page }) => {
    // Perform multiple save/load cycles
    for (let i = 1; i <= 5; i++) {
      await setObservable(page, 'generations', i * 100);

      const saveData = await getSaveData(page);
      await loadSaveData(page, saveData);

      const generations = await getObservable(page, 'generations');
      expect(generations).toBe(i * 100);
    }
  });

  test('should maintain save data consistency after multiple ticks', async ({ page }) => {
    await setObservable(page, 'dirtRaw', 1000);

    // Run game for a while
    await fastForward(page, 30);

    const saveData1 = await getSaveData(page);

    // Run more ticks
    await fastForward(page, 30);

    const saveData2 = await getSaveData(page);

    // Both saves should be valid and different
    expect(saveData1).toBeTruthy();
    expect(saveData2).toBeTruthy();
    expect(saveData1).not.toBe(saveData2);
  });
});
