import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const ALGORITHM = "pbkdf2_sha256";
const ITERATIONS = 310000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${ALGORITHM}$${ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [algorithm, iterationsText, salt, originalHash] = stored.split("$");

  if (algorithm !== ALGORITHM || !iterationsText || !salt || !originalHash) {
    return false;
  }

  const iterations = Number(iterationsText);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;

  const hash = pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST);
  const original = Buffer.from(originalHash, "hex");

  if (hash.length !== original.length) return false;
  return timingSafeEqual(hash, original);
}
