import { config } from "@/lib/config";

const encoder = new TextEncoder();

function toHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
}

export async function hashToken(token: string) {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(token)));
}

async function signature(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(config.tokenSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return Buffer.from(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))).toString("base64url");
}

export async function createUnsubscribeToken(subscriberId: string) {
  return `${subscriberId}.${await signature(subscriberId)}`;
}

export async function verifyUnsubscribeToken(token: string) {
  const [id, supplied] = token.split(".");
  if (!id || !supplied) return null;
  const expected = await signature(id);
  if (expected.length !== supplied.length) return null;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ supplied.charCodeAt(index);
  }
  return difference === 0 ? id : null;
}
