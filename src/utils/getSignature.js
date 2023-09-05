import crypto from "crypto";
import { yandexHmacKey } from "../config/config.js";

export default async function getSignature(body) {
  // Create a key from the HMAC secret
  const utf8Encoder = new TextEncoder("utf-8");
  const key = await crypto.subtle.importKey(
    "raw",
    utf8Encoder.encode(yandexHmacKey),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign", "verify"],
  );
  // Sign the body with the key
  const signature = await crypto.subtle.sign("HMAC", key, body);
  // Convert the signature to a hex string
  return Array.from(new Uint8Array(signature), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
}
