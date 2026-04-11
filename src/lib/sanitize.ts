import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "b", "i", "u", "a", "img", "div", "span",
  "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "br", "hr", "blockquote",
  "iframe",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "title", "class", "id",
  "style", "width", "height", "target", "rel",
  "allowfullscreen", "frameborder", "loading",
];

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    HOOKS: {
      afterSanitizeAttributes: undefined,
    },
    // Only allow youtube and spotify iframes
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  } as Parameters<typeof DOMPurify.sanitize>[1]);
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

const BLOCKED_CSS_PATTERNS = [
  /position\s*:\s*fixed/i,
  /z-index\s*:\s*([2-9]\d{2,}|1[0-9]{2,}|\d{4,})/i,
  /javascript\s*:/i,
  /expression\s*\(/i,
  /@import/i,
  /behavior\s*:/i,
  /vbscript\s*:/i,
];

export function sanitizeCSS(css: string): string {
  let result = css;
  for (const pattern of BLOCKED_CSS_PATTERNS) {
    result = result.replace(pattern, "/* blocked */");
  }
  return result;
}
