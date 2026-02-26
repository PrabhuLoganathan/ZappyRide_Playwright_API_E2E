import { Page } from '@playwright/test';

// Self-healing helper with a shorter wait timeout per selector
export async function clickWithHealing(page: Page, selectors: string[]) {
    for (const selector of selectors) {
        try {
            console.log(`Trying selector: ${selector}`);
            await page.waitForSelector(selector, { timeout: 2000 }); // reduced to 2000ms per selector
            await page.click(selector);
            await page.click(selector);
            console.log(`Clicked using selector: ${selector}`);
            return selector;
        } catch (err) {
            console.log(`Selector "${selector}" not found. Trying next alternative...`);
        }
    }
    throw new Error(`None of the selectors matched: ${selectors.join(", ")}`);
}

export async function clickDropdownWithHealing(page: Page, selectors: string[]) {
    for (const selector of selectors) {
        try {
            console.log(`Trying selector: ${selector}`);
            await page.waitForSelector(selector, { timeout: 5000 }); // reduced to 2000ms per selector
            await page.click(selector);
            console.log(`Clicked using selector: ${selector}`);
            await page.click(selector); // Click again to close dropdown
            return selector;
        } catch (err) {
            console.log(`Selector "${selector}" not found. Trying next alternative...`);
            await page.click(selector); // Click again to close dropdown
        }
    }
    throw new Error(`None of the selectors matched: ${selectors.join(", ")}`);
}


module.exports = { clickWithHealing };