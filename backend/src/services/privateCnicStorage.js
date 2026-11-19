import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Keep documents outside all Express static directories and source control.
const here = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(here, "../..");
const STORAGE_DIR = path.join(BACKEND_ROOT, "uploads/cnic");
const RELATIVE_ROOT = "uploads/cnic";
const LEGACY_ROOT = "private/uploads/cnic";

function encryptionKey() {
  const value = process.env.CNIC_ENCRYPTION_KEY;
  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error("CNIC_ENCRYPTION_KEY must be set to 64 hexadecimal characters (32 bytes).");
  }
  return Buffer.from(value, "hex");
}

// Validate file bytes rather than trusting the browser-supplied MIME label.
export function detectImageType(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

function safeRelativePath(value) {
  // Never trust a path sent by clients. Only accept our generated filenames.
  if (typeof value !== "string") throw new Error("Invalid document path.");
  // Compatibility for earlier encrypted documents stored as fileId only.
  if (/^[0-9a-f]{32}$/.test(value)) return `${LEGACY_ROOT}/${value}.enc`;
  if (!/^(?:private\/)?uploads\/cnic\/[0-9a-f]{32}\.enc$/.test(value)) {
    throw new Error("Invalid private document path.");
  }
  return value;
}
function absolutePath(relativePath) {
  const safePath = safeRelativePath(relativePath);
  if (safePath.startsWith(`${LEGACY_ROOT}/`)) {
    return path.resolve(BACKEND_ROOT, "..", safePath);
  }
  return path.resolve(BACKEND_ROOT, safePath);
}

export async function writePrivateCnic(buffer) {
  const key = encryptionKey();
  if (!Buffer.isBuffer(buffer) || buffer.length < 32 || buffer.length > 2 * 1024 * 1024) {
    throw new Error("Invalid document size.");
  }
  const fileId = randomBytes(16).toString("hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  await mkdir(STORAGE_DIR, { recursive: true, mode: 0o700 });
  const relativePath = `${RELATIVE_ROOT}/${fileId}.enc`;
  await writeFile(absolutePath(relativePath), Buffer.concat([iv, tag, ciphertext]), { flag: "wx", mode: 0o600 });
  return relativePath;
}

export async function readPrivateCnic(relativePath) {
  const key = encryptionKey();
  const content = await readFile(absolutePath(relativePath));
  if (content.length < 29 || content.length > 2 * 1024 * 1024 + 64) throw new Error("Invalid encrypted document.");
  const iv = content.subarray(0, 12);
  const tag = content.subarray(12, 28);
  const ciphertext = content.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export async function removePrivateCnic(relativePath) {
  if (!relativePath) return;
  try {
    await unlink(absolutePath(relativePath));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
