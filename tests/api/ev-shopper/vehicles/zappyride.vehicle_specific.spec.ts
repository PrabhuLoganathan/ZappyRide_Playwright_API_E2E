import { test, expect } from "@playwright/test";
import { getBearerToken } from "../../../../utils/tokenManager";

const BASE_URL = process.env.BASE_URL || 'https://api.beta.zappyride.com';

test("GET /vehicles with postcode 94044", async ({ request }) => {
    const token = await getBearerToken();
    const response = await request.get(`${BASE_URL}/vehicles`, {
        params: {
            postcode: "94044",
        },
        headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": "PostmanRuntime/7.51.1",
            Accept: "*/*",
        },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    console.log(JSON.stringify(body, null, 2));
    const vehicles = body.vehicles || body;
    expect(Array.isArray(vehicles)).toBeTruthy();
    expect(vehicles.length).toBeGreaterThan(0);
});
