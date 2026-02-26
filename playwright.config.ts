import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// By default we can load a beta environment or allow cross-env from CLI
dotenv.config({ path: path.resolve(__dirname, '.env.beta') });

export default defineConfig({
  testDir: './tests/api',
  /* Maximum time one test can run for. */
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['list'],
    // ['allure-playwright'] // Assuming allure is installed later
  ],
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major API environments/clients */
  // projects: [
  //   {
  //     name: 'api-ev-shopper-beta',
  //     testDir: './tests/api/ev-shopper',
  //     use: {
  //       baseURL: process.env.BETA_EV_SHOPPER_URL || 'https://api.beta.zappyride.com/ev-shopper',
  //       // Example context applying specific client data
  //     },
  //   },
  //   {
  //     name: 'api-ev-decide-beta',
  //     testDir: './tests/api/ev-decide',
  //     use: {
  //       baseURL: process.env.BETA_EV_DECIDE_URL || 'https://api.beta.zappyride.com/ev-decide',
  //     },
  //   },
  //   {
  //     name: 'api-ev-fleets-premium',
  //     testDir: './tests/api/ev-fleets',
  //     use: {
  //       baseURL: process.env.PREMIUM_FLEETS_URL || 'https://api.premium.zappyride.com/fleets',
  //     },
  //   }
  //   // Additional domain models as needed...
  // ],
});