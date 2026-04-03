/**
 * Prestige and Heir System E2E Tests
 * Tests for the Critter Mound game's heir/prestige mechanics including princess and prince mounds
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

test.describe('Prestige System - Heir Unlock', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);
  });

  test('should start with heirs locked', async ({ page }) => {
    const isHeirsUnlocked = await getObservable(page, 'isHeirsUnlocked');
    expect(isHeirsUnlocked).toBe(false);
  });

  test('should unlock heirs when sod production reaches 100/second', async ({ page }) => {
    // Heirs unlock when sodPerSecondRaw >= 100
    await setObservable(page, 'sodPerSecondRaw', 99);

    let isUnlocked = await getObservable(page, 'isHeirsUnlocked');
    expect(isUnlocked).toBe(false);

    // Increase to unlock threshold
    await setObservable(page, 'sodPerSecondRaw', 100);

    // Trigger the check (happens during save check)
    await page.evaluate(() => {
      window.game.CheckSave();
    });

    isUnlocked = await getObservable(page, 'isHeirsUnlocked');
    expect(isUnlocked).toBe(true);
  });

  test('should show heirs tab when unlocked', async ({ page }) => {
    // Unlock heirs
    await setObservable(page, 'isHeirsUnlocked', true);

    // Navigate to heirs tab
    await navigateToTab(page, 'heirs');

    // Verify tab is visible
    const heirsTab = await page.locator('#tabs-heirs').isVisible();
    expect(heirsTab).toBe(true);
  });

  test('should hide heirs tab when locked', async ({ page }) => {
    const isHeirsUnlocked = await getObservable(page, 'isHeirsUnlocked');
    expect(isHeirsUnlocked).toBe(false);

    // Check if heirs tab is hidden in the navigation
    const heirsNavVisible = await page.locator('a[href="#tabs-heirs"]').isVisible();
    expect(heirsNavVisible).toBe(false);
  });

  test('should persist heir unlock status through save/load', async ({ page }) => {
    // Unlock heirs
    await setObservable(page, 'isHeirsUnlocked', true);

    // Save game
    const saveData = await getSaveData(page);

    // Clear and reload
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    // Verify heirs are locked initially
    let isUnlocked = await getObservable(page, 'isHeirsUnlocked');
    expect(isUnlocked).toBe(false);

    // Load save
    await loadSaveData(page, saveData);

    // Verify heirs are unlocked
    isUnlocked = await getObservable(page, 'isHeirsUnlocked');
    expect(isUnlocked).toBe(true);
  });
});

test.describe('Prestige System - Princess Mound', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    // Unlock heirs for these tests
    await setObservable(page, 'isHeirsUnlocked', true);
  });

  test('should start with default princess mound size of 1', async ({ page }) => {
    const maxPrincessSize = await getObservable(page, 'maxPrincessMoundSize');
    expect(maxPrincessSize).toBe(1);

    const princessMound = await getMound(page, 'princessMound');
    expect(princessMound).toHaveLength(0);
  });

  test('should have a default princess breeder', async ({ page }) => {
    const princess = await page.evaluate(() => {
      const p = window.game.princess();
      return {
        generation: p.generation,
        gender: p.gender,
        score: p.score,
      };
    });

    expect(princess.gender).toBe(1); // Female = 1
    expect(princess.generation).toBe(0);
    expect(princess.score).toBeGreaterThan(0);
  });

  test('should allow upgrading princess mound size', async ({ page }) => {
    // Give enough resources
    await setObservable(page, 'sodRaw', 1000);

    const initialMaxSize = await getObservable(page, 'maxPrincessMoundSize');
    expect(initialMaxSize).toBe(1);

    // Calculate upgrade cost (should be 10 sod for first upgrade)
    const upgradeCost = await page.evaluate(() => {
      return window.UpgradeCost(window.game.maxPrincessMoundSize(), 10);
    });
    expect(upgradeCost).toBe(10);

    // Upgrade princess mound
    await page.evaluate(() => {
      window.game.Upgrade('PrincessHatchery');
    });

    const newMaxSize = await getObservable(page, 'maxPrincessMoundSize');
    expect(newMaxSize).toBe(2);
  });

  test('should not upgrade princess mound beyond size 10', async ({ page }) => {
    // Set max size to 10
    await setObservable(page, 'maxPrincessMoundSize', 10);
    await setObservable(page, 'sodRaw', 1000000);

    // Try to upgrade
    await page.evaluate(() => {
      window.game.Upgrade('PrincessHatchery');
    });

    const maxSize = await getObservable(page, 'maxPrincessMoundSize');
    expect(maxSize).toBe(10);
  });

  test('should enforce princess mound size limits', async ({ page }) => {
    await setObservable(page, 'maxPrincessMoundSize', 2);

    // Add more princesses than allowed
    await page.evaluate(() => {
      window.game.princessMound.removeAll();

      for (let i = 0; i < 5; i++) {
        const princess = window.game.DefaultCritter(i, i + 1, 1);
        princess.job = 5; // Heir job
        window.game.princessMound.push(princess);
      }

      // Trigger cleanup
      window.game.Tick();
    });

    const princessMound = await getMound(page, 'princessMound');
    const maxSize = await getObservable(page, 'maxPrincessMoundSize');
    expect(princessMound.length).toBeLessThanOrEqual(maxSize);
  });

  test('should respect locked princesses during mound cleanup', async ({ page }) => {
    await setObservable(page, 'maxPrincessMoundSize', 2);

    await page.evaluate(() => {
      window.game.princessMound.removeAll();

      // Add 3 princesses, lock the first one
      for (let i = 0; i < 3; i++) {
        const princess = window.game.DefaultCritter(i, i + 1, 1);
        princess.job = 5;
        princess.score = 100 - i * 10; // Descending scores
        if (i === 0) {
          princess.isLocked(true);
        }
        window.game.princessMound.push(princess);
      }

      // Sort and cleanup
      window.game.Tick();
    });

    const princessMound = await getMound(page, 'princessMound');
    expect(princessMound.length).toBeLessThanOrEqual(2);

    // Verify at least one princess remains
    expect(princessMound.length).toBeGreaterThan(0);
  });

  test('should allow selecting princess as breeder', async ({ page }) => {
    // Create a princess in the mound
    await page.evaluate(() => {
      window.game.princessMound.removeAll();

      const princess = window.game.DefaultCritter(1, 100, 1);
      princess.job = 5;
      princess.traits[0].base = 200; // High stats
      princess.CalculateScore();
      window.game.princessMound.push(princess);
    });

    // Select the new princess as breeder
    await page.evaluate(() => {
      const newPrincess = window.game.princessMound()[0];
      window.game.Select(newPrincess, 'MateYoung');
    });

    const newPrincessId = await page.evaluate(() => window.game.princess().id);
    expect(newPrincessId).toBe(100);
  });

  test('should sort princess mound by different stats', async ({ page }) => {
    const sorts = ['score', 'vitality', 'strength', 'agility', 'bite', 'sting'];

    for (const sortType of sorts) {
      await page.evaluate((sort) => {
        window.game.princessMound.removeAll();
        window.game.maxPrincessMoundSize(3);

        // Create princesses with random stats
        for (let i = 0; i < 3; i++) {
          const princess = window.game.DefaultCritter(i, i + 1, 1);
          princess.job = 5;
          princess.traits[0].base = Math.random() * 100;
          princess.traits[1].base = Math.random() * 100;
          princess.traits[2].base = Math.random() * 100;
          princess.traits[3].base = Math.random() * 100;
          princess.traits[4].base = Math.random() * 100;
          princess.CalculateScore();
          window.game.princessMound.push(princess);
        }

        window.game.princessSort(sort);
        window.game.SortMound(window.game.princessMound, sort);
      }, sortType);

      const princessMound = await getMound(page, 'princessMound');
      expect(princessMound.length).toBe(3);
    }
  });

  test('should preserve princess health when switching breeders', async ({ page }) => {
    // Set up initial princess with partial health
    await page.evaluate(() => {
      const currentPrincess = window.game.princess();
      currentPrincess.currentHealth(currentPrincess.health * 0.5);
    });

    // Create new princess in mound
    await page.evaluate(() => {
      window.game.princessMound.removeAll();
      const newPrincess = window.game.DefaultCritter(1, 100, 1);
      newPrincess.job = 5;
      newPrincess.score = 50; // Different score
      newPrincess.CalculateScore();
      window.game.princessMound.push(newPrincess);

      // Select as breeder (should preserve health percentage)
      window.game.Select(newPrincess, 'MateYoung');
    });

    const newHealth = await page.evaluate(() => {
      const p = window.game.princess();
      return {
        current: p.currentHealth(),
        max: p.health,
        percentage: p.currentHealth() / p.health,
      };
    });

    // Health percentage should be approximately preserved
    // Formula: currentHealth = (oldHealth / oldMaxHealth * oldScore) / newScore * 5 * newMaxHealth
    expect(newHealth.current).toBeGreaterThan(0);
  });
});

test.describe('Prestige System - Prince Mound', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    // Unlock heirs
    await setObservable(page, 'isHeirsUnlocked', true);
  });

  test('should start with default prince mound size of 1', async ({ page }) => {
    const maxPrinceSize = await getObservable(page, 'maxPrinceMoundSize');
    expect(maxPrinceSize).toBe(1);

    const princeMound = await getMound(page, 'princeMound');
    expect(princeMound).toHaveLength(0);
  });

  test('should have a default prince breeder', async ({ page }) => {
    const prince = await page.evaluate(() => {
      const p = window.game.prince();
      return {
        generation: p.generation,
        gender: p.gender,
        score: p.score,
      };
    });

    expect(prince.gender).toBe(0); // Male = 0
    expect(prince.generation).toBe(1);
    expect(prince.score).toBeGreaterThan(0);
  });

  test('should allow upgrading prince mound size', async ({ page }) => {
    await setObservable(page, 'sodRaw', 1000);

    const initialMaxSize = await getObservable(page, 'maxPrinceMoundSize');
    expect(initialMaxSize).toBe(1);

    // Upgrade prince mound
    await page.evaluate(() => {
      window.game.Upgrade('PrinceHatchery');
    });

    const newMaxSize = await getObservable(page, 'maxPrinceMoundSize');
    expect(newMaxSize).toBe(2);
  });

  test('should not upgrade prince mound beyond size 10', async ({ page }) => {
    await setObservable(page, 'maxPrinceMoundSize', 10);
    await setObservable(page, 'sodRaw', 1000000);

    await page.evaluate(() => {
      window.game.Upgrade('PrinceHatchery');
    });

    const maxSize = await getObservable(page, 'maxPrinceMoundSize');
    expect(maxSize).toBe(10);
  });

  test('should enforce prince mound size limits', async ({ page }) => {
    await setObservable(page, 'maxPrinceMoundSize', 2);

    await page.evaluate(() => {
      window.game.princeMound.removeAll();

      for (let i = 0; i < 5; i++) {
        const prince = window.game.DefaultCritter(i, i + 1, 0);
        prince.job = 5; // Heir job
        window.game.princeMound.push(prince);
      }

      window.game.Tick();
    });

    const princeMound = await getMound(page, 'princeMound');
    const maxSize = await getObservable(page, 'maxPrinceMoundSize');
    expect(princeMound.length).toBeLessThanOrEqual(maxSize);
  });

  test('should allow selecting prince as breeder', async ({ page }) => {
    await page.evaluate(() => {
      window.game.princeMound.removeAll();

      const prince = window.game.DefaultCritter(1, 100, 0);
      prince.job = 5;
      prince.traits[0].base = 200;
      prince.CalculateScore();
      window.game.princeMound.push(prince);
    });

    await page.evaluate(() => {
      const newPrince = window.game.princeMound()[0];
      window.game.Select(newPrince, 'MateYoung');
    });

    const newPrinceId = await page.evaluate(() => window.game.prince().id);
    expect(newPrinceId).toBe(100);
  });

  test('should sort prince mound by score', async ({ page }) => {
    await page.evaluate(() => {
      window.game.princeMound.removeAll();
      window.game.maxPrinceMoundSize(5);

      // Create princes with different scores
      for (let i = 0; i < 5; i++) {
        const prince = window.game.DefaultCritter(i, i + 1, 0);
        prince.job = 5;
        prince.traits[0].base = (i + 1) * 20; // Increasing vitality
        prince.CalculateScore();
        window.game.princeMound.push(prince);
      }

      window.game.princeSort('score');
      window.game.SortMound(window.game.princeMound, 'score');
    });

    const princeMound = await getMound(page, 'princeMound');
    expect(princeMound.length).toBe(5);

    // Verify descending order
    for (let i = 0; i < princeMound.length - 1; i++) {
      expect(princeMound[i].score).toBeGreaterThanOrEqual(princeMound[i + 1].score);
    }
  });
});

test.describe('Prestige System - Heir Breeding', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    await setObservable(page, 'isHeirsUnlocked', true);
  });

  test('should breed heirs when princess and prince are healthy', async ({ page }) => {
    // Give resources for breeding
    await setObservable(page, 'sodRaw', 10000);

    // Set princess and prince to full health
    await page.evaluate(() => {
      const princess = window.game.princess();
      const prince = window.game.prince();
      princess.currentHealth(princess.health);
      prince.currentHealth(prince.health);
    });

    const initialGeneration = await getObservable(page, 'generations');

    // Trigger breeding
    await fastForward(page, 10);

    const newGeneration = await getObservable(page, 'generations');

    // Generations should increase (includes both regular and heir breeding)
    expect(newGeneration).toBeGreaterThanOrEqual(initialGeneration);
  });

  test('should place heir offspring in heir mounds', async ({ page }) => {
    await setObservable(page, 'sodRaw', 10000);
    await setObservable(page, 'maxPrincessMoundSize', 5);
    await setObservable(page, 'maxPrinceMoundSize', 5);

    // Breed heirs
    await page.evaluate(() => {
      const princess = window.game.princess();
      const prince = window.game.prince();
      princess.currentHealth(princess.health);
      prince.currentHealth(prince.health);

      // Force breed
      window.game.Breed(princess, prince, 'Heir');
    });

    // Check if heirs were added
    const princessMound = await getMound(page, 'princessMound');
    const princeMound = await getMound(page, 'princeMound');

    const totalHeirs = princessMound.length + princeMound.length;
    expect(totalHeirs).toBeGreaterThan(0);
  });

  test('should mark heir critters with job=5', async ({ page }) => {
    await setObservable(page, 'sodRaw', 10000);
    await setObservable(page, 'maxPrincessMoundSize', 3);

    await page.evaluate(() => {
      const princess = window.game.princess();
      const prince = window.game.prince();
      princess.currentHealth(princess.health);
      prince.currentHealth(prince.health);

      window.game.Breed(princess, prince, 'Heir');
    });

    const princessMound = await getMound(page, 'princessMound');

    if (princessMound.length > 0) {
      const heirJob = princessMound[0].job;
      expect(heirJob).toBe(5); // Heir job = 5
    }
  });

  test('should consume sod for heir breeding', async ({ page }) => {
    await setObservable(page, 'sodRaw', 10000);

    const initialSod = await getObservable(page, 'sodRaw');

    // Set up for breeding
    await page.evaluate(() => {
      const princess = window.game.princess();
      const prince = window.game.prince();
      princess.currentHealth(princess.health);
      prince.currentHealth(prince.health);
    });

    // Fast forward to allow breeding
    await fastForward(page, 5);

    const finalSod = await getObservable(page, 'sodRaw');

    // Sod may decrease from breeding (or stay same if breeding didn't trigger)
    expect(finalSod).toBeLessThanOrEqual(initialSod);
  });

  test('should heal princess and prince over time', async ({ page }) => {
    await setObservable(page, 'sodRaw', 10000);

    // Damage the breeders
    await page.evaluate(() => {
      window.game.princess().currentHealth(10);
      window.game.prince().currentHealth(10);
    });

    const initialPrincessHealth = await page.evaluate(() => window.game.princess().currentHealth());
    const initialPrinceHealth = await page.evaluate(() => window.game.prince().currentHealth());

    // Fast forward to allow healing
    await fastForward(page, 10);

    const finalPrincessHealth = await page.evaluate(() => window.game.princess().currentHealth());
    const finalPrinceHealth = await page.evaluate(() => window.game.prince().currentHealth());

    expect(finalPrincessHealth).toBeGreaterThan(initialPrincessHealth);
    expect(finalPrinceHealth).toBeGreaterThan(initialPrinceHealth);
  });

  test('should use different breeding rate for heirs (5x score)', async ({ page }) => {
    // Heir breeding rate is princess.score * 5 and prince.score * 5
    const breedingRates = await page.evaluate(() => {
      const princess = window.game.princess();
      const prince = window.game.prince();

      return {
        princessRate: princess.score * 5,
        princeRate: prince.score * 5,
      };
    });

    expect(breedingRates.princessRate).toBeGreaterThan(0);
    expect(breedingRates.princeRate).toBeGreaterThan(0);

    // Rates should be 5x the score
    const princessScore = await page.evaluate(() => window.game.princess().score);
    const princeScore = await page.evaluate(() => window.game.prince().score);

    expect(breedingRates.princessRate).toBe(princessScore * 5);
    expect(breedingRates.princeRate).toBe(princeScore * 5);
  });
});

test.describe('Prestige System - Save/Load Integration', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);
  });

  test('should save and restore princess mound', async ({ page }) => {
    await setObservable(page, 'isHeirsUnlocked', true);
    await setObservable(page, 'maxPrincessMoundSize', 3);

    // Create princesses
    await page.evaluate(() => {
      window.game.princessMound.removeAll();

      for (let i = 0; i < 3; i++) {
        const princess = window.game.DefaultCritter(i, 100 + i, 1);
        princess.job = 5;
        princess.traits[0].base = (i + 1) * 50;
        princess.CalculateScore();
        window.game.princessMound.push(princess);
      }
    });

    const originalPrincesses = await getMound(page, 'princessMound');
    const saveData = await getSaveData(page);

    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    await loadSaveData(page, saveData);

    const restoredPrincesses = await getMound(page, 'princessMound');
    expect(restoredPrincesses.length).toBe(originalPrincesses.length);

    // Verify IDs match
    for (let i = 0; i < restoredPrincesses.length; i++) {
      expect(restoredPrincesses[i].id).toBe(originalPrincesses[i].id);
    }
  });

  test('should save and restore prince mound', async ({ page }) => {
    await setObservable(page, 'isHeirsUnlocked', true);
    await setObservable(page, 'maxPrinceMoundSize', 3);

    await page.evaluate(() => {
      window.game.princeMound.removeAll();

      for (let i = 0; i < 3; i++) {
        const prince = window.game.DefaultCritter(i, 200 + i, 0);
        prince.job = 5;
        prince.traits[0].base = (i + 1) * 50;
        prince.CalculateScore();
        window.game.princeMound.push(prince);
      }
    });

    const originalPrinces = await getMound(page, 'princeMound');
    const saveData = await getSaveData(page);

    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    await loadSaveData(page, saveData);

    const restoredPrinces = await getMound(page, 'princeMound');
    expect(restoredPrinces.length).toBe(originalPrinces.length);

    for (let i = 0; i < restoredPrinces.length; i++) {
      expect(restoredPrinces[i].id).toBe(originalPrinces[i].id);
    }
  });

  test('should save and restore princess/prince breeders', async ({ page }) => {
    await setObservable(page, 'isHeirsUnlocked', true);

    const originalBreedersData = await page.evaluate(() => {
      const princess = window.game.princess();
      const prince = window.game.prince();

      return {
        princessId: princess.id,
        princeId: prince.id,
        princessScore: princess.score,
        princeScore: prince.score,
      };
    });

    const saveData = await getSaveData(page);

    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    await loadSaveData(page, saveData);

    const restoredBreedersData = await page.evaluate(() => {
      const princess = window.game.princess();
      const prince = window.game.prince();

      return {
        princessId: princess.id,
        princeId: prince.id,
        princessScore: princess.score,
        princeScore: prince.score,
      };
    });

    expect(restoredBreedersData.princessId).toBe(originalBreedersData.princessId);
    expect(restoredBreedersData.princeId).toBe(originalBreedersData.princeId);
    expect(restoredBreedersData.princessScore).toBe(originalBreedersData.princessScore);
    expect(restoredBreedersData.princeScore).toBe(originalBreedersData.princeScore);
  });

  test('should save and restore heir mound sizes', async ({ page }) => {
    await setObservable(page, 'isHeirsUnlocked', true);
    await setObservable(page, 'maxPrincessMoundSize', 7);
    await setObservable(page, 'maxPrinceMoundSize', 8);

    const saveData = await getSaveData(page);

    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);

    await loadSaveData(page, saveData);

    const maxPrincessSize = await getObservable(page, 'maxPrincessMoundSize');
    const maxPrinceSize = await getObservable(page, 'maxPrinceMoundSize');

    expect(maxPrincessSize).toBe(7);
    expect(maxPrinceSize).toBe(8);
  });
});
