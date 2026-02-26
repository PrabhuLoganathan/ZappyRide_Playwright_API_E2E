import crypto from "crypto";

export function buildTykHmacHeaders(args: {
  method: string;
  fullUrl: string;
  keyId: string;
  hmacSecret: string;
  origin: string;
}) {
  const TIMESTAMP_NAME = "X-Aux-Date";
  const dateHeader = new Date().toUTCString();

  const u = new URL(args.fullUrl);
  const requestTarget = u.pathname + (u.search || "");
  const method = args.method.toLowerCase();

  const headersString = `(request-target) ${TIMESTAMP_NAME.toLowerCase()} origin`;

  const signatureString =
    `(request-target): ${method} ${requestTarget}\n` +
    `${TIMESTAMP_NAME.toLowerCase()}: ${dateHeader}\n` +
    `origin: ${args.origin}`;

  const secretBytes = Buffer.from(args.hmacSecret, "base64");

  const signature = crypto
    .createHmac("sha256", secretBytes)
    .update(signatureString, "utf8")
    .digest("base64");

  const authHeader =
    `Signature keyId="${args.keyId}",algorithm="hmac-sha256",headers="${headersString}",signature="${signature}"`;

  return {
    [TIMESTAMP_NAME]: dateHeader,
    Origin: args.origin,
    Authorization: authHeader
  };
}