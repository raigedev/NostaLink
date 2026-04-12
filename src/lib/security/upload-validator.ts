import { randomUUID } from "crypto";

export interface UploadConstraints {
  maxBytes: number;
  allowedMimeTypes: string[];
}

// MIME type signatures (file magic bytes)
const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  "image/jpeg": [new Uint8Array([0xff, 0xd8, 0xff])],
  "image/png": [new Uint8Array([0x89, 0x50, 0x4e, 0x47])],
  "image/gif": [
    new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]),
    new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]),
  ],
  "image/webp": [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
  "audio/mpeg": [
    new Uint8Array([0xff, 0xfb]),
    new Uint8Array([0xff, 0xf3]),
    new Uint8Array([0xff, 0xf2]),
    new Uint8Array([0x49, 0x44, 0x33]), // ID3 tag
  ],
  "audio/ogg": [new Uint8Array([0x4f, 0x67, 0x67, 0x53])],
  "audio/wav": [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
};

function startsWith(buffer: Uint8Array, magic: Uint8Array): boolean {
  if (buffer.length < magic.length) return false;
  for (let i = 0; i < magic.length; i++) {
    if (buffer[i] !== magic[i]) return false;
  }
  return true;
}

export function detectMimeType(buffer: Uint8Array): string | null {
  for (const [mime, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const sig of signatures) {
      if (startsWith(buffer, sig)) return mime;
    }
  }
  return null;
}

export function stripPathTraversal(name: string): string {
  return name
    .replace(/\.\.\//g, "")
    .replace(/\.\.\\/g, "")
    .replace(/[/\\]/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function generateFileName(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExt = ext.replace(/[^a-z0-9]/g, "");
  return `${randomUUID()}.${safeExt}`;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  detectedMime?: string;
}

export async function validateUpload(
  file: File,
  constraints: UploadConstraints
): Promise<ValidationResult> {
  // Check file size
  if (file.size > constraints.maxBytes) {
    const limitMB = Math.round(constraints.maxBytes / 1024 / 1024);
    return { valid: false, error: `File exceeds ${limitMB}MB limit` };
  }

  // Read first 12 bytes to detect MIME type
  const headerBuffer = await file.slice(0, 12).arrayBuffer();
  const header = new Uint8Array(headerBuffer);
  const detectedMime = detectMimeType(header);

  // For audio/wav and image/webp both start with RIFF — disambiguate by content-type hint
  let resolvedMime = detectedMime;
  if (detectedMime === "audio/wav" || detectedMime === "image/webp") {
    // Both start with RIFF; check bytes 8-11 for WAVE vs WEBP
    if (header.length >= 12) {
      const tag = String.fromCharCode(header[8], header[9], header[10], header[11]);
      if (tag === "WAVE") resolvedMime = "audio/wav";
      else if (tag === "WEBP") resolvedMime = "image/webp";
    }
  }

  if (!resolvedMime) {
    return { valid: false, error: "Could not determine file type from content" };
  }

  if (!constraints.allowedMimeTypes.includes(resolvedMime)) {
    return {
      valid: false,
      error: `File type ${resolvedMime} is not allowed. Accepted: ${constraints.allowedMimeTypes.join(", ")}`,
    };
  }

  return { valid: true, detectedMime: resolvedMime };
}

export const AVATAR_CONSTRAINTS: UploadConstraints = {
  maxBytes: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
};

export const BACKGROUND_CONSTRAINTS: UploadConstraints = {
  maxBytes: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
};

export const AUDIO_CONSTRAINTS: UploadConstraints = {
  maxBytes: 15 * 1024 * 1024, // 15MB
  allowedMimeTypes: ["audio/mpeg", "audio/ogg", "audio/wav"],
};
