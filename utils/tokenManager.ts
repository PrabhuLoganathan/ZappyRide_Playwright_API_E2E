import { request } from "@playwright/test";

let cachedToken: string | null = null;
let expiryTime: number = 0;

export async function getBearerToken(): Promise<string> {
    const now = Date.now();

    // Return the cached token if it exists and hasn't expired
    if (cachedToken && now < expiryTime) {
        return cachedToken;
    }

    // In Playwright tests, if a global token is already set in the env via a CLI variable we can use it
    // But since you want dynamic generation...

    // We check if the user has provided the required env variables for dynamic generation
    const loginEndpoint = process.env.LOGIN_ENDPOINT || '/auth/login';
    const username = process.env.LOGIN_USERNAME;
    const password = process.env.LOGIN_PASSWORD;

    if (!username || !password) {
        // Fallback: If no credentials are provided, return the static token from env if it exists (for backward compatibility)
        if (process.env.TOKEN) {
            console.warn("LOGIN_USERNAME and LOGIN_PASSWORD are not set in .env. Falling back to the static TOKEN env var.");
            return process.env.TOKEN;
        }
        throw new Error("Missing LOGIN_USERNAME and LOGIN_PASSWORD environment variables for generating the Bearer token.");
    }

    const apiContext = await request.newContext({
        baseURL: process.env.BASE_URL || 'https://api.d.zappyride.com',
    });

    console.log(`Generating a new Bearer token dynamically at ${loginEndpoint}...`);
    const response = await apiContext.post(loginEndpoint, {
        data: {
            username: username,
            password: password,
        },
    });

    if (!response.ok()) {
        throw new Error(`Failed to generate token from ${loginEndpoint}. Status: ${response.status()} - ${await response.text()}`);
    }

    const body = await response.json();

    // Most login endpoints return access_token or token inside the response JSON
    cachedToken = body.access_token || body.token;

    if (!cachedToken) {
        throw new Error(`Token not found in the response body. Body: ${JSON.stringify(body)}`);
    }

    // Assume the token expires in 15 minutes by default if expires_in is not provided in seconds
    const expiresInSeconds = body.expires_in || 900;
    expiryTime = now + (expiresInSeconds * 1000);

    // Also close the unused context
    await apiContext.dispose();

    return cachedToken;
}
