/**
 * Pure TypeScript HTML sanitizer – no jsdom/DOMPurify required.
 * Safe to run in both server (Node.js/Edge) and browser environments,
 * avoiding the ESM/CJS incompatibility that isomorphic-dompurify/jsdom
 * triggers on Vercel production.
 */

export const MAX_HTML_LENGTH = 20_480;

const ALLOWED_TAG_SET = new Set([
  "div", "span", "p",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "img", "a",
  "ul", "ol", "li",
  "table", "tr", "td", "th",
  "marquee", "blink",
  "br", "hr",
  "strong", "em", "b", "i", "u",
  "iframe",
]);

const ALLOWED_ATTR_SET = new Set([
  "href", "src", "alt", "title", "class", "id",
  "style", "width", "height", "target", "rel",
  "allowfullscreen", "frameborder", "loading",
  // table attrs
  "colspan", "rowspan", "border", "cellpadding", "cellspacing",
  // marquee attrs
  "behavior", "direction", "scrollamount", "loop",
]);

// Forbidden tags – stripped together with all their inner content
const FORBIDDEN_TAG_SET = new Set([
  "script", "style", "link", "meta", "object", "embed",
  "form", "input", "textarea", "select", "button",
  "base", "applet",
]);

// Void elements (self-closing, no inner content to skip)
const VOID_TAG_SET = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/** URL schemes that are never allowed in href/src attributes */
const UNSAFE_URL_RE = /^\s*(javascript|data|vbscript)\s*:/i;

/** Dangerous CSS patterns blocked in inline style attributes */
const BLOCKED_STYLE_PATTERNS = [
  /expression\s*\(/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /@import\b/gi,
  /@font-face\b/gi,
  /behavior\s*:/gi,
  /-moz-binding\s*:/gi,
  /-webkit-binding\s*:/gi,
];

function isSafeUrl(url: string): boolean {
  return !UNSAFE_URL_RE.test(url);
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanitizeInlineStyle(css: string): string {
  let result = css;
  for (const pattern of BLOCKED_STYLE_PATTERNS) {
    result = result.replace(pattern, "/* blocked */");
  }
  return result;
}

/**
 * Parse key=value pairs from a raw HTML attribute string.
 * The regex intentionally accepts a broad set of attribute name characters
 * (including hyphens, colons for data-* and aria-*); the ALLOWED_ATTR_SET
 * filter applied by the caller restricts what actually reaches the output.
 */
function parseAttrs(raw: string): Array<[string, string]> {
  const result: Array<[string, string]> = [];
  const re = /([a-zA-Z][a-zA-Z0-9_:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"'`]*)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const name = m[1].toLowerCase();
    // Pick the first captured group that is defined (double-quoted, single-quoted, unquoted, or empty)
    const value = m[2] ?? m[3] ?? m[4] ?? "";
    result.push([name, value]);
  }
  return result;
}

function buildSafeAttrs(tagName: string, rawAttrs: string): string {
  const attrs = parseAttrs(rawAttrs);
  let out = "";

  for (const [name, value] of attrs) {
    // Always strip event handlers
    if (name.startsWith("on")) continue;
    // Only allow known-safe attributes
    if (!ALLOWED_ATTR_SET.has(name)) continue;
    // Block unsafe URL schemes in href/src
    if ((name === "href" || name === "src") && !isSafeUrl(value)) continue;
    // Validate iframe src against an explicit allowlist
    if (tagName === "iframe" && name === "src") {
      const allowed = sanitizeIframeSrc(value);
      if (!allowed) continue;
      out += ` src="${escapeAttr(allowed)}"`;
      continue;
    }
    // Sanitize inline style values
    if (name === "style") {
      out += ` style="${escapeAttr(sanitizeInlineStyle(value))}"`;
      continue;
    }

    out += ` ${name}="${escapeAttr(value)}"`;
  }

  return out;
}

export function sanitizeIframeSrc(src: string): string | null {
  try {
    const url = new URL(src);
    if (
      url.hostname === "www.youtube.com" &&
      url.pathname.startsWith("/embed/")
    ) {
      return src;
    }
    if (
      url.hostname === "open.spotify.com" &&
      url.pathname.startsWith("/embed/")
    ) {
      return src;
    }
  } catch {
    // invalid URL
  }
  return null;
}

/**
 * Sanitize an HTML string, allowing only a conservative set of tags and
 * attributes.  Does not depend on jsdom or DOMPurify – safe for SSR.
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty) return "";
  const input = dirty.slice(0, MAX_HTML_LENGTH);
  // Pre-compute a lowercased copy once so indexOf searches inside the loop
  // don't repeatedly lowercase the entire remaining string.
  const inputLower = input.toLowerCase();
  let result = "";
  let i = 0;

  while (i < input.length) {
    if (input[i] !== "<") {
      result += input[i++];
      continue;
    }

    // Find the closing > of this tag, respecting quoted attribute values
    let j = i + 1;
    let inQuote: string | null = null;
    while (j < input.length) {
      const ch = input[j];
      if (inQuote) {
        if (ch === inQuote) inQuote = null;
      } else if (ch === '"' || ch === "'") {
        inQuote = ch;
      } else if (ch === ">") {
        break;
      }
      j++;
    }

    if (j >= input.length) {
      // Unterminated tag — escape the < and move on
      result += "&lt;";
      i++;
      continue;
    }

    const tagContent = input.slice(i + 1, j);
    i = j + 1;

    // Skip HTML comments, doctypes, and processing instructions
    if (tagContent.startsWith("!") || tagContent.startsWith("?")) continue;

    const isClosing = tagContent.startsWith("/");
    const tagBody = isClosing ? tagContent.slice(1).trimStart() : tagContent;
    const nameEndIdx = tagBody.search(/[\s/>]/);
    const tagName = (nameEndIdx === -1 ? tagBody : tagBody.slice(0, nameEndIdx)).toLowerCase();

    // Must be a valid HTML tag name
    if (!tagName || !/^[a-z][a-z0-9]*$/.test(tagName)) continue;

    const rawAttrs = nameEndIdx === -1 ? "" : tagBody.slice(nameEndIdx);

    if (FORBIDDEN_TAG_SET.has(tagName)) {
      // Strip the tag; if it's an opening tag also consume its inner content.
      // Note: nested same-type forbidden tags (e.g. <script><script>…</script></script>)
      // are handled conservatively – we skip to the first closing tag, and any
      // remaining orphaned closing tags are stripped on their next iteration.
      if (!isClosing && !VOID_TAG_SET.has(tagName)) {
        const closeTag = `</${tagName}`;
        const idx = inputLower.indexOf(closeTag, i);
        if (idx !== -1) {
          const endIdx = input.indexOf(">", idx);
          i = endIdx !== -1 ? endIdx + 1 : idx + closeTag.length;
        }
      }
      continue;
    }

    if (!ALLOWED_TAG_SET.has(tagName)) {
      // Unknown tag: strip the tag itself but keep its text content
      continue;
    }

    if (isClosing) {
      result += `</${tagName}>`;
    } else {
      result += `<${tagName}${buildSafeAttrs(tagName, rawAttrs)}>`;
    }
  }

  return result;
}

// Re-export from the dedicated css-sanitizer module for backward compatibility
export { sanitizeCSS, sanitizeScopedCSS, MAX_CSS_LENGTH } from "@/lib/sanitizers/css-sanitizer";
