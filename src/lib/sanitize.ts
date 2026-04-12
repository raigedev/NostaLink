import DOMPurify from "isomorphic-dompurify";

export const MAX_HTML_LENGTH = 20_480;

const ALLOWED_TAGS = [
  "div", "span", "p",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "img", "a",
  "ul", "ol", "li",
  "table", "tr", "td", "th",
  "marquee", "blink",
  "br", "hr",
  "strong", "em", "b", "i", "u",
  "iframe",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "title", "class", "id",
  "style", "width", "height", "target", "rel",
  "allowfullscreen", "frameborder", "loading",
  // table attrs
  "colspan", "rowspan", "border", "cellpadding", "cellspacing",
  // marquee attrs
  "behavior", "direction", "scrollamount", "loop",
];

// Forbidden tags – will be stripped entirely (not just their tags)
const FORBIDDEN_TAGS = [
  "script", "style", "link", "meta", "object", "embed",
  "form", "input", "textarea", "select", "button",
  "base", "applet",
];

export function sanitizeHTML(dirty: string): string {
  if (!dirty) return "";

  const truncated = dirty.slice(0, MAX_HTML_LENGTH);

  const clean = DOMPurify.sanitize(truncated, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: FORBIDDEN_TAGS,
    FORBID_ATTR: [],
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    // Disallow data: and javascript: URIs
    ALLOWED_URI_REGEXP:
      /^(?:https?:|\/\/)/i,
  } as Parameters<typeof DOMPurify.sanitize>[1]);

  // Post-process: validate iframe src against allowed hosts
  return clean.replace(
    /<iframe([^>]*)>/gi,
    (_match, attrs: string) => {
      const srcMatch = /\bsrc=["']([^"']*)["']/i.exec(attrs);
      if (!srcMatch) return "<!-- iframe removed: no src -->";
      const allowed = sanitizeIframeSrc(srcMatch[1]);
      if (!allowed) return "<!-- iframe removed: disallowed src -->";
      // Keep only safe attributes
      const safeAttrs = attrs
        .replace(/\bsrc=["'][^"']*["']/i, `src="${allowed}"`)
        .replace(/\bon\w+=["'][^"']*["']/gi, "");
      return `<iframe${safeAttrs}>`;
    }
  );
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

// Re-export from the dedicated css-sanitizer module for backward compatibility
export { sanitizeCSS, sanitizeScopedCSS, MAX_CSS_LENGTH } from "@/lib/sanitizers/css-sanitizer";
