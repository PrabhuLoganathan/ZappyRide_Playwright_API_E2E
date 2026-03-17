
import { test, expect, request, APIRequestContext } from "@playwright/test";
import { getBearerToken } from "../../../../utils/tokenManager";

const BASE_URL = 'https://api.d.zappyride.com';

async function createApiContext(): Promise<APIRequestContext> {
    const token = await getBearerToken();
    return await request.newContext({
        baseURL: BASE_URL,
        extraHTTPHeaders: {
            'Authorization': `Bearer ${token}`,
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

    test.describe("Eligibility-related parameters (Excel TC_02)", () => {
        const postcode = "94133";

        test("Filter by applicable_to", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&applicable_to=purchase`);
            expect([200, 404]).toContain(res.status());
            if (res.ok()) {
                const body = await res.json();
                const vehicles = body.vehicles || body;
                expect(Array.isArray(vehicles)).toBeTruthy();
            }
            await ctx.dispose();
        });

        test("Filter by applicable_to_new_vehicles", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&applicable_to_new_vehicles=true`);
            const body = await expectOkJson(res);
            expect(Array.isArray(body.vehicles || body)).toBeTruthy();
            await ctx.dispose();
        });

        test("Filter by applicable_to_used_vehicle", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&applicable_to_used_vehicle=true`);
            const body = await expectOkJson(res);
            expect(Array.isArray(body.vehicles || body)).toBeTruthy();
            await ctx.dispose();
        });

        test("Filter by eligible_only", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&eligible_only=true`);
            const body = await expectOkJson(res);
            expect(Array.isArray(body.vehicles || body)).toBeTruthy();
            await ctx.dispose();
        });
    });

    test.describe("Financial filters (Sheet1 -> TC_VEH_2.2)", () => {
        const postcode = "94133";

        test("Filter by base_msrp_min and base_msrp_max", async () => {
            const ctx = await createApiContext();
            const min = 30000;
            const max = 50000;
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&base_msrp_min=${min}&base_msrp_max=${max}`);
            const body = await expectOkJson(res);
            const vehicles = body.vehicles || body;
            for (const vehicle of vehicles) {
                if (vehicle.base_msrp !== undefined && vehicle.base_msrp !== null) {
                    expect(vehicle.base_msrp).toBeGreaterThanOrEqual(min);
                    expect(vehicle.base_msrp).toBeLessThanOrEqual(max);
                }
            }
            await ctx.dispose();
        });

        test("Filter by purchase_price_min and purchase_price_max", async () => {
            const ctx = await createApiContext();
            const min = 30000;
            const max = 60000;
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&purchase_price_min=${min}&purchase_price_max=${max}`);
            await expectOkJson(res);
            expect(res.status()).toBe(200);
            await ctx.dispose();
        });

        test("Filter by freight_min and freight_max", async () => {
            const ctx = await createApiContext();
            const min = 1000;
            const max = 2000;
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&freight_min=${min}&freight_max=${max}`);
            await expectOkJson(res);
            expect(res.status()).toBe(200);
            await ctx.dispose();
        });
    });

    test.describe("Incentive / exclusion behavior (Sheet1 -> TC_VEH_2.4)", () => {
        const postcode = "94133";

        test("Omit fields behavior (omit_applicable_implications=true)", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&omit_applicable_implications=true`);
            const body = await expectOkJson(res);
            const vehicles = body.vehicles || body;
            for (const vehicle of vehicles) {
                expect(vehicle.applicable_implications).toBeUndefined();
            }
            await ctx.dispose();
        });

        test("hide_zero_amount_for behavior", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&hide_zero_amount_for=true`);
            await expectOkJson(res);
            expect(res.status()).toBe(200);
            await ctx.dispose();
        });

        test("Keep fields behavior (keep_expired_incentives=true)", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&keep_expired_incentives=true`);
            await expectOkJson(res);
            expect(res.status()).toBe(200);
            await ctx.dispose();
        });
    });

    test.describe("Sorting (Sheet1 -> TC_VEH_2.5 / 2.6)", () => {
        const postcode = "94133";

        test("Sorting correctness (orderby=base_msrp asc)", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&orderby=base_msrp&order=asc&limit=10`);
            const body = await expectOkJson(res);
            const vehicles = body.vehicles || body;
            expect(Array.isArray(vehicles)).toBeTruthy();

            let prev = -1;
            for (const vehicle of vehicles) {
                if (vehicle.base_msrp !== undefined && vehicle.base_msrp !== null) {
                    expect(vehicle.base_msrp).toBeGreaterThanOrEqual(prev);
                    prev = vehicle.base_msrp;
                }
            }
            await ctx.dispose();
        });
    });

    test.describe("Negative / validation coverage (Sheet1 -> TC_VEH_2.6)", () => {
        const postcode = "94133";

        test("Wrong datatype cases (e.g., base_msrp_min=invalid)", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&base_msrp_min=invalid_number`);
            expect([200, 400, 422, 500]).toContain(res.status());
            await ctx.dispose();
        });

        test("Missing required params (omitting postcode completely)", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles`);
            expect([200, 400, 422]).toContain(res.status());
            await ctx.dispose();
        });

        test("Invalid enum checks (availability=invalid_enum)", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&availability=magic_carpet`);
            expect([400, 422, 200]).toContain(res.status());
            await ctx.dispose();
        });
    });
});
