import { createHash, randomBytes } from "crypto";

export function createResetToken() {
  return randomBytes(32).toString("base64url");
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getResetTokenExpiry() {
  return new Date(Date.now() + 1000 * 60 * 30);
}
