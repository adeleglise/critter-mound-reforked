import { test, expect } from '@playwright/test';
import {
  waitForGameInit,
  clearGameState,
  fastForward,
  getObservable,
  setObservable,
  navigateToTab,
  getMound
} from './fixtures/game-helpers.js';

/**
 * Worker System E2E Tests
 *
 * Tests for assigning critters to work roles (miners, farmers, carriers, factory workers)
 * and verifying their production rates and efficiency.
 *
 * Key Game Mechanics:
 * - Miners: Produce dirt based on 'mine' stat (derived from agility trait)
 * - Farmers: Produce grass based on 'farm' stat (derived from strength trait)
 * - Carriers: Transport dirt and grass to factory based on 'carry' stat (vitality trait)
 * - Factory Workers: Convert dirt + grass into sod based on vitality stat
 * - Workers are sorted by their productivity (best workers kept when over limit)
 * - Each worker type has a max capacity (starts at 1, upgradable to 10)
 * - Worker efficiency calculated as: 60 / (actionTime / 20) * stat / 60 per second
 */

test.describe('Worker System', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);
  });

  /**
   * Helper function to create a test critter with specific stats
   * @param {Page} page - Playwright page object
   * @param {Object} stats - Critter stats { mine, farm, carry, vitality }
   * @returns {Promise<Object>} Created critter
   */
  async function createTestCritter(page, stats = {}) {
    return await page.evaluate((critterStats) => {
      // Create a new critter through the game's breed system
      const critter = {
        generation: 0,
        id: Math.random() * 1000000,
        gender: 1, // Male
        job: 1, // Available for work
        isSelected: ko.observable(false),
        isLocked: ko.observable(false),
        traits: []
      };

      // Set up traits (index corresponds to trait type)
      // 0: Vitality, 1: Carry, 2: Agility, 3: Strength, 4: Mine, 5: Farm
      for (let i = 0; i < 13; i++) {
        critter.traits[i] = {
          value: 10,
          base: 10,
          bonus: 0,
          genes: [],
          stats: [],
          mutation: false
        };
      }

      // Set specific trait values
      if (critterStats.vitality) critter.traits[0].value = critterStats.vitality;
      if (critterStats.carry) critter.traits[1].value = critterStats.carry;
      if (critterStats.agility) critter.traits[2].value = critterStats.agility;
      if (critterStats.strength) critter.traits[3].value = critterStats.strength;

      // Calculate action time (affects production speed)
      critter.actionTime = 20; // Default action time

      // Calculate production rates
      const actionTimeInSeconds = critter.actionTime / 20; // Convert ticks to seconds
      critter.health = Math.round(critter.traits[0].value * 15);
      critter.currentHealth = ko.observable(0);

      // Mine production: based on mine stat (agility + bonus)
      const mineStat = critter.traits[4].value || critter.traits[2].value; // Use agility if mine not set
      critter.dirtPerSecond = Math.round((60 / actionTimeInSeconds * mineStat / 60) * 10) / 10;

      // Farm production: based on farm stat (strength + bonus)
      const farmStat = critter.traits[5].value || critter.traits[3].value; // Use strength if farm not set
      critter.grassPerSecond = Math.round((60 / actionTimeInSeconds * farmStat / 60) * 10) / 10;

      // Carry capacity: based on carry stat (vitality-based)
      const carryStat = critter.traits[1].value || critter.traits[0].value;
      critter.carryPerSecond = Math.round((60 / actionTimeInSeconds * carryStat / 60) * 10) / 10;

      // Sod production: based on vitality
      critter.sodPerSecond = Math.round((60 / actionTimeInSeconds * critter.traits[0].value / 60) * 10) / 10;

      // Calculate score (for sorting)
      critter.score = (critter.traits[0].value + critter.traits[1].value +
                      critter.traits[2].value + critter.traits[3].value) / 4;

      return critter;
    }, stats);
  }

  /**
   * Helper function to add a critter to a mound
   */
  async function addCritterToMound(page, moundName, critter) {
    await page.evaluate(({ mound, crit }) => {
      window.game[mound].push(crit);
    }, { mound: moundName, crit: critter });
  }

  test.describe('Initial Worker State', () => {
    test('should start with empty worker mounds', async ({ page }) => {
      const mineMound = await getMound(page, 'mineMound');
      const farmMound = await getMound(page, 'farmMound');
      const carrierMound = await getMound(page, 'carrierMound');
      const factoryMound = await getMound(page, 'factoryMound');

      expect(mineMound.length).toBe(0);
      expect(farmMound.length).toBe(0);
      expect(carrierMound.length).toBe(0);
      expect(factoryMound.length).toBe(0);
    });

    test('should have max worker capacity of 1 initially', async ({ page }) => {
      const maxMiners = await getObservable(page, 'maxMineMoundSize');
      const maxFarmers = await getObservable(page, 'maxFarmMoundSize');
      const maxCarriers = await getObservable(page, 'maxCarrierMoundSize');
      const maxFactory = await getObservable(page, 'maxFactoryMoundSize');

      expect(maxMiners).toBe(1);
      expect(maxFarmers).toBe(1);
      expect(maxCarriers).toBe(1);
      expect(maxFactory).toBe(1);
    });

    test('should display zero production rates initially', async ({ page }) => {
      await navigateToTab(page, 'production');

      const dirtPerSecond = await getObservable(page, 'dirtPerSecond');
      const grassPerSecond = await getObservable(page, 'grassPerSecond');
      const carryPerSecond = await getObservable(page, 'carryPerSecond');
      const sodPerSecond = await getObservable(page, 'sodPerSecond');

      expect(dirtPerSecond).toBe(0);
      expect(grassPerSecond).toBe(0);
      expect(carryPerSecond).toBe(0);
      expect(sodPerSecond).toBe(0);
    });

    test('should show worker UI elements in production tab', async ({ page }) => {
      await navigateToTab(page, 'production');

      // Check that worker tables exist
      const productionContent = await page.locator('#tabs-production').isVisible();
      expect(productionContent).toBe(true);

      // Wait for content to render
      await page.waitForTimeout(200);
    });
  });

  test.describe('Assigning Miners', () => {
    test('should assign critter as miner via Move function', async ({ page }) => {
      // Create a test critter with mining capability
      const critter = await createTestCritter(page, { agility: 30 });
      await addCritterToMound(page, 'maleMound', critter);

      // Execute Move command to assign as miner
      await page.evaluate(() => {
        window.game.Move('Worker', 'Mine', null, {});
      });

      // Verify critter is in mine mound
      const mineMound = await getMound(page, 'mineMound');
      expect(mineMound.length).toBe(1);

      // Verify dirt production rate increased
      const dirtPerSecond = await getObservable(page, 'dirtPerSecondRaw');
      expect(dirtPerSecond).toBeGreaterThan(0);
    });

    test('should calculate miner production based on mine stat', async ({ page }) => {
      // Create miner with specific agility (mine stat)
      const critter = await createTestCritter(page, { agility: 60 });
      await addCritterToMound(page, 'maleMound', critter);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Mine', null, {});
        window.game.UpdateProduction();
      });

      const dirtPerSecond = await getObservable(page, 'dirtPerSecondRaw');

      // Production should be 60/(20/20) * 60/60 = 60 per second
      expect(dirtPerSecond).toBeGreaterThan(50);
      expect(dirtPerSecond).toBeLessThan(70);
    });

    test('should remove miner from male/female mound when assigned', async ({ page }) => {
      const critter = await createTestCritter(page, { agility: 20 });
      await addCritterToMound(page, 'maleMound', critter);

      const initialMaleMound = await getMound(page, 'maleMound');
      expect(initialMaleMound.length).toBe(1);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Mine', null, {});
      });

      const finalMaleMound = await getMound(page, 'maleMound');
      expect(finalMaleMound.length).toBe(0);

      const mineMound = await getMound(page, 'mineMound');
      expect(mineMound.length).toBe(1);
    });

    test('should produce dirt over time with active miner', async ({ page }) => {
      const critter = await createTestCritter(page, { agility: 40 });
      await addCritterToMound(page, 'maleMound', critter);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Mine', null, {});
        window.game.UpdateProduction();
      });

      const initialDirt = await getObservable(page, 'dirtRaw');

      // Fast-forward 5 seconds
      await fastForward(page, 5);

      const finalDirt = await getObservable(page, 'dirtRaw');

      // Dirt should have accumulated
      expect(finalDirt).toBeGreaterThan(initialDirt);
    });

    test('should respect max miner capacity', async ({ page }) => {
      // Create two critters
      const critter1 = await createTestCritter(page, { agility: 30 });
      const critter2 = await createTestCritter(page, { agility: 40 });

      await addCritterToMound(page, 'maleMound', critter1);
      await addCritterToMound(page, 'maleMound', critter2);

      // Try to assign both as miners (max is 1)
      await page.evaluate(() => {
        window.game.Move('Worker', 'Mine', null, {});
        window.game.Move('Worker', 'Mine', null, {});
      });

      const mineMound = await getMound(page, 'mineMound');
      const maxSize = await getObservable(page, 'maxMineMoundSize');

      // Should not exceed max capacity
      expect(mineMound.length).toBeLessThanOrEqual(maxSize);
    });

    test('should keep best miner when over capacity', async ({ page }) => {
      // Increase capacity first
      await setObservable(page, 'maxMineMoundSize', 2);

      // Create critters with different mining abilities
      const weakMiner = await createTestCritter(page, { agility: 20 });
      const strongMiner = await createTestCritter(page, { agility: 80 });

      await addCritterToMound(page, 'maleMound', weakMiner);
      await addCritterToMound(page, 'maleMound', strongMiner);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Mine', null, {});
        window.game.Move('Worker', 'Mine', null, {});
        window.game.UpdateProduction();
      });

      // Set capacity back to 1 and sort
      await setObservable(page, 'maxMineMoundSize', 1);
      await page.evaluate(() => {
        window.game.Sort();
      });

      const mineMound = await getMound(page, 'mineMound');
      expect(mineMound.length).toBe(1);

      // The remaining miner should be the stronger one
      if (mineMound.length > 0) {
        expect(mineMound[0].dirtPerSecond).toBeGreaterThan(30);
      }
    });
  });

  test.describe('Assigning Farmers', () => {
    test('should assign critter as farmer via Move function', async ({ page }) => {
      const critter = await createTestCritter(page, { strength: 35 });
      await addCritterToMound(page, 'maleMound', critter);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Farm', null, {});
      });

      const farmMound = await getMound(page, 'farmMound');
      expect(farmMound.length).toBe(1);

      const grassPerSecond = await getObservable(page, 'grassPerSecondRaw');
      expect(grassPerSecond).toBeGreaterThan(0);
    });

    test('should calculate farmer production based on farm stat', async ({ page }) => {
      const critter = await createTestCritter(page, { strength: 50 });
      await addCritterToMound(page, 'maleMound', critter);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Farm', null, {});
        window.game.UpdateProduction();
      });

      const grassPerSecond = await getObservable(page, 'grassPerSecondRaw');

      // Production should be approximately 50 per second
      expect(grassPerSecond).toBeGreaterThan(40);
      expect(grassPerSecond).toBeLessThan(60);
    });

    test('should produce grass over time with active farmer', async ({ page }) => {
      const critter = await createTestCritter(page, { strength: 30 });
      await addCritterToMound(page, 'femaleMound', critter);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Farm', null, {});
        window.game.UpdateProduction();
      });

      const initialGrass = await getObservable(page, 'grassRaw');

      // Fast-forward 5 seconds
      await fastForward(page, 5);

      const finalGrass = await getObservable(page, 'grassRaw');

      // Grass should have accumulated
      expect(finalGrass).toBeGreaterThan(initialGrass);
    });

    test('should work independently from miners', async ({ page }) => {
      const miner = await createTestCritter(page, { agility: 40 });
      const farmer = await createTestCritter(page, { strength: 40 });

      await addCritterToMound(page, 'maleMound', miner);
      await addCritterToMound(page, 'femaleMound', farmer);

      // Increase capacity to allow both
      await setObservable(page, 'maxMineMoundSize', 1);
      await setObservable(page, 'maxFarmMoundSize', 1);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Mine', null, {});
        window.game.Move('Worker', 'Farm', null, {});
        window.game.UpdateProduction();
      });

      const dirtPerSecond = await getObservable(page, 'dirtPerSecondRaw');
      const grassPerSecond = await getObservable(page, 'grassPerSecondRaw');

      // Both should be producing
      expect(dirtPerSecond).toBeGreaterThan(0);
      expect(grassPerSecond).toBeGreaterThan(0);
    });

    test('should respect max farmer capacity', async ({ page }) => {
      const critter1 = await createTestCritter(page, { strength: 30 });
      const critter2 = await createTestCritter(page, { strength: 35 });

      await addCritterToMound(page, 'maleMound', critter1);
      await addCritterToMound(page, 'maleMound', critter2);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Farm', null, {});
        window.game.Move('Worker', 'Farm', null, {});
      });

      const farmMound = await getMound(page, 'farmMound');
      const maxSize = await getObservable(page, 'maxFarmMoundSize');

      expect(farmMound.length).toBeLessThanOrEqual(maxSize);
    });
  });

  test.describe('Assigning Carriers', () => {
    test('should assign critter as carrier via Move function', async ({ page }) => {
      const critter = await createTestCritter(page, { vitality: 45, carry: 45 });
      await addCritterToMound(page, 'maleMound', critter);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Carrier', null, {});
      });

      const carrierMound = await getMound(page, 'carrierMound');
      expect(carrierMound.length).toBe(1);

      const carryPerSecond = await getObservable(page, 'carryPerSecondRaw');
      expect(carryPerSecond).toBeGreaterThan(0);
    });

    test('should calculate carrier capacity based on carry stat', async ({ page }) => {
      const critter = await createTestCritter(page, { vitality: 60, carry: 60 });
      await addCritterToMound(page, 'maleMound', critter);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Carrier', null, {});
        window.game.UpdateProduction();
      });

      const carryPerSecond = await getObservable(page, 'carryPerSecondRaw');

      // Should be approximately 60 per second
      expect(carryPerSecond).toBeGreaterThan(50);
      expect(carryPerSecond).toBeLessThan(70);
    });

    test('should transfer resources from mine/farm to factory', async ({ page }) => {
      // Set up production
      await setObservable(page, 'dirtRaw', 100);
      await setObservable(page, 'grassRaw', 100);

      const critter = await createTestCritter(page, { vitality: 50, carry: 50 });
      await addCritterToMound(page, 'maleMound', critter);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Carrier', null, {});
        window.game.UpdateProduction();
      });

      const initialDirt = await getObservable(page, 'dirtRaw');
      const initialFactoryDirt = await getObservable(page, 'factoryDirtRaw');

      // Fast-forward 1 second
      await fastForward(page, 1);

      const finalDirt = await getObservable(page, 'dirtRaw');
      const finalFactoryDirt = await getObservable(page, 'factoryDirtRaw');

      // Resources should transfer
      expect(finalDirt).toBeLessThan(initialDirt);
      expect(finalFactoryDirt).toBeGreaterThan(initialFactoryDirt);
    });

    test('should respect max carrier capacity', async ({ page }) => {
      const critter1 = await createTestCritter(page, { vitality: 30, carry: 30 });
      const critter2 = await createTestCritter(page, { vitality: 40, carry: 40 });

      await addCritterToMound(page, 'maleMound', critter1);
      await addCritterToMound(page, 'maleMound', critter2);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Carrier', null, {});
        window.game.Move('Worker', 'Carrier', null, {});
      });

      const carrierMound = await getMound(page, 'carrierMound');
      const maxSize = await getObservable(page, 'maxCarrierMoundSize');

      expect(carrierMound.length).toBeLessThanOrEqual(maxSize);
    });
  });

  test.describe('Assigning Factory Workers', () => {
    test('should assign critter as factory worker via Move function', async ({ page }) => {
      const critter = await createTestCritter(page, { vitality: 40 });
      await addCritterToMound(page, 'maleMound', critter);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Factory', null, {});
      });

      const factoryMound = await getMound(page, 'factoryMound');
      expect(factoryMound.length).toBe(1);

      const sodPerSecond = await getObservable(page, 'sodPerSecondRaw');
      expect(sodPerSecond).toBeGreaterThan(0);
    });

    test('should calculate sod production based on vitality stat', async ({ page }) => {
      const critter = await createTestCritter(page, { vitality: 70 });
      await addCritterToMound(page, 'maleMound', critter);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Factory', null, {});
        window.game.UpdateProduction();
      });

      const sodPerSecond = await getObservable(page, 'sodPerSecondRaw');

      // Should be approximately 70 per second
      expect(sodPerSecond).toBeGreaterThan(60);
      expect(sodPerSecond).toBeLessThan(80);
    });

    test('should produce sod when factory has resources', async ({ page }) => {
      // Set up factory with resources
      await setObservable(page, 'factoryDirtRaw', 100);
      await setObservable(page, 'factoryGrassRaw', 100);

      const critter = await createTestCritter(page, { vitality: 50 });
      await addCritterToMound(page, 'maleMound', critter);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Factory', null, {});
        window.game.UpdateProduction();
      });

      const initialSod = await getObservable(page, 'sodRaw');

      // Fast-forward 2 seconds
      await fastForward(page, 2);

      const finalSod = await getObservable(page, 'sodRaw');

      // Sod should have increased
      expect(finalSod).toBeGreaterThan(initialSod);
    });

    test('should respect max factory capacity', async ({ page }) => {
      const critter1 = await createTestCritter(page, { vitality: 40 });
      const critter2 = await createTestCritter(page, { vitality: 50 });

      await addCritterToMound(page, 'maleMound', critter1);
      await addCritterToMound(page, 'maleMound', critter2);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Factory', null, {});
        window.game.Move('Worker', 'Factory', null, {});
      });

      const factoryMound = await getMound(page, 'factoryMound');
      const maxSize = await getObservable(page, 'maxFactoryMoundSize');

      expect(factoryMound.length).toBeLessThanOrEqual(maxSize);
    });
  });

  test.describe('Multiple Workers', () => {
    test('should handle multiple miners working simultaneously', async ({ page }) => {
      await setObservable(page, 'maxMineMoundSize', 3);

      const critter1 = await createTestCritter(page, { agility: 30 });
      const critter2 = await createTestCritter(page, { agility: 40 });
      const critter3 = await createTestCritter(page, { agility: 50 });

      await addCritterToMound(page, 'maleMound', critter1);
      await addCritterToMound(page, 'maleMound', critter2);
      await addCritterToMound(page, 'maleMound', critter3);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Mine', null, {});
        window.game.Move('Worker', 'Mine', null, {});
        window.game.Move('Worker', 'Mine', null, {});
        window.game.UpdateProduction();
      });

      const mineMound = await getMound(page, 'mineMound');
      expect(mineMound.length).toBeGreaterThan(1);

      const dirtPerSecond = await getObservable(page, 'dirtPerSecondRaw');
      // Combined production should be significant
      expect(dirtPerSecond).toBeGreaterThan(50);
    });

    test('should handle multiple farmers working simultaneously', async ({ page }) => {
      await setObservable(page, 'maxFarmMoundSize', 3);

      const critter1 = await createTestCritter(page, { strength: 30 });
      const critter2 = await createTestCritter(page, { strength: 40 });
      const critter3 = await createTestCritter(page, { strength: 50 });

      await addCritterToMound(page, 'maleMound', critter1);
      await addCritterToMound(page, 'maleMound', critter2);
      await addCritterToMound(page, 'maleMound', critter3);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Farm', null, {});
        window.game.Move('Worker', 'Farm', null, {});
        window.game.Move('Worker', 'Farm', null, {});
        window.game.UpdateProduction();
      });

      const farmMound = await getMound(page, 'farmMound');
      expect(farmMound.length).toBeGreaterThan(1);

      const grassPerSecond = await getObservable(page, 'grassPerSecondRaw');
      expect(grassPerSecond).toBeGreaterThan(50);
    });

    test('should handle all worker types simultaneously', async ({ page }) => {
      // Increase all capacities
      await setObservable(page, 'maxMineMoundSize', 2);
      await setObservable(page, 'maxFarmMoundSize', 2);
      await setObservable(page, 'maxCarrierMoundSize', 2);
      await setObservable(page, 'maxFactoryMoundSize', 2);

      // Create workers for each role
      const miner = await createTestCritter(page, { agility: 40 });
      const farmer = await createTestCritter(page, { strength: 40 });
      const carrier = await createTestCritter(page, { vitality: 40, carry: 40 });
      const factory = await createTestCritter(page, { vitality: 40 });

      await addCritterToMound(page, 'maleMound', miner);
      await addCritterToMound(page, 'maleMound', farmer);
      await addCritterToMound(page, 'maleMound', carrier);
      await addCritterToMound(page, 'maleMound', factory);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Mine', null, {});
        window.game.Move('Worker', 'Farm', null, {});
        window.game.Move('Worker', 'Carrier', null, {});
        window.game.Move('Worker', 'Factory', null, {});
        window.game.UpdateProduction();
      });

      const dirtPerSecond = await getObservable(page, 'dirtPerSecondRaw');
      const grassPerSecond = await getObservable(page, 'grassPerSecondRaw');
      const carryPerSecond = await getObservable(page, 'carryPerSecondRaw');
      const sodPerSecond = await getObservable(page, 'sodPerSecondRaw');

      // All production rates should be positive
      expect(dirtPerSecond).toBeGreaterThan(0);
      expect(grassPerSecond).toBeGreaterThan(0);
      expect(carryPerSecond).toBeGreaterThan(0);
      expect(sodPerSecond).toBeGreaterThan(0);
    });
  });

  test.describe('Worker Efficiency', () => {
    test('should have higher production with higher stat critters', async ({ page }) => {
      // Test miner efficiency
      const weakMiner = await createTestCritter(page, { agility: 20 });
      await addCritterToMound(page, 'maleMound', weakMiner);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Mine', null, {});
        window.game.UpdateProduction();
      });

      const weakProduction = await getObservable(page, 'dirtPerSecondRaw');

      // Clear and test strong miner
      await page.evaluate(() => {
        window.game.mineMound.removeAll();
      });

      const strongMiner = await createTestCritter(page, { agility: 80 });
      await addCritterToMound(page, 'maleMound', strongMiner);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Mine', null, {});
        window.game.UpdateProduction();
      });

      const strongProduction = await getObservable(page, 'dirtPerSecondRaw');

      // Strong miner should produce significantly more
      expect(strongProduction).toBeGreaterThan(weakProduction * 2);
    });

    test('should calculate production rates correctly for different action times', async ({ page }) => {
      // Production formula: 60 / (actionTime / ticksPerSecond) * stat / 60
      // With actionTime=20 and ticksPerSecond=20: 60 / 1 * stat / 60 = stat

      const critter = await createTestCritter(page, { agility: 100 });
      await addCritterToMound(page, 'maleMound', critter);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Mine', null, {});
        window.game.UpdateProduction();
      });

      const dirtPerSecond = await getObservable(page, 'dirtPerSecondRaw');

      // Should be approximately 100 per second
      expect(dirtPerSecond).toBeGreaterThan(90);
      expect(dirtPerSecond).toBeLessThan(110);
    });
  });

  test.describe('Removing Workers', () => {
    test('should remove worker from mine mound via Recycle', async ({ page }) => {
      const critter = await createTestCritter(page, { agility: 30 });
      await addCritterToMound(page, 'maleMound', critter);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Mine', null, {});
      });

      const mineMoundBefore = await getMound(page, 'mineMound');
      expect(mineMoundBefore.length).toBe(1);

      await page.evaluate(() => {
        window.game.Move('Recycle', 'Mine', null, {});
      });

      const mineMoundAfter = await getMound(page, 'mineMound');
      expect(mineMoundAfter.length).toBe(0);
    });

    test('should decrease production when worker is removed', async ({ page }) => {
      const critter = await createTestCritter(page, { agility: 50 });
      await addCritterToMound(page, 'maleMound', critter);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Mine', null, {});
        window.game.UpdateProduction();
      });

      const productionBefore = await getObservable(page, 'dirtPerSecondRaw');
      expect(productionBefore).toBeGreaterThan(0);

      await page.evaluate(() => {
        window.game.Move('Recycle', 'Mine', null, {});
        window.game.UpdateProduction();
      });

      const productionAfter = await getObservable(page, 'dirtPerSecondRaw');
      expect(productionAfter).toBe(0);
    });
  });

  test.describe('Worker UI Updates', () => {
    test('should display worker counts in production tab', async ({ page }) => {
      await navigateToTab(page, 'production');

      const critter = await createTestCritter(page, { agility: 30 });
      await addCritterToMound(page, 'maleMound', critter);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Mine', null, {});
      });

      // Wait for UI update
      await page.waitForTimeout(200);

      const mineMound = await getMound(page, 'mineMound');
      expect(mineMound.length).toBe(1);
    });

    test('should update production rates in UI when workers are added', async ({ page }) => {
      await navigateToTab(page, 'production');

      const initialRate = await getObservable(page, 'dirtPerSecond');
      expect(initialRate).toBe(0);

      const critter = await createTestCritter(page, { agility: 40 });
      await addCritterToMound(page, 'maleMound', critter);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Mine', null, {});
        window.game.UpdateProduction();
      });

      // Wait for UI update
      await page.waitForTimeout(100);

      const updatedRate = await getObservable(page, 'dirtPerSecond');
      expect(updatedRate).toBeGreaterThan(0);
    });
  });

  test.describe('Worker Sorting', () => {
    test('should sort miners by production rate', async ({ page }) => {
      await setObservable(page, 'maxMineMoundSize', 3);

      // Create miners with different stats
      const weak = await createTestCritter(page, { agility: 20 });
      const medium = await createTestCritter(page, { agility: 50 });
      const strong = await createTestCritter(page, { agility: 80 });

      // Add in random order
      await addCritterToMound(page, 'maleMound', medium);
      await addCritterToMound(page, 'maleMound', weak);
      await addCritterToMound(page, 'maleMound', strong);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Mine', null, {});
        window.game.Move('Worker', 'Mine', null, {});
        window.game.Move('Worker', 'Mine', null, {});
        window.game.Sort();
      });

      const mineMound = await getMound(page, 'mineMound');

      // Should be sorted by dirtPerSecond (highest first)
      if (mineMound.length >= 2) {
        expect(mineMound[0].dirtPerSecond).toBeGreaterThanOrEqual(mineMound[1].dirtPerSecond);
      }
    });

    test('should sort farmers by production rate', async ({ page }) => {
      await setObservable(page, 'maxFarmMoundSize', 3);

      const weak = await createTestCritter(page, { strength: 25 });
      const medium = await createTestCritter(page, { strength: 55 });
      const strong = await createTestCritter(page, { strength: 85 });

      await addCritterToMound(page, 'maleMound', weak);
      await addCritterToMound(page, 'maleMound', strong);
      await addCritterToMound(page, 'maleMound', medium);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Farm', null, {});
        window.game.Move('Worker', 'Farm', null, {});
        window.game.Move('Worker', 'Farm', null, {});
        window.game.Sort();
      });

      const farmMound = await getMound(page, 'farmMound');

      // Should be sorted by grassPerSecond (highest first)
      if (farmMound.length >= 2) {
        expect(farmMound[0].grassPerSecond).toBeGreaterThanOrEqual(farmMound[1].grassPerSecond);
      }
    });
  });

  test.describe('Worker Bonuses', () => {
    test('should apply mine bonus percentage to production', async ({ page }) => {
      const critter = await createTestCritter(page, { agility: 50 });
      await addCritterToMound(page, 'maleMound', critter);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Mine', null, {});
        window.game.UpdateProduction();
      });

      const baseProduction = await getObservable(page, 'dirtPerSecondRaw');

      // Apply 10% bonus
      await setObservable(page, 'bonusMinePercent', 10);
      await page.evaluate(() => {
        window.game.UpdateProduction();
      });

      const bonusProduction = await getObservable(page, 'dirtPerSecondRaw');

      // Production should increase by ~10%
      expect(bonusProduction).toBeGreaterThan(baseProduction);
      expect(bonusProduction).toBeCloseTo(baseProduction * 1.1, 0);
    });

    test('should apply farm bonus percentage to production', async ({ page }) => {
      const critter = await createTestCritter(page, { strength: 50 });
      await addCritterToMound(page, 'maleMound', critter);

      await page.evaluate(() => {
        window.game.Move('Worker', 'Farm', null, {});
        window.game.UpdateProduction();
      });

      const baseProduction = await getObservable(page, 'grassPerSecondRaw');

      // Apply 20% bonus
      await setObservable(page, 'bonusFarmPercent', 20);
      await page.evaluate(() => {
        window.game.UpdateProduction();
      });

      const bonusProduction = await getObservable(page, 'grassPerSecondRaw');

      // Production should increase by ~20%
      expect(bonusProduction).toBeGreaterThan(baseProduction);
      expect(bonusProduction).toBeCloseTo(baseProduction * 1.2, 0);
    });
  });
});
