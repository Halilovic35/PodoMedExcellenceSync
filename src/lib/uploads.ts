import { mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

export function uploadsDir() {
  return join(process.cwd(), "uploads");
}

export async function ensureUploadsDir() {
  await mkdir(uploadsDir(), { recursive: true });
}

export function newStorageKey(originalName: string) {
  const safe = originalName.replace(/[^\w.\-]+/g, "_").slice(0, 80);
  const id = randomBytes(16).toString("hex");
  return `${id}_${safe}`;
}

export function filePathForKey(key: string) {
  return join(uploadsDir(), key);
}
