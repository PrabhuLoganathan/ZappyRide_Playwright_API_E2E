import { test as baseTest, request, APIRequestContext } from '@playwright/test';
import { BaseApi } from './BaseApi';

// Define the types of fixtures we provide
type ApiFixtures = {
    apiContext: APIRequestContext;
    baseApi: BaseApi;
    // Examples of specific domain APIs that could be added in the future:
    // incentivesApi: IncentivesApi;
    // projectsApi: ProjectsApi;
};

// Extend the base test with our API fixtures
export const test = baseTest.extend<ApiFixtures>({
    // Override the default API context to apply custom global settings if needed
    apiContext: async ({ }, use) => {
        const context = await request.newContext({
            baseURL: process.env.API_BASE_URL,
            extraHTTPHeaders: {
                'Content-Type': 'application/json',
            }
        });

        // Provide the context to the test
        await use(context);

        // Cleanup after test
        await context.dispose();
    },

    // Provide a generic BaseApi instance
    baseApi: async ({ apiContext }, use) => {
        const api = new BaseApi(apiContext);
        await use(api);
    },

    /* 
    // Example of how to add domain-specific APIs:
    
    incentivesApi: async ({ apiContext }, use) => {
      const api = new IncentivesApi(apiContext);
      await use(api);
    },
    */
});

export { expect } from '@playwright/test';
