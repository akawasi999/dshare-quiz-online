import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newOneTimeToken = () => randomBytes(32).toString("base64url");

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, expected] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !expected) return false;
  const derived = await scrypt(password, salt, 64) as Buffer;
  const expectedBytes = Buffer.from(expected, "base64url");
  return expectedBytes.length === derived.length && timingSafeEqual(expectedBytes, derived);
}
