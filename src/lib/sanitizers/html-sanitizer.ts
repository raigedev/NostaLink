import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "div",
  "span",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "img",
  "a",
  "ul",
  "ol",
  "li",
  "table",
  "tr",
  "td",
  "th",
  "marquee",
  "blink",
  "br",
  "hr",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "iframe",
];

const ALLOWED_ATTRS = [
  "href",
  "src",
  "alt",
  "title",
  "class",
  "style",
  "width",
  "height",
  "target",
  "rel",
];

const ALLOWED_URI_REGEXP = /^(?:(?:https?):\/\/|mailto:|tel:|#)/i;

const ALLOWED_IFRAME_HOSTS = ["www.youtube.com", "open.spotify.com"];

function postProcessIframes(html: string, allowedHosts: string[]): string {
  // Replace any iframes whose src doesn't match the allowed hosts
  return html.replace(/<iframe[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/src\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch) return "";
    try {
      const url = new URL(srcMatch[1]);
      if (allowedHosts.includes(url.hostname)) return tag;
    } catch {
      // invalid URL
    }
    return "";
  });
}

export function sanitizeProfileHtml(dirty: string): string {
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRS,
    ALLOWED_URI_REGEXP,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: [
      "script",
      "style",
      "link",
      "meta",
      "object",
      "embed",
      "form",
      "input",
      "textarea",
      "select",
      "button",
      "base",
      "applet",
    ],
    FORBID_ATTR: [
      "onerror",
      "onclick",
      "onload",
      "onmouseover",
      "onfocus",
      "onblur",
      "onsubmit",
      "onreset",
      "onchange",
      "oninput",
      "onkeydown",
      "onkeyup",
      "onkeypress",
    ],
    WHOLE_DOCUMENT: false,
    RETURN_DOM: false,
  } as Parameters<typeof DOMPurify.sanitize>[1]);

  return postProcessIframes(clean, ALLOWED_IFRAME_HOSTS);
}
