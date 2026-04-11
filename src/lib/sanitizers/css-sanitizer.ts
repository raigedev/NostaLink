const BLOCKED_CSS_PATTERNS = [
  /expression\s*\(/gi,
  /javascript\s*:/gi,
  /@import/gi,
  /@font-face/gi,
  /behavior\s*:/gi,
  /-moz-binding/gi,
  /-webkit-binding/gi,
  /url\s*\(\s*(?!['"]?https:\/\/[a-z]+\.supabase\.co)/gi,
  /position\s*:\s*fixed/gi,
  /z-index\s*:\s*(\d{5,})/gi,
  /cursor\s*:\s*none/gi,
  /vbscript\s*:/gi,
];

function scopeCss(css: string, scopeClass: string): string {
  // Prefix each CSS rule selector with the scope class
  return css.replace(
    /([^{}]+)\{([^{}]*)\}/g,
    (_, selectors: string, declarations: string) => {
      const scoped = selectors
        .split(",")
        .map((sel) => {
          const trimmed = sel.trim();
          if (!trimmed) return "";
          if (trimmed.startsWith("@")) return trimmed;
          return `${scopeClass} ${trimmed}`;
        })
        .filter(Boolean)
        .join(", ");
      return `${scoped} { ${declarations} }`;
    }
  );
}

export function sanitizeProfileCss(dirty: string, userId: string): string {
  let css = dirty;
  for (const pattern of BLOCKED_CSS_PATTERNS) {
    css = css.replace(pattern, "/* blocked */");
  }
  return scopeCss(css, `.profile-custom-${userId}`);
}
