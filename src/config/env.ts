export function getEnv() {
  return {
    baseUrl: process.env.BASE_URL!,
    authMode: process.env.AUTH_MODE || "bearer",
    tykKeyId: process.env.TYK_KEY_ID || "",
    tykHmacSecret: process.env.TYK_HMAC_SECRET || "",
    token: process.env.TOKEN || "",
    origin: process.env.ORIGIN || "http://localhost:8080"
  };
}