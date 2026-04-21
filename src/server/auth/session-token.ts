const encoder = new TextEncoder();

export type SessionTokenPayload = {
  issuedAt: number;
  expiresAt: number;
};

export async function createSessionToken(payload: SessionTokenPayload, secret: string): Promise<string> {
  const data = encodePayload(payload);
  const signature = await signPayload(data, secret);
  return `${data}.${signature}`;
}

export async function verifySessionToken(token: string, secret: string, now = currentEpochSeconds()): Promise<SessionTokenPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") {
    return null;
  }

  const issuedAt = parseEpochSeconds(parts[1]);
  const expiresAt = parseEpochSeconds(parts[2]);
  if (issuedAt === null || expiresAt === null || expiresAt <= issuedAt || expiresAt <= now) {
    return null;
  }

  const data = `${parts[0]}.${parts[1]}.${parts[2]}`;
  const isValid = await verifySignature(data, parts[3], secret);
  if (!isValid) {
    return null;
  }

  return { issuedAt, expiresAt };
}

function encodePayload(payload: SessionTokenPayload) {
  return `v1.${payload.issuedAt}.${payload.expiresAt}`;
}

async function signPayload(payload: string, secret: string) {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

async function verifySignature(payload: string, signature: string, secret: string) {
  const key = await importHmacKey(secret);
  const signatureBytes = fromBase64Url(signature);
  return crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(payload));
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify"
  ]);
}

function parseEpochSeconds(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function currentEpochSeconds() {
  return Math.floor(Date.now() / 1000);
}

function toBase64Url(bytes: Uint8Array) {
  return toBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string) {
  return fromBase64(value.replaceAll("-", "+").replaceAll("_", "/"));
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(value: string) {
  const normalized = value.padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
