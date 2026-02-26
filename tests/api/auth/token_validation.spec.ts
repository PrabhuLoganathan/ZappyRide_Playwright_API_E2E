import { test, expect } from "@playwright/test";

test.describe("Token Validation & Generation Tests", () => {

    // We get the endpoint from the env or fallback to /auth/login
    // Construct the full URL since baseURL is not globally defined
    const baseUrl = process.env.BASE_URL || 'https://api.d.zappyride.com';
    const loginEndpoint = process.env.LOGIN_ENDPOINT || '/auth/login';
    const fullLoginUrl = `${baseUrl}${loginEndpoint}`;

    test("TC_AUTH_01: Successfully generate a Bearer token with valid credentials", async ({ request }) => {
        // We skip this test if the actual valid credentials are not populated in the .env file yet.
        test.skip(!process.env.LOGIN_USERNAME || !process.env.LOGIN_PASSWORD, "Valid credentials (LOGIN_USERNAME/PASSWORD) are not configured in .env");

        const response = await request.post(fullLoginUrl, {
            data: {
                username: process.env.LOGIN_USERNAME,
                password: process.env.LOGIN_PASSWORD,
            }
        });

        // The auth endpoint should return a 200 OK
        expect(response.status()).toBe(200);

        const body = await response.json();
        const token = body.access_token || body.token;

        // Assert that a token is successfully generated and returned
        expect(token).toBeTruthy();
        expect(typeof token).toBe('string');

        console.log("Token successfully generated:", token.substring(0, 10) + "...");
    });

    test("TC_AUTH_02: Fail to generate a token with invalid password", async ({ request }) => {
        test.skip(!process.env.LOGIN_USERNAME, "LOGIN_USERNAME is not configured in .env");

        const response = await request.post(fullLoginUrl, {
            data: {
                username: process.env.LOGIN_USERNAME,
                password: "invalid_password_123!",
            }
        });

        // Typically, auth endpoints return a 401 Unauthorized or 403 Forbidden for bad credentials
        expect([400, 401, 403]).toContain(response.status());
    });

    test("TC_AUTH_03: Fail to generate a token with invalid/non-existent username", async ({ request }) => {
        const response = await request.post(fullLoginUrl, {
            data: {
                username: "non_existent_user_999",
                password: "some_password",
            }
        });

        expect([400, 401, 403, 404]).toContain(response.status());
    });

    test("TC_AUTH_04: Fail to generate a token with empty/missing credentials", async ({ request }) => {
        const response = await request.post(fullLoginUrl, {
            data: {}
        });

        // Typically returns a 400 Bad Request or 422 Unprocessable Entity, but sometimes 404
        expect([400, 401, 422, 404]).toContain(response.status());
    });

});
