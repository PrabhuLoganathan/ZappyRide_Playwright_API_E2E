import { test, expect } from '@playwright/test';

test('Standalone - Generate Access Token', async ({ page }) => {
    // 1. Hardcoded Configuration
    const targetUrl = 'https://qa-evdeploy.saas.d.zappyride.com/?clientDomain=calstart-evdeploy.saas.d.zappyride.com';
    const userName = 'minh.vu@jdpa.com';
    const password = 'Password!123';
    const cognitoClientId = '66hj632qh0hp0oekn4uv5o3dhm';

    // 2. Navigate to the App
    await page.goto(targetUrl);
    await page.waitForTimeout(2000); // Allow time for the page to initialize

    // 3. Click 'Begin your journey' on the Hero Banner
    const beginJourneyBtn = page.locator('[data-testid="get-started-button"]');
    await beginJourneyBtn.waitFor({ state: "visible" });
    await beginJourneyBtn.click();
    await page.waitForTimeout(1000); // Allow modal/login form to animate in

    // 4. Fill in Username
    const usernameInput = page.locator('form > fieldset > div > div:nth-child(2) > div > div > input');
    await usernameInput.click();
    await usernameInput.fill(userName);

    // 5. Fill in Password
    const passwordInput = page.locator('form > fieldset > div > div > div > div > div > input');
    await passwordInput.click();
    await passwordInput.fill(password);

    // 6. Click 'Sign In' Button
    const signInBtn = page.locator('form > fieldset > div > div.MuiStack-root > button');
    await signInBtn.click();
    await page.waitForTimeout(4000); // Wait for the login to complete and token to be set in localStorage

    // 7. Extract the Access Token from LocalStorage
    const localStorageKey = `CognitoIdentityServiceProvider.${cognitoClientId}.${userName}.accessToken`;

    const accessToken = await page.evaluate((key) => localStorage.getItem(key), localStorageKey);

    // Ensure we actually got a token back
    expect(accessToken).not.toBeNull();

    // 8. Output the Token
    console.log("\n========================================================");
    console.log("🔑 GENERATED ACCESS TOKEN 🔑");
    console.log("========================================================");
    console.log(accessToken);
    console.log("========================================================\n");
});
