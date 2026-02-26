import { test, expect } from "@playwright/test";
import { createApiContext, apiGet, expectOkJson } from "../../../src/http/api";

test("ZappyRide Beta API E2E", async () => {
  const ctx = await createApiContext();
  const postcode = "94044";

  const locationRes = await apiGet(ctx, `/location?postcode=${postcode}`);
  const location = await expectOkJson(locationRes);
  expect(location).toHaveProperty("location");

  const vehiclesRes = await apiGet(ctx, `/vehicles?postcode=${postcode}`);
  const vehiclesBody = await expectOkJson(vehiclesRes);
  const vehicles = vehiclesBody.vehicles || vehiclesBody;
  expect(vehicles.length).toBeGreaterThan(0);

  const vehicleId = vehicles[0].id || vehicles[0].handle;
  const detailRes = await apiGet(ctx, `/vehicles/${vehicleId}?postcode=${postcode}`);
  const detail = await expectOkJson(detailRes);
  expect(detail).toBeTruthy();

  await ctx.dispose();
});