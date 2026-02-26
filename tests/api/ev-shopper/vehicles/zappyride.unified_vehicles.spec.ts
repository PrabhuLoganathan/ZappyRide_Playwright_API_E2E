import { test, expect } from "@playwright/test";
import { getBearerToken } from "../../../../utils/tokenManager";

test.describe("Unified Vehicles API Tests", () => {
    test("GET /unified-vehicles with postcode 94044", async ({ request }) => {
        const token = await getBearerToken();
        const response = await request.get("https://api.d.zappyride.com/unified-vehicles", {
            params: {
                postcode: "94044",
            },
            headers: {
                Authorization: `Bearer ${token}`,
                "X-Force-JDP-Data": "0",
                "X-Jdp-Client-Id": "0",
                "X-Silent-Auth": "123",
                "User-Agent": "PostmanRuntime/7.51.1",
                Accept: "*/*",
            },
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toBeTruthy();
        expect(typeof body.total).toBe("number");
        expect(body.vehicles).toBeInstanceOf(Array);
    });

    test("GET /unified-vehicles with extra_fields and fuel_type", async ({ request }) => {
        const token = await getBearerToken();
        const response = await request.get("https://api.d.zappyride.com/unified-vehicles", {
            params: {
                include_extra_fields: "equivalent_gas_vehicle",
                postcode: "94044",
                internal_vehicle_fuel_type: "ev"
            },
            headers: {
                Authorization: `Bearer ${token}`,
                "X-Force-JDP-Data": "0",
                "X-Jdp-Client-Id": "0",
                "X-Silent-Auth": "123",
                "User-Agent": "PostmanRuntime/7.51.1",
                Accept: "*/*",
            },
        });

        expect(response.status()).toBe(200);
        const body = await response.json();

        // Assert top-level structure
        expect(body).toBeTruthy();
        expect(typeof body.total).toBe("number");
        expect(Array.isArray(body.vehicles)).toBe(true);
        expect(body.vehicles.length).toBeGreaterThan(0);

        // Validate vehicle level structure for requested fields
        const sampleVehicle = body.vehicles[0];

        // Check for basic fields that are returned
        expect(sampleVehicle).toHaveProperty("internal_id");
        expect(sampleVehicle).toHaveProperty("make");
        expect(sampleVehicle).toHaveProperty("model");

        let hasEquivalentGasVehicle = false;

        for (const vehicle of body.vehicles) {
            // Assert that internal_vehicle_fuel_type is strictly 'ev'
            expect(vehicle.internal_vehicle_fuel_type).toBe("ev");

            // Check if the requested extra field `equivalent_gas_vehicle` is present and well-formed
            if (vehicle.equivalent_gas_vehicle) {
                hasEquivalentGasVehicle = true;
                const egv = vehicle.equivalent_gas_vehicle;
                expect(egv).toHaveProperty("make");
                expect(egv).toHaveProperty("model");
                if (egv.msrp !== null) expect(typeof egv.msrp).toBe("number");
                if (egv.handle !== null) expect(typeof egv.handle).toBe("string");
            }
        }

        // Ensure at least one vehicle returned the extra field to validate it indeed works
        expect(hasEquivalentGasVehicle).toBe(true);
    });
});
