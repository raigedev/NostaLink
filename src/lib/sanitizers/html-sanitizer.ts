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

function isAllowedIframeSrc(src: string): boolean {
  try {
    const url = new URL(src);
    return ALLOWED_IFRAME_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

export function sanitizeProfileHtml(dirty: string): string {
  // Use DOMPurify's afterSanitizeAttributes hook to validate iframe src at the
  // DOM level — avoiding any regex-based HTML manipulation.
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.nodeName === "IFRAME") {
      const src = node.getAttribute("src") ?? "";
      if (!isAllowedIframeSrc(src)) {
        node.parentNode?.removeChild(node);
      }
    }
  });

  try {
    return DOMPurify.sanitize(dirty, {
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
  } finally {
    DOMPurify.removeHook("afterSanitizeAttributes");
  }
}
