const BLOCKED_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

const ALLOWED_SCHEMES = ["http:", "https:"];
export const FETCH_TIMEOUT = 5000;

export function validateExternalUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (!ALLOWED_SCHEMES.includes(url.protocol)) return false;
    if (BLOCKED_IP_RANGES.some((r) => r.test(url.hostname))) return false;
    return true;
  } catch {
    return false;
  }
}

export async function safeFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  if (!validateExternalUrl(url)) {
    throw new Error("URL validation failed: disallowed URL");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
