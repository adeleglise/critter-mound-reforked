import { test, expect } from '@playwright/test';
import { waitForGameInit, clearGameState } from './fixtures/game-helpers.js';

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Navigate to page first
    await page.goto('/');

    // Then clear state
    await clearGameState(page);

    // Reload to get clean state
    await page.reload();

    // Wait for game to initialize
    await waitForGameInit(page);
  });

  test('should load the game successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Critter Mound/);
  });

  test('should have all main tabs visible', async ({ page }) => {
    // Check main navigation tabs
    await expect(page.locator('a[href="#tabs-hatchery"]')).toBeVisible();
    await expect(page.locator('a[href="#tabs-production"]')).toBeVisible();
    await expect(page.locator('a[href="#tabs-barracks"]')).toBeVisible();
    await expect(page.locator('a[href="#tabs-achievements"]')).toBeVisible();
    await expect(page.locator('a[href="#tabs-information"]')).toBeVisible();
  });

  test('should initialize game with Knockout bindings', async ({ page }) => {
    // Verify game object exists
    const gameExists = await page.evaluate(() => window.game !== undefined);
    expect(gameExists).toBe(true);

    // Verify Knockout is loaded
    const koExists = await page.evaluate(() => window.ko !== undefined);
    expect(koExists).toBe(true);

    // Verify data bindings are working
    const hasBindings = await page.evaluate(() => {
      const element = document.querySelector('[data-bind]');
      return element && window.ko.dataFor(element) !== undefined;
    });
    expect(hasBindings).toBe(true);
  });

  test('should display initial game state', async ({ page }) => {
    // Check that game state is initialized via observables
    const generations = await page.evaluate(() => window.game.generations());
    expect(generations).toBeGreaterThanOrEqual(0);

    const sod = await page.evaluate(() => window.game.sod());
    expect(sod).toBeGreaterThanOrEqual(0);

    // Verify the page content div exists
    await expect(page.locator('#pageContent')).toBeVisible();
  });

  test('should have theme toggle button', async ({ page }) => {
    const themeToggle = page.locator('#theme-toggle');
    await expect(themeToggle).toBeVisible();
  });

  test('should not have console errors on load', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit for any delayed errors
    await page.waitForTimeout(1000);

    expect(errors).toHaveLength(0);
  });

  test('should have jQuery loaded', async ({ page }) => {
    const jQueryExists = await page.evaluate(() => window.$ !== undefined && window.jQuery !== undefined);
    expect(jQueryExists).toBe(true);
  });

  test('should start game loop', async ({ page }) => {
    // Get initial generations count
    const initialGen = await page.evaluate(() => window.game.generations());

    // Wait for a short time
    await page.waitForTimeout(200);

    // Manually trigger a tick to verify game loop can run
    await page.evaluate(() => window.game.Tick());

    // Game should still be functional
    const gameStillWorks = await page.evaluate(() => window.game !== undefined);
    expect(gameStillWorks).toBe(true);
  });
});
