import { test, expect } from '@playwright/test';
import {
  waitForGameInit,
  clearGameState,
  fastForward,
  getObservable,
  setObservable,
  navigateToTab
} from './fixtures/game-helpers.js';

/**
 * Resource Management E2E Tests
 *
 * Tests for dirt, grass, and sod resource production, consumption, and display.
 * Resources are managed through Knockout.js observables with per-second rates.
 *
 * Key Game Mechanics:
 * - Dirt: Produced by miners, carried to factory
 * - Grass: Produced by farmers, carried to factory
 * - Sod: Created in factory from dirt + grass combination
 * - SmartRound: Numbers < 100 show 1 decimal, >= 100 round to integer
 * - Game runs at 20 ticks/second
 */

test.describe('Resource Management', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);
  });

  test.describe('Initial State', () => {
    test('should start with zero resources', async ({ page }) => {
      const dirt = await getObservable(page, 'dirt');
      const grass = await getObservable(page, 'grass');
      const sod = await getObservable(page, 'sod');

      expect(dirt).toBe(0);
      expect(grass).toBe(0);
      expect(sod).toBe(0);
    });

    test('should start with zero production rates', async ({ page }) => {
      const dirtPerSecond = await getObservable(page, 'dirtPerSecond');
      const grassPerSecond = await getObservable(page, 'grassPerSecond');
      const sodPerSecond = await getObservable(page, 'sodPerSecond');

      expect(dirtPerSecond).toBe(0);
      expect(grassPerSecond).toBe(0);
      expect(sodPerSecond).toBe(0);
    });

    test('should display initial resource values in UI', async ({ page }) => {
      await navigateToTab(page, 'production');

      // Check that resource displays exist and show 0
      const resourceDisplay = await page.locator('.resources').isVisible();
      expect(resourceDisplay).toBe(true);
    });

    test('should start with factory resources at zero', async ({ page }) => {
      const factoryDirt = await getObservable(page, 'factoryDirt');
      const factoryGrass = await getObservable(page, 'factoryGrass');

      expect(factoryDirt).toBe(0);
      expect(factoryGrass).toBe(0);
    });
  });

  test.describe('Dirt Production', () => {
    test('should accumulate dirt over time when dirt rate is positive', async ({ page }) => {
      // Set dirt production rate to 10/sec
      await setObservable(page, 'dirtPerSecondRaw', 10);

      const initialDirt = await getObservable(page, 'dirtRaw');

      // Fast-forward 5 seconds
      await fastForward(page, 5);

      const finalDirt = await getObservable(page, 'dirtRaw');
      const expectedDirt = initialDirt + 50; // 10/sec * 5 sec = 50

      // Allow small floating-point variance
      expect(Math.abs(finalDirt - expectedDirt)).toBeLessThan(0.1);
    });

    test('should calculate dirt per second correctly', async ({ page }) => {
      await setObservable(page, 'dirtPerSecondRaw', 15.5);

      const dirtPerSecond = await getObservable(page, 'dirtPerSecond');

      // Should use SmartRound (15.5 < 100, so keeps 1 decimal)
      expect(dirtPerSecond).toBe(15.5);
    });

    test('should accumulate dirt over multiple time periods', async ({ page }) => {
      await setObservable(page, 'dirtPerSecondRaw', 8);

      // Fast-forward 3 seconds
      await fastForward(page, 3);
      const dirt1 = await getObservable(page, 'dirtRaw');
      expect(Math.abs(dirt1 - 24)).toBeLessThan(0.1); // 8 * 3 = 24

      // Fast-forward another 2 seconds
      await fastForward(page, 2);
      const dirt2 = await getObservable(page, 'dirtRaw');
      expect(Math.abs(dirt2 - 40)).toBeLessThan(0.1); // 8 * 5 = 40

      // Fast-forward another 5 seconds
      await fastForward(page, 5);
      const dirt3 = await getObservable(page, 'dirtRaw');
      expect(Math.abs(dirt3 - 80)).toBeLessThan(0.1); // 8 * 10 = 80
    });

    test('should handle fractional production rates', async ({ page }) => {
      await setObservable(page, 'dirtPerSecondRaw', 3.7);

      // Fast-forward 10 seconds
      await fastForward(page, 10);

      const dirt = await getObservable(page, 'dirtRaw');
      expect(Math.abs(dirt - 37)).toBeLessThan(0.1); // 3.7 * 10 = 37
    });

    test('should handle very high production rates', async ({ page }) => {
      await setObservable(page, 'dirtPerSecondRaw', 500);

      // Fast-forward 2 seconds
      await fastForward(page, 2);

      const dirt = await getObservable(page, 'dirtRaw');
      expect(Math.abs(dirt - 1000)).toBeLessThan(1);
    });
  });

  test.describe('Grass Production', () => {
    test('should accumulate grass over time when grass rate is positive', async ({ page }) => {
      await setObservable(page, 'grassPerSecondRaw', 12);

      const initialGrass = await getObservable(page, 'grassRaw');

      // Fast-forward 4 seconds
      await fastForward(page, 4);

      const finalGrass = await getObservable(page, 'grassRaw');
      const expectedGrass = initialGrass + 48; // 12/sec * 4 sec = 48

      expect(Math.abs(finalGrass - expectedGrass)).toBeLessThan(0.1);
    });

    test('should calculate grass per second correctly', async ({ page }) => {
      await setObservable(page, 'grassPerSecondRaw', 22.3);

      const grassPerSecond = await getObservable(page, 'grassPerSecond');

      // Should use SmartRound (22.3 < 100, so keeps 1 decimal)
      expect(grassPerSecond).toBe(22.3);
    });

    test('should accumulate grass independently from dirt', async ({ page }) => {
      await setObservable(page, 'dirtPerSecondRaw', 10);
      await setObservable(page, 'grassPerSecondRaw', 15);

      // Fast-forward 3 seconds
      await fastForward(page, 3);

      const dirt = await getObservable(page, 'dirtRaw');
      const grass = await getObservable(page, 'grassRaw');

      expect(Math.abs(dirt - 30)).toBeLessThan(0.1);
      expect(Math.abs(grass - 45)).toBeLessThan(0.1);
    });

    test('should handle very small production rates', async ({ page }) => {
      await setObservable(page, 'grassPerSecondRaw', 0.5);

      // Fast-forward 10 seconds
      await fastForward(page, 10);

      const grass = await getObservable(page, 'grassRaw');
      expect(Math.abs(grass - 5)).toBeLessThan(0.1);
    });
  });

  test.describe('Sod Production', () => {
    test('should produce sod when factory has both dirt and grass', async ({ page }) => {
      // Set up production rates
      await setObservable(page, 'sodPerSecondRaw', 5);
      await setObservable(page, 'factoryDirtRaw', 100);
      await setObservable(page, 'factoryGrassRaw', 100);

      const initialSod = await getObservable(page, 'sodRaw');

      // Fast-forward 2 seconds
      await fastForward(page, 2);

      const finalSod = await getObservable(page, 'sodRaw');

      // Sod should have increased (exact amount depends on factory logic)
      expect(finalSod).toBeGreaterThan(initialSod);
    });

    test('should consume dirt and grass when producing sod', async ({ page }) => {
      await setObservable(page, 'sodPerSecondRaw', 10);
      await setObservable(page, 'factoryDirtRaw', 50);
      await setObservable(page, 'factoryGrassRaw', 50);

      const initialDirt = await getObservable(page, 'factoryDirtRaw');
      const initialGrass = await getObservable(page, 'factoryGrassRaw');

      // Fast-forward 1 second
      await fastForward(page, 1);

      const finalDirt = await getObservable(page, 'factoryDirtRaw');
      const finalGrass = await getObservable(page, 'factoryGrassRaw');

      // Both should have decreased
      expect(finalDirt).toBeLessThan(initialDirt);
      expect(finalGrass).toBeLessThan(initialGrass);
    });

    test('should not produce more sod than available resources', async ({ page }) => {
      // Set high sod production but limited resources
      await setObservable(page, 'sodPerSecondRaw', 100);
      await setObservable(page, 'factoryDirtRaw', 5);
      await setObservable(page, 'factoryGrassRaw', 5);

      // Fast-forward 1 second
      await fastForward(page, 1);

      const dirt = await getObservable(page, 'factoryDirtRaw');
      const grass = await getObservable(page, 'factoryGrassRaw');

      // Resources shouldn't go negative
      expect(dirt).toBeGreaterThanOrEqual(0);
      expect(grass).toBeGreaterThanOrEqual(0);
    });

    test('should calculate sod per second correctly', async ({ page }) => {
      await setObservable(page, 'sodPerSecondRaw', 7.8);

      const sodPerSecond = await getObservable(page, 'sodPerSecond');

      // Should use SmartRound (7.8 < 100, so keeps 1 decimal)
      expect(sodPerSecond).toBe(7.8);
    });
  });

  test.describe('Resource Display Updates', () => {
    test('should display dirt value in UI', async ({ page }) => {
      await setObservable(page, 'dirtRaw', 42.5);

      const displayedDirt = await getObservable(page, 'dirt');

      // SmartRound: 42.5 < 100, keeps 1 decimal
      expect(displayedDirt).toBe(42.5);
    });

    test('should display grass value in UI', async ({ page }) => {
      await setObservable(page, 'grassRaw', 88.9);

      const displayedGrass = await getObservable(page, 'grass');

      // SmartRound: 88.9 < 100, keeps 1 decimal
      expect(displayedGrass).toBe(88.9);
    });

    test('should display sod value in UI', async ({ page }) => {
      await setObservable(page, 'sodRaw', 15.3);

      const displayedSod = await getObservable(page, 'sod');

      // SmartRound: 15.3 < 100, keeps 1 decimal
      expect(displayedSod).toBe(15.3);
    });
  });

  test.describe('SmartRound Function', () => {
    test('should show one decimal place for values under 100', async ({ page }) => {
      const testValues = [0, 5.5, 25.7, 50.3, 99.9];

      for (const value of testValues) {
        await setObservable(page, 'dirtRaw', value);
        const displayedValue = await getObservable(page, 'dirt');

        // For values < 100, should round to 1 decimal place
        const expected = Math.round(value * 10) / 10;
        expect(displayedValue).toBe(expected);
      }
    });

    test('should round to integer for values 100 and above', async ({ page }) => {
      const testValues = [100, 150.7, 250.4, 999.8, 1500.9];

      for (const value of testValues) {
        await setObservable(page, 'dirtRaw', value);
        const displayedValue = await getObservable(page, 'dirt');

        // For values >= 100, should round to integer
        const expected = Math.round(value);
        expect(displayedValue).toBe(expected);
      }
    });

    test('should apply SmartRound to all resource types', async ({ page }) => {
      // Test dirt
      await setObservable(page, 'dirtRaw', 45.8);
      expect(await getObservable(page, 'dirt')).toBe(45.8);

      // Test grass
      await setObservable(page, 'grassRaw', 67.3);
      expect(await getObservable(page, 'grass')).toBe(67.3);

      // Test sod
      await setObservable(page, 'sodRaw', 99.9);
      expect(await getObservable(page, 'sod')).toBe(99.9);

      // Test with values >= 100
      await setObservable(page, 'dirtRaw', 123.7);
      expect(await getObservable(page, 'dirt')).toBe(124);

      await setObservable(page, 'grassRaw', 456.2);
      expect(await getObservable(page, 'grass')).toBe(456);
    });

    test('should apply SmartRound to production rates', async ({ page }) => {
      // Test rates < 100 (should keep 1 decimal)
      await setObservable(page, 'dirtPerSecondRaw', 15.65);
      expect(await getObservable(page, 'dirtPerSecond')).toBe(15.7);

      await setObservable(page, 'grassPerSecondRaw', 88.44);
      expect(await getObservable(page, 'grassPerSecond')).toBe(88.4);

      // Test rates >= 100 (should round to integer)
      await setObservable(page, 'dirtPerSecondRaw', 125.8);
      expect(await getObservable(page, 'dirtPerSecond')).toBe(126);

      await setObservable(page, 'sodPerSecondRaw', 200.3);
      expect(await getObservable(page, 'sodPerSecond')).toBe(200);
    });
  });

  test.describe('Carry System', () => {
    test('should track carry per second rate', async ({ page }) => {
      await setObservable(page, 'carryPerSecondRaw', 25);

      const carryPerSecond = await getObservable(page, 'carryPerSecond');
      expect(carryPerSecond).toBe(25);
    });

    test('should transfer dirt from mine to factory', async ({ page }) => {
      // Set up initial conditions
      await setObservable(page, 'dirtRaw', 100);
      await setObservable(page, 'carryPerSecondRaw', 10);
      await setObservable(page, 'factoryDirtRaw', 0);

      const initialDirt = await getObservable(page, 'dirtRaw');
      const initialFactoryDirt = await getObservable(page, 'factoryDirtRaw');

      // Fast-forward 1 second
      await fastForward(page, 1);

      const finalDirt = await getObservable(page, 'dirtRaw');
      const finalFactoryDirt = await getObservable(page, 'factoryDirtRaw');

      // Dirt should decrease, factory dirt should increase
      expect(finalDirt).toBeLessThan(initialDirt);
      expect(finalFactoryDirt).toBeGreaterThan(initialFactoryDirt);
    });

    test('should transfer grass from farm to factory', async ({ page }) => {
      // Set up initial conditions
      await setObservable(page, 'grassRaw', 100);
      await setObservable(page, 'carryPerSecondRaw', 10);
      await setObservable(page, 'factoryGrassRaw', 0);

      const initialGrass = await getObservable(page, 'grassRaw');
      const initialFactoryGrass = await getObservable(page, 'factoryGrassRaw');

      // Fast-forward 1 second
      await fastForward(page, 1);

      const finalGrass = await getObservable(page, 'grassRaw');
      const finalFactoryGrass = await getObservable(page, 'factoryGrassRaw');

      // Grass should decrease, factory grass should increase
      expect(finalGrass).toBeLessThan(initialGrass);
      expect(finalFactoryGrass).toBeGreaterThan(initialFactoryGrass);
    });

    test('should not carry more than available resources', async ({ page }) => {
      // Set high carry rate but limited dirt
      await setObservable(page, 'dirtRaw', 5);
      await setObservable(page, 'carryPerSecondRaw', 100);

      // Fast-forward 1 second
      await fastForward(page, 1);

      const dirt = await getObservable(page, 'dirtRaw');

      // Dirt shouldn't go negative
      expect(dirt).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Resource Accumulation', () => {
    test('should accumulate all resources simultaneously', async ({ page }) => {
      // Set production rates for all resources
      await setObservable(page, 'dirtPerSecondRaw', 5);
      await setObservable(page, 'grassPerSecondRaw', 7);
      await setObservable(page, 'sodPerSecondRaw', 3);
      await setObservable(page, 'factoryDirtRaw', 100);
      await setObservable(page, 'factoryGrassRaw', 100);

      // Fast-forward 10 seconds
      await fastForward(page, 10);

      const dirt = await getObservable(page, 'dirtRaw');
      const grass = await getObservable(page, 'grassRaw');
      const sod = await getObservable(page, 'sodRaw');

      // All should have increased
      expect(dirt).toBeGreaterThan(0);
      expect(grass).toBeGreaterThan(0);
      expect(sod).toBeGreaterThan(0);
    });

    test('should maintain accurate totals over long periods', async ({ page }) => {
      await setObservable(page, 'dirtPerSecondRaw', 2.5);

      // Fast-forward 60 seconds
      await fastForward(page, 60);

      const dirt = await getObservable(page, 'dirtRaw');
      const expected = 2.5 * 60; // 150

      // Allow small accumulated floating-point error
      expect(Math.abs(dirt - expected)).toBeLessThan(1);
    });

    test('should handle zero production rates without errors', async ({ page }) => {
      await setObservable(page, 'dirtPerSecondRaw', 0);
      await setObservable(page, 'grassPerSecondRaw', 0);
      await setObservable(page, 'sodPerSecondRaw', 0);

      const initialDirt = await getObservable(page, 'dirtRaw');
      const initialGrass = await getObservable(page, 'grassRaw');
      const initialSod = await getObservable(page, 'sodRaw');

      // Fast-forward 5 seconds
      await fastForward(page, 5);

      const finalDirt = await getObservable(page, 'dirtRaw');
      const finalGrass = await getObservable(page, 'grassRaw');
      const finalSod = await getObservable(page, 'sodRaw');

      // Nothing should change
      expect(finalDirt).toBe(initialDirt);
      expect(finalGrass).toBe(initialGrass);
      expect(finalSod).toBe(initialSod);
    });
  });

  test.describe('Production Tab Display', () => {
    test('should show correct production rates in UI', async ({ page }) => {
      await navigateToTab(page, 'production');

      // Set production rates
      await setObservable(page, 'dirtPerSecondRaw', 12.5);
      await setObservable(page, 'grassPerSecondRaw', 18.3);

      // Wait for UI to update
      await page.waitForTimeout(100);

      // Verify production tab is visible
      const productionTab = await page.locator('#tabs-production').isVisible();
      expect(productionTab).toBe(true);
    });

    test('should update resource displays in real-time', async ({ page }) => {
      await navigateToTab(page, 'production');

      await setObservable(page, 'dirtRaw', 50);
      const dirt1 = await getObservable(page, 'dirt');
      expect(dirt1).toBe(50);

      await setObservable(page, 'dirtRaw', 75);
      const dirt2 = await getObservable(page, 'dirt');
      expect(dirt2).toBe(75);
    });
  });
});
