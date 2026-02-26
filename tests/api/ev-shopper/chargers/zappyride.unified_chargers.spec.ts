import { test, expect } from "@playwright/test";
import { getBearerToken } from "../../../../utils/tokenManager";

test("GET /unified-chargers", async ({ request }) => {
    const token = await getBearerToken();
    const response = await request.get("https://api.d.zappyride.com/unified-chargers", {
        headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": "PostmanRuntime/7.51.1",
            Accept: "*/*",
        },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    console.log(JSON.stringify(body, null, 2));
    expect(body).toBeTruthy();
});
