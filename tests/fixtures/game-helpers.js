/**
 * Game helper utilities for Critter Mound Playwright tests
 * Provides common functions for interacting with the Knockout.js-based game
 */

/**
 * Wait for the game to fully initialize (Knockout bindings applied)
 * @param {import('@playwright/test').Page} page
 */
export async function waitForGameInit(page) {
  // Wait for the global game object to be defined
  await page.waitForFunction(() => window.game !== undefined, { timeout: 10000 });

  // Wait for Knockout bindings to be applied
  await page.waitForFunction(() => {
    const element = document.querySelector('[data-bind]');
    return element && window.ko && window.ko.dataFor(element) !== undefined;
  }, { timeout: 10000 });

  // Small delay to ensure game loop has started
  await page.waitForTimeout(100);
}

/**
 * Clear localStorage to start with a fresh game state
 * @param {import('@playwright/test').Page} page
 */
export async function clearGameState(page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // Ignore if localStorage is not accessible
      console.log('Could not clear storage:', e);
    }
  });
}

/**
 * Get the value of a Knockout observable from the game object
 * @param {import('@playwright/test').Page} page
 * @param {string} observablePath - Path to observable (e.g., 'dirt', 'generations')
 * @returns {Promise<any>}
 */
export async function getObservable(page, observablePath) {
  return await page.evaluate((path) => {
    const value = window.game[path];
    return typeof value === 'function' ? value() : value;
  }, observablePath);
}

/**
 * Set the value of a Knockout observable (for testing purposes)
 * @param {import('@playwright/test').Page} page
 * @param {string} observablePath
 * @param {any} value
 */
export async function setObservable(page, observablePath, value) {
  await page.evaluate(({ path, val }) => {
    const observable = window.game[path];
    if (typeof observable === 'function') {
      observable(val);
    }
  }, { path: observablePath, val: value });
}

/**
 * Fast-forward game time by running ticks
 * Game runs at 20 ticks per second
 * @param {import('@playwright/test').Page} page
 * @param {number} seconds - Number of seconds to simulate
 */
export async function fastForward(page, seconds) {
  const ticks = seconds * 20; // 20 ticks per second
  await page.evaluate((numTicks) => {
    for (let i = 0; i < numTicks; i++) {
      window.game.Tick();
    }
  }, ticks);
}

/**
 * Get formatted number display (using game's formatting function)
 * @param {import('@playwright/test').Page} page
 * @param {number} number
 * @returns {Promise<string>}
 */
export async function formatNumber(page, number) {
  return await page.evaluate((num) => {
    return window.gameFormatNumber(num);
  }, number);
}

/**
 * Check for console errors on the page
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>} Array of error messages
 */
export async function getConsoleErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

/**
 * Navigate to a specific tab in the game
 * @param {import('@playwright/test').Page} page
 * @param {string} tabName - 'hatchery', 'heirs', 'production', 'barracks', 'achievements', 'information'
 */
export async function navigateToTab(page, tabName) {
  const tabMap = {
    hatchery: '#tabs-hatchery',
    heirs: '#tabs-heirs',
    production: '#tabs-production',
    barracks: '#tabs-barracks',
    achievements: '#tabs-achievements',
    information: '#tabs-information',
  };

  const tabId = tabMap[tabName];
  if (!tabId) {
    throw new Error(`Unknown tab: ${tabName}`);
  }

  await page.click(`a[href="${tabId}"]`);
  await page.waitForSelector(tabId, { state: 'visible' });
}

/**
 * Get the current game save data
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>} Base64 encoded save string
 */
export async function getSaveData(page) {
  return await page.evaluate(() => {
    return window.game.Save();
  });
}

/**
 * Load game from save data
 * @param {import('@playwright/test').Page} page
 * @param {string} saveData - Base64 encoded save string
 */
export async function loadSaveData(page, saveData) {
  await page.evaluate((data) => {
    window.game.Load(data);
  }, saveData);
}

/**
 * Get all critters in a specific mound
 * @param {import('@playwright/test').Page} page
 * @param {string} moundType - 'femaleMound', 'maleMound', 'armyMound', 'princessMound', 'princeMound'
 * @returns {Promise<Array>}
 */
export async function getMound(page, moundType) {
  return await page.evaluate((type) => {
    const mound = window.game[type];
    return typeof mound === 'function' ? mound() : mound;
  }, moundType);
}

/**
 * Click a critter in the UI
 * @param {import('@playwright/test').Page} page
 * @param {number} index - Index of the critter in the table
 */
export async function selectCritter(page, index) {
  await page.click(`table.critter > tbody > tr.critterRow:nth-child(${index + 1})`);
}

/**
 * Shift+click a critter to lock it
 * @param {import('@playwright/test').Page} page
 * @param {number} index
 */
export async function lockCritter(page, index) {
  await page.click(`table.critter > tbody > tr.critterRow:nth-child(${index + 1})`, {
    modifiers: ['Shift']
  });
}

/**
 * Toggle dark mode
 * @param {import('@playwright/test').Page} page
 */
export async function toggleDarkMode(page) {
  await page.click('#theme-toggle');
  await page.waitForTimeout(100); // Wait for theme transition
}

/**
 * Check if dark mode is active
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>}
 */
export async function isDarkMode(page) {
  return await page.evaluate(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });
}

/**
 * Wait for a specific number of generations
 * @param {import('@playwright/test').Page} page
 * @param {number} targetGenerations
 * @param {number} timeout - Maximum time to wait in ms
 */
export async function waitForGenerations(page, targetGenerations, timeout = 30000) {
  await page.waitForFunction(
    (target) => window.game && window.game.generations() >= target,
    targetGenerations,
    { timeout }
  );
}

/**
 * Breed critters (assumes male and female are selected)
 * @param {import('@playwright/test').Page} page
 */
export async function breedCritters(page) {
  await page.click('button.breed');
  await page.waitForTimeout(100); // Wait for breeding to complete
}
