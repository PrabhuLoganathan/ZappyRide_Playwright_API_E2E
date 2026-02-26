import { APIRequestContext, request, expect } from "@playwright/test";
import { getEnv } from "../config/env";
import { buildTykHmacHeaders } from "../auth/tykHmac";

export async function createApiContext(): Promise<APIRequestContext> {
  const env = getEnv();
  return await request.newContext({ baseURL: env.baseUrl });
}

export async function apiGet(ctx: APIRequestContext, path: string) {
  const env = getEnv();
  const fullUrl = new URL(path, env.baseUrl).toString();

  let headers: Record<string, string> = { "x-debug-mode": "true" };

  if (env.authMode === "tyk-hmac") {
    headers = {
      ...headers,
      ...buildTykHmacHeaders({
        method: "GET",
        fullUrl,
        keyId: env.tykKeyId,
        hmacSecret: env.tykHmacSecret,
        origin: env.origin
      })
    };
  } else {
    headers.Authorization = `Bearer ${env.token}`;
    headers["User-Agent"] = "PostmanRuntime/7.51.1";
    headers["Accept"] = "*/*";
  }

  return await ctx.get(path, { headers });
}

export async function expectOkJson(res: any) {
  if (!res.ok()) {
    console.log(`Request failed with status ${res.status()}`);
    console.log(await res.text());
  }
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  console.log(JSON.stringify(body, null, 2));
  return body;
}