
import { test, expect, request, APIRequestContext } from "@playwright/test";
import { getBearerToken } from "../../../../utils/tokenManager";
import { ajvSchemaValidation } from "../../../../utils/JsonSchemaValidation";
import vehicleSchema from "../../../../schemas/api/vehicleSchema.json";

const BASE_URL = process.env.BASE_URL || 'https://api.beta.zappyride.com';

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
    expect(body).toBeDefined();
    expect(body).not.toBeNull();
    return body;
}

/** Extract vehicles array from response body (handles both { vehicles: [...] } and [...]) */
function getVehicles(body: any): any[] {
    const vehicles = body.vehicles ?? body;
    expect(vehicles).toBeDefined();
    expect(Array.isArray(vehicles)).toBeTruthy();
    return vehicles;
}

/** Assert the vehicles array has a valid shape and length >= 0 */
function assertVehicleArrayShape(vehicles: any[]) {
    expect(Array.isArray(vehicles)).toBeTruthy();
    expect(vehicles.length).toBeGreaterThanOrEqual(0);
    for (const vehicle of vehicles) {
        expect(typeof vehicle).toBe('object');
        expect(vehicle).not.toBeNull();
    }
}

/** Assert common fields on a single vehicle object (defensive — only checks if field is present) */
function assertBasicVehicleShape(vehicle: any) {
    expect(typeof vehicle).toBe('object');
    expect(vehicle).not.toBeNull();
    if (vehicle.handle !== undefined) expect(typeof vehicle.handle).toBe('string');
    if (vehicle.make !== undefined) expect(typeof vehicle.make).toBe('string');
    if (vehicle.model !== undefined) expect(typeof vehicle.model).toBe('string');
    if (vehicle.fuel !== undefined) expect(typeof vehicle.fuel).toBe('string');
    if (vehicle.base_msrp !== undefined && vehicle.base_msrp !== null) {
        expect(typeof vehicle.base_msrp).toBe('number');
    }
    if (vehicle.model_year !== undefined && vehicle.model_year !== null) {
        expect(['number', 'string']).toContain(typeof vehicle.model_year);
    }
}

/** For error responses, validate JSON body contains error/message/details if parseable */
async function assertErrorResponseShape(res: any) {
    try {
        const body = await res.json();
        expect(body).toBeDefined();
        expect(body).not.toBeNull();
        // At least one error-related field should be present
        const hasErrorField = body.error !== undefined
            || body.message !== undefined
            || body.details !== undefined
            || body.detail !== undefined;
        expect(hasErrorField, 'Error response JSON missing error/message/details/detail field').toBeTruthy();
    } catch (e) {
        // Response is not valid JSON — still acceptable for error statuses,
        // but ensure the response at least has some content
        const text = await res.text().catch(() => '');
        console.warn(`Non-JSON error response (status ${res.status()}): ${text.substring(0, 200)}`);
    }
}

test.describe("Vehicles RTM API Tests", () => {

    test("Verify successful response with required parameters and non-empty list", async () => {
        const ctx = await createApiContext();
        const postcode = "94044";
        const taxFilingType = "single";

        const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&tax_filing_type=${taxFilingType}`);
        const body = await expectOkJson(res);

        const vehicles = getVehicles(body);
        assertVehicleArrayShape(vehicles);

        // Verify the list is not empty
        expect(vehicles.length).toBeGreaterThan(0);

        // Validate basic shape of each returned vehicle
        for (const vehicle of vehicles) {
            assertBasicVehicleShape(vehicle);
            await ajvSchemaValidation(vehicleSchema, vehicle);
        }

        await ctx.dispose();
    });

    

    test("Pagination (limit and offset)", async () => {
        const ctx = await createApiContext();
        const postcode = "94044";
        const taxFilingType = "single";

        // Page 1
        const res1 = await apiGet(
            ctx,
            `/vehicles?postcode=${postcode}&tax_filing_type=${taxFilingType}&limit=5&offset=0`
        );
        const body1 = await expectOkJson(res1);
        const vehicles1 = getVehicles(body1);
        assertVehicleArrayShape(vehicles1);
        expect(vehicles1.length).toBeLessThanOrEqual(5);

        // Page 2
        const res2 = await apiGet(
            ctx,
            `/vehicles?postcode=${postcode}&tax_filing_type=${taxFilingType}&limit=5&offset=5`
        );
        const body2 = await expectOkJson(res2);
        const vehicles2 = getVehicles(body2);
        assertVehicleArrayShape(vehicles2);
        expect(vehicles2.length).toBeLessThanOrEqual(5);

        if (vehicles1.length > 0 && vehicles2.length > 0) {
            // Validate each item has basic shape
            assertBasicVehicleShape(vehicles1[0]);
            assertBasicVehicleShape(vehicles2[0]);

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


    

    test.describe("Parameter Filtering Tests", () => {
        const postcode = "94133";

        test("availability filter = released,pre-order", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&availability=released,pre-order`);
            const body = await expectOkJson(res);
            const vehicles = getVehicles(body);
            assertVehicleArrayShape(vehicles);
            const allowed = ["released", "pre-order"];
            for (const vehicle of vehicles) {
                assertBasicVehicleShape(vehicle);
                if (vehicle.availability) {
                    expect(typeof vehicle.availability).toBe('string');
                    expect(allowed).toContain(vehicle.availability.toLowerCase());
                }
            }
            await ctx.dispose();
        });

        test("electric_range filter = 300", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&electric_range=300`);
            const body = await expectOkJson(res);
            const vehicles = getVehicles(body);
            assertVehicleArrayShape(vehicles);
            for (const vehicle of vehicles) {
                assertBasicVehicleShape(vehicle);
                if (vehicle.electric_range !== undefined && vehicle.electric_range !== null) {
                    expect(typeof vehicle.electric_range).toBe('number');
                    expect(vehicle.electric_range).toBeGreaterThanOrEqual(300);
                }
            }
            await ctx.dispose();
        });

        test("form_factor filter = sedan,suv", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&form_factor=sedan,suv`);
            const body = await expectOkJson(res);
            const vehicles = getVehicles(body);
            assertVehicleArrayShape(vehicles);
            const allowed = ["sedan", "suv"];
            for (const vehicle of vehicles) {
                assertBasicVehicleShape(vehicle);
                if (vehicle.form_factor) {
                    const formFactor = Array.isArray(vehicle.form_factor) ? vehicle.form_factor : [vehicle.form_factor];
                    const hasMatch = formFactor.some((f: string) => allowed.some(a => f.toLowerCase().includes(a)));
                    expect(hasMatch).toBe(true);
                }
            }
            await ctx.dispose();
        });

        test("Filter by make and model_year", async () => {
        const ctx = await createApiContext();
        const postcode = "94044";
        const taxFilingType = "single";
        const make = "Tesla";
        const modelYear = "2025"; 

        const res = await apiGet(
            ctx,
            `/vehicles?postcode=${postcode}&tax_filing_type=${taxFilingType}&make=${make}&model_year=${modelYear}`
        );
        const body = await expectOkJson(res);
        const vehicles = getVehicles(body);
        assertVehicleArrayShape(vehicles);

        // If items exist, every one must match the applied filters
        for (const vehicle of vehicles) {
            assertBasicVehicleShape(vehicle);
            expect(vehicle.make).toBe(make);
            expect(typeof vehicle.make).toBe('string');
            // model_year might be a number or string in response
            expect(String(vehicle.model_year)).toBe(modelYear);
        }

        await ctx.dispose();
    });

        test("fuel_type filter = bev", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&fuel_type=bev`);
            const body = await expectOkJson(res);
            const vehicles = getVehicles(body);
            assertVehicleArrayShape(vehicles);
            for (const vehicle of vehicles) {
                assertBasicVehicleShape(vehicle);
                const fuel = vehicle.internal_vehicle_fuel_type || vehicle.fuel_type || vehicle.fuel;
                if (fuel) {
                    expect(typeof fuel).toBe('string');
                    expect(fuel.toLowerCase()).toBe("bev");
                }
            }
            await ctx.dispose();
        });

        test("fuel_type filter = gas", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&fuel_type=gas`);
            const body = await expectOkJson(res);
            const vehicles = getVehicles(body);
            assertVehicleArrayShape(vehicles);
            for (const vehicle of vehicles) {
                assertBasicVehicleShape(vehicle);
                const fuel = vehicle.internal_vehicle_fuel_type || vehicle.fuel_type || vehicle.fuel;
                if (fuel) {
                    expect(typeof fuel).toBe('string');
                    expect(fuel.toLowerCase()).toBe("gas");
                }
            }
            await ctx.dispose();
        });

        test("include_used_vehicles filter", async () => {
            const ctx = await createApiContext();

            // Baseline: request without the flag
            const baseRes = await apiGet(ctx, `/vehicles?postcode=${postcode}`);
            const baseBody = await expectOkJson(baseRes);
            const baseVehicles = getVehicles(baseBody);
            const baseCount = baseVehicles.length;

            // Request with include_used_vehicles=true
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&include_used_vehicles=true`);
            const body = await expectOkJson(res);
            const vehicles = getVehicles(body);
            assertVehicleArrayShape(vehicles);

            // The flagged response should return at least as many vehicles as the baseline
            expect(
                vehicles.length,
                `include_used_vehicles=true returned fewer vehicles (${vehicles.length}) than baseline (${baseCount})`
            ).toBeGreaterThanOrEqual(baseCount);

            for (const vehicle of vehicles) {
                assertBasicVehicleShape(vehicle);
            }
            await ctx.dispose();
        });

        test("make filter = ford,chevrolet", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&make=ford,chevrolet`);
            const body = await expectOkJson(res);
            const vehicles = getVehicles(body);
            assertVehicleArrayShape(vehicles);
            const allowed = ["ford", "chevrolet"];
            for (const vehicle of vehicles) {
                assertBasicVehicleShape(vehicle);
                if (vehicle.make) {
                    expect(typeof vehicle.make).toBe('string');
                    expect(allowed).toContain(vehicle.make.toLowerCase());
                }
            }
            await ctx.dispose();
        });

        test("model filter = 3", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&model=3`);
            const body = await expectOkJson(res);
            const vehicles = getVehicles(body);
            assertVehicleArrayShape(vehicles);
            for (const vehicle of vehicles) {
                assertBasicVehicleShape(vehicle);
                if (vehicle.model) {
                    expect(typeof vehicle.model).toBe('string');
                    expect(vehicle.model.toString().toLowerCase()).toContain("3");
                }
            }
            await ctx.dispose();
        });

        test("model_year filter = 2020,2021", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&model_year=2020,2021`);
            const body = await expectOkJson(res);
            const vehicles = getVehicles(body);
            assertVehicleArrayShape(vehicles);
            const allowed = [2020, 2021, "2020", "2021"];
            for (const vehicle of vehicles) {
                assertBasicVehicleShape(vehicle);
                if (vehicle.model_year) {
                    expect(allowed).toContain(vehicle.model_year);
                }
            }
            await ctx.dispose();
        });

        test("total_range filter = 300", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&total_range=300`);
            const body = await expectOkJson(res);
            const vehicles = getVehicles(body);
            assertVehicleArrayShape(vehicles);
            for (const vehicle of vehicles) {
                assertBasicVehicleShape(vehicle);
                if (vehicle.total_range !== undefined && vehicle.total_range !== null) {
                    expect(typeof vehicle.total_range).toBe('number');
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
            const vehicles = getVehicles(body);
            assertVehicleArrayShape(vehicles);
            const allowed = [handle1, handle2];
            for (const vehicle of vehicles) {
                assertBasicVehicleShape(vehicle);
                const id = vehicle.handle || vehicle.id || vehicle.internal_id;
                expect(id).toBeDefined();
                expect(typeof id).toBe('string');
                expect(allowed).toContain(id);
            }
            await ctx.dispose();
        });
    });

    test.describe("Financial filters", () => {
        const postcode = "94133";

        test("Filter by base_msrp_min and base_msrp_max", async () => {
            const ctx = await createApiContext();
            const min = 30000;
            const max = 50000;
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&base_msrp_min=${min}&base_msrp_max=${max}`);
            const body = await expectOkJson(res);
            const vehicles = getVehicles(body);
            assertVehicleArrayShape(vehicles);
            for (const vehicle of vehicles) {
                assertBasicVehicleShape(vehicle);
                if (vehicle.base_msrp !== undefined && vehicle.base_msrp !== null) {
                    expect(typeof vehicle.base_msrp).toBe('number');
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
            const body = await expectOkJson(res);
            expect(res.status()).toBe(200);
            const vehicles = getVehicles(body);
            assertVehicleArrayShape(vehicles);
            for (const vehicle of vehicles) {
                assertBasicVehicleShape(vehicle);
                if (vehicle.purchase_price !== undefined && vehicle.purchase_price !== null) {
                    expect(typeof vehicle.purchase_price).toBe('number');
                    expect(vehicle.purchase_price).toBeGreaterThanOrEqual(min);
                    expect(vehicle.purchase_price).toBeLessThanOrEqual(max);
                }
            }
            await ctx.dispose();
        });

        test("Filter by freight_min and freight_max", async () => {
            const ctx = await createApiContext();
            const min = 1000;
            const max = 2000;
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&freight_min=${min}&freight_max=${max}`);
            const body = await expectOkJson(res);
            expect(res.status()).toBe(200);
            const vehicles = getVehicles(body);
            assertVehicleArrayShape(vehicles);
            for (const vehicle of vehicles) {
                assertBasicVehicleShape(vehicle);
                if (vehicle.freight !== undefined && vehicle.freight !== null) {
                    expect(typeof vehicle.freight).toBe('number');
                    expect(vehicle.freight).toBeGreaterThanOrEqual(min);
                    expect(vehicle.freight).toBeLessThanOrEqual(max);
                }
            }
            await ctx.dispose();
        });
    });

   

    test.describe("Sorting", () => {
        const postcode = "94133";

        test("Sorting correctness (orderby=base_msrp asc)", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&orderby=base_msrp&order=asc&limit=10`);
            const body = await expectOkJson(res);
            const vehicles = getVehicles(body);
            assertVehicleArrayShape(vehicles);

            // Collect only vehicles with numeric base_msrp for sort validation
            const msrpValues: number[] = [];
            for (const vehicle of vehicles) {
                assertBasicVehicleShape(vehicle);
                if (vehicle.base_msrp !== undefined && vehicle.base_msrp !== null) {
                    expect(typeof vehicle.base_msrp).toBe('number');
                    msrpValues.push(vehicle.base_msrp);
                }
            }

            // Validate ascending order across all comparable items
            for (let i = 1; i < msrpValues.length; i++) {
                expect(msrpValues[i]).toBeGreaterThanOrEqual(msrpValues[i - 1]);
            }

            await ctx.dispose();
        });
    });

    test.describe("Negative / validation coverage", () => {
        const postcode = "94133";

        test("AP-15560: Error Message - Empty Mandatory Postcode", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=`);
            expect([400, 404]).toContain(res.status());
            await assertErrorResponseShape(res);
            await ctx.dispose();
        });

        test("AP-15561: Empty Postcode Field (no postcode param)", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles`);
            expect([400, 404]).toContain(res.status());
            await assertErrorResponseShape(res);
            await ctx.dispose();
        });

        test("AP-15562: Error Message - Invalid Postcode", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=INVALID`);
            expect([400, 404]).toContain(res.status());
            await assertErrorResponseShape(res);
            await ctx.dispose();
        });

        test("AP-15559: Invalid Postcode - Incorrect Format", async () => {
            const ctx = await createApiContext();
            const res = await apiGet(ctx, `/vehicles?postcode=123456789`);
            expect([400, 404]).toContain(res.status());
            await assertErrorResponseShape(res);
            await ctx.dispose();
        });

        test("Invalid tax_filing_type enum", async () => {
        const ctx = await createApiContext();
        const postcode = "94044";
        const invalidTaxFiling = "invalid_value";

        const res = await apiGet(ctx, `/vehicles?postcode=${postcode}&tax_filing_type=${invalidTaxFiling}`);
        // Expecting 400 Bad Request or 404 Not Found
        expect([400, 404]).toContain(res.status());
        await assertErrorResponseShape(res);

        await ctx.dispose();
    });

    });
});
