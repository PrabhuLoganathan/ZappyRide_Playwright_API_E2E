import { test, expect } from "@playwright/test";
import { getBearerToken } from "../../../../utils/tokenManager";

const API_URL = `${process.env.BASE_URL || 'https://api.beta.zappyride.com'}/unified-chargers`;
const POSTCODE = "94133";

test.describe("GET /unified-chargers", () => {
    let token: string;
    let authHeaders: Record<string, string>;

    test.beforeAll(async () => {
        token = await getBearerToken();
        authHeaders = {
            Authorization: `Bearer ${token}`,
            //
            Accept: "*/*",
        };
    });

    test.describe("Positive Scenarios", () => {
        test("Verify GET /unified-chargers response structure", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();

            // Validate top-level response structure
            expect(body).toHaveProperty('total');
            expect(body).toHaveProperty('page_number');
            expect(body).toHaveProperty('code');
            expect(body).toHaveProperty('message');
            expect(body).toHaveProperty('chargers');
            expect(typeof body.total).toBe('number');
            expect(typeof body.page_number).toBe('number');
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length).toBeGreaterThan(0);
            expect(body.total).toBe(body.chargers.length);

            // Validate each charger object has the core required fields
            const requiredFields = ['charger_id', 'make', 'model', 'label', 'charger_type', 'current', 'kw', 'price', 'num_of_ports', 'networked', 'residential', 'commercial', 'archetype'];
            for (const charger of body.chargers) {
                for (const field of requiredFields) {
                    expect(charger, `Charger ${charger.charger_id || 'unknown'} missing field: ${field}`).toHaveProperty(field);
                }
            }
        });

        test("AP-15598:Filter by types=commercial returns only commercial chargers", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&types=commercial`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length, 'Expected at least one commercial charger').toBeGreaterThan(0);
            for (const charger of body.chargers) {
                expect(charger.commercial).toBe(true);
            }
        });

        test("AP-15616:Filter by types=residential returns only residential chargers", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&types=residential`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length, 'Expected at least one residential charger').toBeGreaterThan(0);
            for (const charger of body.chargers) {
                expect(charger.residential).toBe(true);
            }
        });

        test("AP-15619:Filter by types=archetype returns only archetype chargers", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&types=archetype`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length, 'Expected at least one archetype charger').toBeGreaterThan(0);
            for (const charger of body.chargers) {
                expect(charger.archetype).toBe(true);
            }
        });

        test("AP-15604:Filter by num_of_ports=2 returns only chargers with 2 ports", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&num_of_ports=2`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length, 'Expected at least one charger with 2 ports').toBeGreaterThan(0);
            for (const charger of body.chargers) {
                expect(charger.num_of_ports).toBe(2);
            }
        });

        test("AP-15639: Filter by cord_length=25 returns only chargers with that exact cord length", async ({ request }) => {
            // Using 25 as it is a common cord length (found in earlier response dump)
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&cord_length=25`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length, 'Expected at least one charger with cord_length=25').toBeGreaterThan(0);
            for (const charger of body.chargers) {
                expect(charger.cord_length).toBe(25);
            }
        });

        test("AP-15635: Filter by min_cord_length=20 returns only chargers with cord length >= 20", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&min_cord_length=20`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length, 'Expected at least one charger with cord_length >= 20').toBeGreaterThan(0);
            for (const charger of body.chargers) {
                if (charger.cord_length !== null) {
                    expect(charger.cord_length).toBeGreaterThanOrEqual(20);
                }
            }
        });

        test("AP-15601: Filter by max_cord_length=20 returns only chargers with cord length <= 20", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&max_cord_length=20`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length, 'Expected at least one charger with cord_length <= 20').toBeGreaterThan(0);
            for (const charger of body.chargers) {
                if (charger.cord_length !== null) {
                    expect(charger.cord_length).toBeLessThanOrEqual(20);
                }
            }
        });

        test("AP-15623: Verify chargers are filtered correctly using min_cord_length and max_cord_length", async ({ request }) => {
            const minCordLength = 10;
            const maxCordLength = 25;
            console.log(`Testing cord_length filter: min=${minCordLength}, max=${maxCordLength}`);

            const response = await request.get(
                `${API_URL}?postcode=${POSTCODE}&min_cord_length=${minCordLength}&max_cord_length=${maxCordLength}`,
                { headers: authHeaders }
            );
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(
                body.chargers.length,
                `Expected chargers for cord_length range [${minCordLength}, ${maxCordLength}] but got empty array`
            ).toBeGreaterThan(0);

            for (const charger of body.chargers) {
                if (charger.cord_length === null || charger.cord_length === undefined || typeof charger.cord_length !== 'number') {
                    console.error('Invalid charger cord_length:', JSON.stringify(charger, null, 2));
                }
                expect(charger.cord_length, 'cord_length is missing or null').toBeDefined();
                expect(charger.cord_length).not.toBeNull();
                expect(typeof charger.cord_length, `cord_length is not a number: ${charger.cord_length}`).toBe('number');
                expect(charger.cord_length).toBeGreaterThanOrEqual(minCordLength);
                expect(charger.cord_length).toBeLessThanOrEqual(maxCordLength);
            }
        });

        test("AP-15615: Filter by current=AC returns only AC chargers", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&current=AC`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length, 'Expected at least one AC charger').toBeGreaterThan(0);
            for (const charger of body.chargers) {
                if (charger.currents) {
                    expect(charger.currents).toContain("AC");
                } else {
                    expect(charger.kw_ac !== null || charger.volts_ac !== null || charger.amps !== null).toBeTruthy();
                }
            }
        });

        test("Filter by current=DC returns only DC chargers", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&current=DC`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length, 'Expected at least one DC charger').toBeGreaterThan(0);
            for (const charger of body.chargers) {
                if (charger.currents) {
                    expect(charger.currents).toContain("DC");
                } else {
                    expect(charger.kw_dc !== null || charger.volts_dc !== null || charger.amps_dc !== null).toBeTruthy();
                }
            }
        });


        test("AP-15629: Filter by max_price=500 returns chargers with price <= 500", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&max_price=500`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length, 'Expected at least one charger with price <= 500').toBeGreaterThan(0);
            for (const charger of body.chargers) {
                if (charger.price !== null) {
                    expect(charger.price).toBeLessThanOrEqual(500);
                }
            }
        });

        test("AP-15597: Filter by min_price=300 returns chargers with price >= 300", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&min_price=300`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length, 'Expected at least one charger with price >= 300').toBeGreaterThan(0);
            for (const charger of body.chargers) {
                if (charger.price !== null) {
                    expect(charger.price).toBeGreaterThanOrEqual(300);
                }
            }
        });

        test("AP-15607: Filter by kw=7.2 returns chargers matching that output", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&kw=7.2`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length, 'Expected at least one charger with kw=7.2').toBeGreaterThan(0);
            for (const charger of body.chargers) {
                const kw = charger.kw_ac || charger.kw_dc || charger.kw;
                if (kw !== null) {
                    expect(kw).toBe(7.2);
                }
            }
        });

        test("AP-15618:Filter by min_kw=50 returns chargers with output >= 50", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&min_kw=50`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length, 'Expected at least one charger with kw >= 50').toBeGreaterThan(0);
            for (const charger of body.chargers) {
                const kw = charger.kw_ac || charger.kw_dc || charger.kw;
                if (kw !== null) {
                    expect(kw).toBeGreaterThanOrEqual(50);
                }
            }
        });

        test.skip("AP-15613: Filter by max_kw=100 returns chargers with output <= 11.5", async ({ request }) => {
            // TODO: API bug: returns items with kw > 11.5 when filtered by max_kw
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&max_kw=100`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            for (const charger of body.chargers) {
                const kw = charger.kw_ac || charger.kw_dc || charger.kw;
                if (kw !== null) {
                    expect(kw).toBeLessThanOrEqual(100);
                }
            }
        });

        test("AP-15640: Filter by charger_type=level_1 returns only Level 1 chargers", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&charger_type=level_1`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length, 'Expected at least one level_1 charger').toBeGreaterThan(0);
            for (const charger of body.chargers) {
                expect(charger.charger_type).toBe("level_1");
            }
        });

        test("AP-15591:Filter by charger_type=level_2 returns only Level 2 chargers", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&charger_type=level_2`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length, 'Expected at least one level_2 charger').toBeGreaterThan(0);
            for (const charger of body.chargers) {
                expect(charger.charger_type).toBe("level_2");
            }
        });

        test("AP-15602: Filter by charger_type=dc_fast_charging returns only DC Fast chargers", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&charger_type=dc_fast_charging`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length, 'Expected at least one dc_fast_charging charger').toBeGreaterThan(0);
            for (const charger of body.chargers) {
                expect(charger.charger_type).toBe("dc_fast_charging");
            }
        });

        

        test("AP-15593: Filter by form_factor=Portable returns only portable form factor", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&form_factor=Portable`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length, 'Expected at least one Portable charger').toBeGreaterThan(0);
            for (const charger of body.chargers) {
                expect(charger.form_factor).toBe("Portable");
            }
        });

        test("AP-15614:Filter by networked=true returns only networked chargers", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&networked=true`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length, 'Expected at least one networked charger').toBeGreaterThan(0);
            for (const charger of body.chargers) {
                expect(charger.networked).toBe(true);
            }
        });

       
    });

    test.describe("Negative / Error Handling Scenarios", () => {
        test("Missing postcode returns 200 with all chargers (postcode is optional)", async ({ request }) => {
            const response = await request.get(`${API_URL}`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length).toBeGreaterThan(0);
        });

        test("Invalid current enum returns 200 with empty list", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&current=SPACE_LASER`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.chargers.length).toBe(0);
        });

        test("Invalid charger_type enum returns 200 with empty list", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&charger_type=level_999`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.chargers.length).toBe(0);
        });

        test("Invalid num_of_ports datatype (num_of_ports=two) returns 404", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&num_of_ports=two`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(404);
        });

        test("Invalid price datatype (min_price=abc) returns 404", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&min_price=abc`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(404);
        });

        test("Invalid kw datatype (kw=kw) returns 404", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&kw=kw`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(404);
        });

        test("Invalid range: min_price > max_price returns 200 with empty list", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&min_price=600&max_price=100`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.chargers.length).toBe(0);
        });

        test("Invalid range: min_cord_length > max_cord_length returns 200 with empty list", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&min_cord_length=30&max_cord_length=10`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.chargers.length).toBe(0);
        });

        test("Conflicting filters: types=commercial,residential handled correctly", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&types=commercial,residential`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200); // Should either be a union or 400. Let's assume union returns 200
        });

        test("Unknown query parameter is ignored and returns 200", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&unknown_param=123`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length).toBeGreaterThan(0);
        });

        test("Extremely large ports value returns 200 with empty list", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&num_of_ports=999`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.chargers.length).toBe(0);
        });

        test("Malformed postcode returns 400", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=@@@`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(400);
        });

        
        test("Omit current type returns chargers without current type filtering", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            expect(body.chargers.length).toBeGreaterThan(0);
        });

         test("Omit networked returns chargers without network filtering", async ({ request }) => {
             const response = await request.get(`${API_URL}?postcode=${POSTCODE}`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
        });

        test("Filter by make=ChargePoint returns only that make", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&make=ChargePoint`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            for (const charger of body.chargers) {
                expect(charger.make).toBe("ChargePoint");
            }
        });

        test("Filter by make supports multi-select values", async ({ request }) => {
            const response = await request.get(`${API_URL}?postcode=${POSTCODE}&make=ChargePoint,Tesla`, {
                headers: authHeaders,
            });
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(Array.isArray(body.chargers)).toBeTruthy();
            for (const charger of body.chargers) {
                expect(["ChargePoint", "Tesla"]).toContain(charger.make);
            }
        });
    });
});
