const MAX_CSS_LENGTH = 10_240;

const BLOCKED_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /expression\s*\(/gi, label: "expression()" },
  { pattern: /javascript\s*:/gi, label: "javascript:" },
  { pattern: /@import\b/gi, label: "@import" },
  { pattern: /@font-face\b/gi, label: "@font-face" },
  { pattern: /behavior\s*:/gi, label: "behavior:" },
  { pattern: /-moz-binding\s*:/gi, label: "-moz-binding:" },
  { pattern: /-webkit-binding\s*:/gi, label: "-webkit-binding:" },
  { pattern: /vbscript\s*:/gi, label: "vbscript:" },
  { pattern: /position\s*:\s*fixed/gi, label: "position:fixed" },
  // Block high z-index values (>9999)
  { pattern: /z-index\s*:\s*(?:[1-9]\d{4,}|\d{5,})/gi, label: "excessive z-index" },
  { pattern: /cursor\s*:\s*none/gi, label: "cursor:none" },
  // Block external URLs except Supabase storage - require the ENTIRE URL to be a Supabase storage URL
  {
    pattern: /url\s*\(\s*['"]?((?!https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/storage\/)[^)'"]*?)['"]?\s*\)/gi,
    label: "external URL",
  },
];

/**
 * Sanitize CSS and scope all selectors under `.profile-custom-{userId}`.
 * Blocks dangerous patterns and limits length to MAX_CSS_LENGTH.
 */
export function sanitizeScopedCSS(css: string, userId: string): string {
  if (!css) return "";

  // Enforce max length
  const trimmed = css.slice(0, MAX_CSS_LENGTH);

  // Replace blocked patterns
  let sanitized = trimmed;
  for (const { pattern } of BLOCKED_PATTERNS) {
    sanitized = sanitized.replace(pattern, "/* blocked */");
  }

  // Scope each rule under .profile-custom-{userId}
  const scope = `.profile-custom-${userId}`;
  return scopeCSS(sanitized, scope);
}

/**
 * Basic CSS sanitizer without scoping (used for non-profile contexts).
 */
export function sanitizeCSS(css: string): string {
  if (!css) return "";
  let result = css.slice(0, MAX_CSS_LENGTH);
  for (const { pattern } of BLOCKED_PATTERNS) {
    result = result.replace(pattern, "/* blocked */");
  }
  return result;
}

/**
 * Scope all CSS selectors under a given parent selector.
 * Handles @media and @keyframes rules specially.
 */
function scopeCSS(css: string, scope: string): string {
  // Tokenize: split into rule blocks roughly
  const result: string[] = [];
  let i = 0;
  const n = css.length;

  while (i < n) {
    // Skip whitespace
    while (i < n && /\s/.test(css[i])) {
      result.push(css[i]);
      i++;
    }
    if (i >= n) break;

    // Check for @rule
    if (css[i] === "@") {
      // Read the @rule keyword
      const atStart = i;
      i++; // skip @
      while (i < n && /[a-zA-Z-]/.test(css[i])) i++;
      const atKeyword = css.slice(atStart + 1, i).toLowerCase();

      if (atKeyword === "media" || atKeyword === "supports" || atKeyword === "layer") {
        // Read condition until {
        while (i < n && css[i] !== "{") i++;
        const header = css.slice(atStart, i);
        i++; // skip {
        // Find the matching closing brace, scoping inner rules
        const inner = extractBlock(css, i);
        i += inner.length + 1; // +1 for closing }
        result.push(`${header} { ${scopeCSS(inner, scope)} }`);
      } else if (atKeyword === "keyframes" || atKeyword === "-webkit-keyframes") {
        // Don't scope keyframes selectors (from/to/percentages)
        while (i < n && css[i] !== "{") i++;
        const header = css.slice(atStart, i);
        i++; // skip {
        const inner = extractBlock(css, i);
        i += inner.length + 1;
        result.push(`${header} { ${inner} }`);
      } else {
        // Other @rules: read until ; or end, skip them as blocked
        while (i < n && css[i] !== ";" && css[i] !== "{") i++;
        if (i < n && css[i] === ";") i++;
        // Blocked
        result.push("/* blocked @rule */");
      }
    } else {
      // Regular rule: read selector until {
      const selectorStart = i;
      while (i < n && css[i] !== "{") i++;
      if (i >= n) break;
      const selector = css.slice(selectorStart, i).trim();
      i++; // skip {
      const declarations = extractBlock(css, i);
      i += declarations.length + 1;

      if (!selector) continue;

      // Scope selector: handle comma-separated selectors
      const scopedSelectors = selector
        .split(",")
        .map((sel) => {
          const s = sel.trim();
          if (!s) return "";
          // If selector contains :root, replace with scope
          if (s === ":root") return scope;
          // Prepend scope
          return `${scope} ${s}`;
        })
        .filter(Boolean)
        .join(", ");

      result.push(`${scopedSelectors} { ${declarations} }`);
    }
  }

  return result.join("\n");
}

/**
 * Extract the content of a block starting at position i (after the opening {).
 * Returns the content without the closing }.
 */
function extractBlock(css: string, start: number): string {
  let depth = 1;
  let i = start;
  const n = css.length;
  while (i < n && depth > 0) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") depth--;
    if (depth > 0) i++;
    else break;
  }
  return css.slice(start, i);
}

export { MAX_CSS_LENGTH };
