import crypto from "crypto";
import { yandexHmacKey } from "../config/config.js";

// Create a key from the HMAC secret
const CryptoKey = crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(yandexHmacKey),
  { name: "HMAC", hash: { name: "SHA-256" } },
  false,
  ["sign", "verify"],
);

export default async function getSignature(body) {
  const key = await CryptoKey;
  return new Uint8Array(
    // Sign the body with the key
    await crypto.subtle.sign("HMAC", key, body),
    // Convert the signature to a hex string
  ).reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
}
