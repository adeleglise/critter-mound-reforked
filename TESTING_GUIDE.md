# Critter Mound - Testing Guide

This guide explains how to use the comprehensive Playwright test suite for the Critter Mound game.

## Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Run all tests
npm test

# Run with interactive UI
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Run specific test file
npm test -- tests/breeding.spec.js

# Debug a specific test
npm run test:debug
```

## Test Suite Overview

### Test Files (202 Total Tests)

| File | Tests | Purpose |
|------|-------|---------|
| `tests/smoke.spec.js` | 8 | Basic functionality verification |
| `tests/breeding.spec.js` | 16 | Breeding system, traits, mutations |
| `tests/ui.spec.js` | 21 | UI interactions, dark mode, tabs |
| `tests/resources.spec.js` | 33 | Resource production & management |
| `tests/workers.spec.js` | 36 | Worker assignments & efficiency |
| `tests/combat.spec.js` | 22 | Army, levels, battles |
| `tests/prestige.spec.js` | 31 | Heir system & prestige mechanics |
| `tests/save-load.spec.js` | 35 | Save/load & state persistence |

## Helper Functions

All helper utilities are in `tests/fixtures/game-helpers.js`:

### Core Helpers

```javascript
import {
  waitForGameInit,      // Wait for Knockout bindings
  clearGameState,       // Clear localStorage
  fastForward,          // Simulate game time
  getObservable,        // Read game state
  setObservable,        // Set game state
  navigateToTab,        // Switch tabs
  toggleDarkMode,       // Toggle theme
  selectCritter,        // Click critter
  lockCritter,          // Shift+click critter
  breedCritters,        // Trigger breeding
  getMound,             // Get mound data
  getSaveData,          // Export save
  loadSaveData          // Import save
} from './fixtures/game-helpers.js';
```

### Example Test

```javascript
import { test, expect } from '@playwright/test';
import { waitForGameInit, clearGameState, fastForward } from './fixtures/game-helpers.js';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);
  });

  test('should do something', async ({ page }) => {
    // Fast-forward 10 seconds of game time
    await fastForward(page, 10);

    // Check game state
    const dirt = await getObservable(page, 'dirt');
    expect(dirt).toBeGreaterThan(0);
  });
});
```

## Running Specific Tests

```bash
# Run smoke tests only
npm test -- tests/smoke.spec.js

# Run breeding and UI tests
npm test -- tests/breeding.spec.js tests/ui.spec.js

# Run tests matching pattern
npm test -- --grep "breeding"

# Run in specific browser
npm test -- --project=chromium
```

## Debugging Tests

### UI Mode (Recommended)
```bash
npm run test:ui
```
- Interactive test runner
- Step through tests
- Time travel debugging
- View screenshots/videos

### Headed Mode
```bash
npm run test:headed
```
- See browser actions in real-time
- Useful for debugging UI issues

### Debug Mode
```bash
npm run test:debug
```
- Pause before each action
- Inspector opens automatically
- Step-by-step execution

### VSCode Debugging
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Playwright Debug",
  "program": "${workspaceFolder}/node_modules/.bin/playwright",
  "args": ["test", "--debug"]
}
```

## Test Reports

### HTML Report
```bash
npm run test:report
```
Opens interactive HTML report with:
- Test results
- Screenshots
- Videos
- Traces

### JSON Report
Located at `test-results/results.json`

## CI/CD Integration

### GitHub Actions

```yaml
name: Playwright Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      - name: Run tests
        run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Writing New Tests

### Test Structure

```javascript
import { test, expect } from '@playwright/test';
import { waitForGameInit, clearGameState } from './fixtures/game-helpers.js';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page, context }) => {
    // Setup fresh state
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await clearGameState(page);
    await page.reload();
    await waitForGameInit(page);
  });

  test('should do X when Y', async ({ page }) => {
    // Arrange
    const initialValue = await getObservable(page, 'dirt');

    // Act
    await fastForward(page, 10);

    // Assert
    const newValue = await getObservable(page, 'dirt');
    expect(newValue).toBeGreaterThan(initialValue);
  });
});
```

### Best Practices

1. **Independent Tests** - Each test should run in isolation
2. **Fresh State** - Clear localStorage in beforeEach
3. **Descriptive Names** - Use "should X when Y" format
4. **Use Helpers** - Don't duplicate code
5. **Fast Forward** - Use `fastForward()` instead of waiting
6. **Check Errors** - Monitor console for errors
7. **Clean Assertions** - One logical assertion per test

### Common Patterns

#### Testing Resource Production
```javascript
test('should produce dirt over time', async ({ page }) => {
  const initial = await getObservable(page, 'dirt');
  await fastForward(page, 10);
  const final = await getObservable(page, 'dirt');
  expect(final).toBeGreaterThan(initial);
});
```

#### Testing Breeding
```javascript
test('should breed critters', async ({ page }) => {
  const initialGen = await getObservable(page, 'generations');
  await breedCritters(page);
  const newGen = await getObservable(page, 'generations');
  expect(newGen).toBe(initialGen + 1);
});
```

#### Testing Save/Load
```javascript
test('should preserve state', async ({ page }) => {
  await setObservable(page, 'dirt', 1000);
  const saveData = await getSaveData(page);

  await page.reload();
  await waitForGameInit(page);
  await loadSaveData(page, saveData);

  const restored = await getObservable(page, 'dirt');
  expect(restored).toBe(1000);
});
```

## Troubleshooting

### Tests Timeout
- Increase timeout in `playwright.config.js`
- Check if dev server is running
- Use `--headed` to see what's happening

### localStorage Errors
- Ensure `grantPermissions` in beforeEach
- Check that page is loaded before clearing state

### Flaky Tests
- Add proper waits with `waitForGameInit()`
- Use `fastForward()` instead of setTimeout
- Avoid hardcoded delays

### Can't Find Elements
- Use Playwright Inspector: `npm run test:debug`
- Check data-bind attributes
- Verify Knockout bindings are applied

## Configuration

### playwright.config.js

Key settings:
- `baseURL`: http://localhost:3000
- `timeout`: 30000ms (30 seconds)
- `workers`: 7 (parallel execution)
- `retries`: 0 (local), 2 (CI)
- `webServer`: Auto-starts dev server

### Browser Options

Modify `playwright.config.js` to test different browsers:

```javascript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'mobile', use: { ...devices['Pixel 5'] } },
]
```

## Test Coverage

Current coverage:
- ✅ **Core Mechanics**: 100% (breeding, resources, workers)
- ✅ **UI**: 100% (tabs, theme, interactions)
- ✅ **Save/Load**: 100% (localStorage, export/import)
- ⚠️ **Combat**: 68% (some features in development)
- ⚠️ **Prestige**: 61% (some features in development)

See [TEST_REPORT.md](TEST_REPORT.md) for detailed coverage.

## Performance Testing

To test game performance:

```javascript
test('should maintain 60 FPS', async ({ page }) => {
  await page.evaluate(() => {
    let frameCount = 0;
    const fps = [];

    const measureFPS = () => {
      const now = performance.now();
      frameCount++;
      if (frameCount % 60 === 0) {
        fps.push(60000 / (performance.now() - now));
      }
    };

    for (let i = 0; i < 1000; i++) {
      requestAnimationFrame(measureFPS);
    }

    return fps;
  });
});
```

## Accessibility Testing

```javascript
import { injectAxe, checkA11y } from 'axe-playwright';

test('should have no accessibility violations', async ({ page }) => {
  await injectAxe(page);
  await checkA11y(page);
});
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Test Report](TEST_REPORT.md)
- [CLAUDE.md](CLAUDE.md) - Project architecture
- [MODERNIZATION_PLAN.md](MODERNIZATION_PLAN.md) - Future plans

## Support

For issues or questions:
1. Check [TEST_REPORT.md](TEST_REPORT.md) for known issues
2. Run with `--debug` flag for detailed logs
3. Review test helpers in `tests/fixtures/game-helpers.js`
4. Open GitHub issue with test output
