
import { test, expect, request, APIRequestContext } from "@playwright/test";
import { getBearerToken } from "../../../../utils/tokenManager";

const BASE_URL = 'https://api.d.zappyride.com';

async function createApiContext(): Promise<APIRequestContext> {
    const token = await getBearerToken();
    return await request.newContext({
        baseURL: BASE_URL,
        extraHTTPHeaders: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'PostmanRuntime/7.51.1',
            'Accept': '*/*'
        }
    });
}

// Wrapper to maintain compatibility with existing test calls
async function apiGet(ctx: APIRequestContext, url: string) {
    return await ctx.get(url);
}

async function expectOkJson(res: any) {
    if (!res.ok()) {
        console.log(`Request failed with status ${res.status()}`);
        console.log(await res.text());
    }
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    return body;
}

test.describe("Vehicles RTM API Tests", () => {

    test("TC_01: Verify successful response with required parameters", async () => {
        const ctx = await createApiContext();
        const postcode = "94044";
        const taxFilingType = "single";

        const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&tax_filing_type=${taxFilingType}`);
        const body = await expectOkJson(res);

        // Response should be a valid JSON object (handled by expectOkJson)
        // Structure might be { vehicles: [...] } or just [...]
        const vehicles = body.vehicles || body;
        expect(Array.isArray(vehicles)).toBeTruthy();

        await ctx.dispose();
    });

    test("TC_02: Verify vehicles list is not empty", async () => {
        const ctx = await createApiContext();
        const postcode = "94044";
        const taxFilingType = "single";

        const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&tax_filing_type=${taxFilingType}`);
        const body = await expectOkJson(res);
        const vehicles = body.vehicles || body;

        expect(vehicles.length).toBeGreaterThan(0);

        await ctx.dispose();
    });

    test("TC_03: Verify only EV fuels returned", async () => {
        const ctx = await createApiContext();
        const postcode = "94044";
        const taxFilingType = "single";

        const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&tax_filing_type=${taxFilingType}`);
        const body = await expectOkJson(res);
        const vehicles = body.vehicles || body;

        const allowedFuels = ["BEV", "PHEV", "FCEV"];
        for (const vehicle of vehicles) {
            expect(allowedFuels).toContain(vehicle.fuel);
        }

        await ctx.dispose();
    });

    test("TC_04: Filter by make and model_year", async () => {
        const ctx = await createApiContext();
        const postcode = "94044";
        const taxFilingType = "single";
        const make = "Tesla";
        const modelYear = "2025"; // Assuming 2025 is a valid model year for testing, adjust if needed

        const res = await apiGet(
            ctx,
            `/vehicles?postcode=${postcode}&tax_filing_type=${taxFilingType}&make=${make}&model_year=${modelYear}`
        );
        const body = await expectOkJson(res);
        const vehicles = body.vehicles || body;

        // It's possible to get 0 results if no 2025 Teslas exist yet/anymore, 
        // but the test specifically asks to "Assert make=Tesla and model_year=2025 for all items"
        // So if items strictly exist, they must match.
        for (const vehicle of vehicles) {
            expect(vehicle.make).toBe(make);
            // model_year might be a number or string in response
            expect(String(vehicle.model_year)).toBe(modelYear);
        }

        await ctx.dispose();
    });

    test("TC_05: Pagination (limit and offset)", async () => {
        const ctx = await createApiContext();
        const postcode = "94044";
        const taxFilingType = "single";

        // Page 1
        const res1 = await apiGet(
            ctx,
            `/vehicles?postcode=${postcode}&tax_filing_type=${taxFilingType}&limit=5&offset=0`
        );
        const body1 = await expectOkJson(res1);
        const vehicles1 = body1.vehicles || body1;
        expect(vehicles1.length).toBeLessThanOrEqual(5);

        // Page 2
        const res2 = await apiGet(
            ctx,
            `/vehicles?postcode=${postcode}&tax_filing_type=${taxFilingType}&limit=5&offset=5`
        );
        const body2 = await expectOkJson(res2);
        const vehicles2 = body2.vehicles || body2;

        if (vehicles1.length > 0 && vehicles2.length > 0) {
            // Compare IDs or Handles
            const ids1 = vehicles1.map((v: any) => v.id || v.handle);
            const ids2 = vehicles2.map((v: any) => v.id || v.handle);

            // Sets should be disjoint
            for (const id of ids1) {
                expect(ids2).not.toContain(id);
            }
        }

        await ctx.dispose();
    });

    test("TC_06: Verify response without tax_filing_type (optional)", async () => {
        const ctx = await createApiContext();
        const postcode = "94044";

        const res = await apiGet(ctx, `/vehicles?postcode=${postcode}`);
        // Expecting 200 OK (parameter is optional)
        expect(res.status()).toBe(200);

        await ctx.dispose();
    });

    test("TC_07: Invalid tax_filing_type enum", async () => {
        const ctx = await createApiContext();
        const postcode = "94044";
        const invalidTaxFiling = "invalid_value";

        const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&tax_filing_type=${invalidTaxFiling}`);
        // Expecting 400 Bad Request or 404 Not Found
        expect([400, 404]).toContain(res.status());

        await ctx.dispose();
    });

    test.describe("Parameter Filtering Tests (Sheet1 RTM)", () => {
        const postcode = "94133";

        test("TC_02: availability filter = released,pre-order", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&availability=released,pre-order`);
            const body = await expectOkJson(res);
            const vehicles = body.vehicles || body;
            const allowed = ["released", "pre-order"];
            for (const vehicle of vehicles) {
                if (vehicle.availability) {
                    expect(allowed).toContain(vehicle.availability.toLowerCase());
                }
            }
            await ctx.dispose();
        });

        test("TC_03: electric_range filter = 300", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&electric_range=300`);
            const body = await expectOkJson(res);
            const vehicles = body.vehicles || body;
            for (const vehicle of vehicles) {
                if (vehicle.electric_range !== undefined && vehicle.electric_range !== null) {
                    expect(vehicle.electric_range).toBeGreaterThanOrEqual(300);
                }
            }
            await ctx.dispose();
        });

        test("TC_04: form_factor filter = sedan,suv", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&form_factor=sedan,suv`);
            const body = await expectOkJson(res);
            const vehicles = body.vehicles || body;
            const allowed = ["sedan", "suv"];
            for (const vehicle of vehicles) {
                if (vehicle.form_factor) {
                    const formFactor = Array.isArray(vehicle.form_factor) ? vehicle.form_factor : [vehicle.form_factor];
                    const hasMatch = formFactor.some((f: string) => allowed.some(a => f.toLowerCase().includes(a)));
                    expect(hasMatch).toBe(true);
                }
            }
            await ctx.dispose();
        });

        test("TC_05: fuel_type filter = bev", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&fuel_type=bev`);
            const body = await expectOkJson(res);
            const vehicles = body.vehicles || body;
            for (const vehicle of vehicles) {
                const fuel = vehicle.internal_vehicle_fuel_type || vehicle.fuel_type || vehicle.fuel;
                if (fuel) {
                    expect(fuel.toLowerCase()).toBe("bev");
                }
            }
            await ctx.dispose();
        });

        test("TC_06: fuel_type filter = gas", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&fuel_type=gas`);
            const body = await expectOkJson(res);
            const vehicles = body.vehicles || body;
            for (const vehicle of vehicles) {
                const fuel = vehicle.internal_vehicle_fuel_type || vehicle.fuel_type || vehicle.fuel;
                if (fuel) {
                    expect(fuel.toLowerCase()).toBe("gas");
                }
            }
            await ctx.dispose();
        });

        test("TC_07: include_used_vehicles filter", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&include_used_vehicles=true`);
            const body = await expectOkJson(res);
            const vehicles = body.vehicles || body;
            expect(Array.isArray(vehicles)).toBeTruthy();
            await ctx.dispose();
        });

        test("TC_08: make filter = ford,chevrolet", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&make=ford,chevrolet`);
            const body = await expectOkJson(res);
            const vehicles = body.vehicles || body;
            const allowed = ["ford", "chevrolet"];
            for (const vehicle of vehicles) {
                if (vehicle.make) {
                    expect(allowed).toContain(vehicle.make.toLowerCase());
                }
            }
            await ctx.dispose();
        });

        test("TC_09: model filter = 3", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&model=3`);
            const body = await expectOkJson(res);
            const vehicles = body.vehicles || body;
            for (const vehicle of vehicles) {
                if (vehicle.model) {
                    expect(vehicle.model.toString().toLowerCase()).toContain("3");
                }
            }
            await ctx.dispose();
        });

        test("TC_10: model_year filter = 2020,2021", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&model_year=2020,2021`);
            const body = await expectOkJson(res);
            const vehicles = body.vehicles || body;
            const allowed = [2020, 2021, "2020", "2021"];
            for (const vehicle of vehicles) {
                if (vehicle.model_year) {
                    expect(allowed).toContain(vehicle.model_year);
                }
            }
            await ctx.dispose();
        });

        test("TC_11: total_range filter = 300", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&total_range=300`);
            const body = await expectOkJson(res);
            const vehicles = body.vehicles || body;
            for (const vehicle of vehicles) {
                if (vehicle.total_range !== undefined && vehicle.total_range !== null) {
                    expect(vehicle.total_range).toBeGreaterThanOrEqual(300);
                }
            }
            await ctx.dispose();
        });

        test("with_ids filter = specific vehicles", async () => {
            const ctx = await createApiContext();
            const handle1 = "Tesla_Model_3_Long_Range_AWD_BEV_2021";
            const handle2 = "Volkswagen_ID.4__BEV_2021";
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&with_ids=${handle1},${handle2}`);
            const body = await expectOkJson(res);
            const vehicles = body.vehicles || body;
            const allowed = [handle1, handle2];
            for (const vehicle of vehicles) {
                const id = vehicle.handle || vehicle.id || vehicle.internal_id;
                if (id) {
                    expect(allowed).toContain(id);
                }
            }
            await ctx.dispose();
        });
    });
});
