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
        // Step 1: Retrieve authentication token for the API request
        const token = await getBearerToken();

        // Step 2: Make a GET request to the unified-vehicles endpoint with specific query parameters
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

        // Step 3: Verify that the API responds with a 200 OK status code
        expect(response.status()).toBe(200);

        // Parse the JSON response body
        const body = await response.json();

        // Step 4: Assert top-level response structure
        // Verify response is not null/undefined and contains valid total count and vehicles array
        expect(body).toBeTruthy();
        expect(typeof body.total).toBe("number");
        expect(Array.isArray(body.vehicles)).toBe(true);
        expect(body.vehicles.length).toBeGreaterThan(0);

        // Step 5: Validate the core structure of individual vehicles
        // Extract a sample vehicle to check for required baseline properties
        const sampleVehicle = body.vehicles[0];

        // Ensure basic fields (internal_id, make, model) are present in the vehicle object
        expect(sampleVehicle).toHaveProperty("internal_id");
        expect(sampleVehicle).toHaveProperty("make");
        expect(sampleVehicle).toHaveProperty("model");

        let hasEquivalentGasVehicle = false;

        // Step 6: Iterate through the returned vehicles to validate specific constraints
        for (const vehicle of body.vehicles) {
            // Verify that all returned vehicles strictly match requested fuel type ('ev')
            expect(vehicle.internal_vehicle_fuel_type).toBe("ev");

            // Evaluate the inclusion of the optionally requested `equivalent_gas_vehicle` field
            if (vehicle.equivalent_gas_vehicle) {
                hasEquivalentGasVehicle = true;
                const egv = vehicle.equivalent_gas_vehicle;

                // Assert nested structure of the equivalent_gas_vehicle object
                expect(egv).toHaveProperty("make");
                expect(egv).toHaveProperty("model");

                // Validate optional nested fields if they are populated
                if (egv.msrp !== null) expect(typeof egv.msrp).toBe("number");
                if (egv.handle !== null) expect(typeof egv.handle).toBe("string");
            }
        }

        // Step 7: Final Validation
        // Ensure that the extra field request worked by verifying at least one vehicle has the equivalent_gas_vehicle data
        expect(hasEquivalentGasVehicle).toBe(true);
    });

    test("GET /unified-vehicles/aggregate by make", async ({ request }) => {
        // Step 1: Retrieve authentication token
        const token = await getBearerToken();

        // Step 2: Make GET request to the aggregate endpoint
        const response = await request.get("https://api.d.zappyride.com/unified-vehicles/aggregate", {
            params: {
                attrId: "make",
                attrLabel: "make",
                labelTemplate: "Make: __make__"
            },
            headers: {
                Authorization: `Bearer ${token}`,
                "User-Agent": "PostmanRuntime/7.51.1",
                Accept: "*/*",
            },
        });

        // Step 3: Verify successful status code
        expect(response.status()).toBe(200);

        // Step 4: Parse response body
        const body = await response.json();

        // Step 5: Assert top-level structure
        expect(body).toBeTruthy();
        expect(body.code).toBe(200);
        expect(body.message).toBe(""); // Ensure message is typically empty string on success
        expect(Array.isArray(body.vehicles)).toBe(true);
        expect(body.vehicles.length).toBeGreaterThan(0);

        // Step 6: Validate structure of individual make aggregations
        const sampleMake = body.vehicles[0];
        expect(sampleMake).toHaveProperty("id");
        expect(sampleMake).toHaveProperty("label");

        // Step 7: Verify all items have expected structure and label formatting
        for (const item of body.vehicles) {
            expect(typeof item.id).toBe("string");
            expect(typeof item.label).toBe("string");

            // Validate the labelTemplate was applied correctly
            expect(item.label).toBe(`Make: ${item.id}`);
        }
    });
});
