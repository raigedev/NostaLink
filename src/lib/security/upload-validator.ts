import { randomUUID } from "crypto";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/ogg", "audio/wav"];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_AUDIO_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_TOTAL_STORAGE_PER_USER = 100 * 1024 * 1024; // 100 MB

// Magic bytes for file type verification
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
  "audio/mpeg": [[0x49, 0x44, 0x33], [0xff, 0xfb], [0xff, 0xf3], [0xff, 0xf2]],
  "audio/ogg": [[0x4f, 0x67, 0x67, 0x53]],
  "audio/wav": [[0x52, 0x49, 0x46, 0x46]],
};

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
};

async function detectMimeFromBytes(file: File): Promise<string | null> {
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  for (const [mimeType, patterns] of Object.entries(MAGIC_BYTES)) {
    for (const pattern of patterns) {
      const matches = pattern.every((byte, i) => bytes[i] === byte);
      if (matches) return mimeType;
    }
  }
  return null;
}

function sanitizeFilename(filename: string): string {
  // Strip path traversal and keep only safe characters
  return filename
    .replace(/[/\\]/g, "")
    .replace(/\.\./g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);
}

export function generateSafeFilename(originalFilename: string): string {
  const ext = originalFilename.split(".").pop()?.toLowerCase() ?? "";
  const safeExt = EXTENSION_TO_MIME[ext] ? ext : "bin";
  return `${randomUUID()}.${safeExt}`;
}

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
  safeFilename?: string;
  detectedMime?: string;
}

export async function validateUpload(
  file: File,
  type: "image" | "audio" | "avatar"
): Promise<UploadValidationResult> {
  const allowedTypes =
    type === "audio" ? ALLOWED_AUDIO_TYPES : ALLOWED_IMAGE_TYPES;
  const maxSize =
    type === "audio"
      ? MAX_AUDIO_SIZE
      : type === "avatar"
        ? MAX_AVATAR_SIZE
        : MAX_IMAGE_SIZE;

  // Check file size
  if (file.size > maxSize) {
    const maxMb = Math.round(maxSize / (1024 * 1024));
    return { valid: false, error: `File exceeds maximum size of ${maxMb}MB` };
  }

  if (file.size === 0) {
    return { valid: false, error: "File is empty" };
  }

  // Check extension
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const extMime = EXTENSION_TO_MIME[ext];
  if (!extMime || !allowedTypes.includes(extMime)) {
    return { valid: false, error: "File extension not allowed" };
  }

  // Verify actual file content via magic bytes
  const detectedMime = await detectMimeFromBytes(file);
  if (!detectedMime || !allowedTypes.includes(detectedMime)) {
    return { valid: false, error: "File content does not match allowed types" };
  }

  // Ensure extension and content type agree
  if (detectedMime !== extMime) {
    return {
      valid: false,
      error: "File extension does not match file content",
    };
  }

  const safeName = sanitizeFilename(file.name);
  const safeFilename = generateSafeFilename(safeName);

  return { valid: true, safeFilename, detectedMime };
}
