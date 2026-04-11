export interface FontDef {
  id: string;
  name: string;
  fontFamily: string;
  weights: number[];
  category: "serif" | "sans-serif" | "display" | "monospace";
  googleName?: string;
}

export const fonts: FontDef[] = [
  {
    id: "inter",
    name: "Inter",
    fontFamily: "'Inter', sans-serif",
    weights: [400, 500, 600, 700],
    category: "sans-serif",
    googleName: "Inter",
  },
  {
    id: "space-grotesk",
    name: "Space Grotesk",
    fontFamily: "'Space Grotesk', sans-serif",
    weights: [400, 500, 600, 700],
    category: "sans-serif",
    googleName: "Space+Grotesk",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    fontFamily: "'Playfair Display', serif",
    weights: [400, 700, 900],
    category: "serif",
    googleName: "Playfair+Display",
  },
  {
    id: "roboto-mono",
    name: "Roboto Mono",
    fontFamily: "'Roboto Mono', monospace",
    weights: [400, 700],
    category: "monospace",
    googleName: "Roboto+Mono",
  },
  {
    id: "lobster",
    name: "Lobster",
    fontFamily: "'Lobster', cursive",
    weights: [400],
    category: "display",
    googleName: "Lobster",
  },
  {
    id: "pacifico",
    name: "Pacifico",
    fontFamily: "'Pacifico', cursive",
    weights: [400],
    category: "display",
    googleName: "Pacifico",
  },
  {
    id: "oswald",
    name: "Oswald",
    fontFamily: "'Oswald', sans-serif",
    weights: [400, 600, 700],
    category: "sans-serif",
    googleName: "Oswald",
  },
  {
    id: "raleway",
    name: "Raleway",
    fontFamily: "'Raleway', sans-serif",
    weights: [400, 600, 700],
    category: "sans-serif",
    googleName: "Raleway",
  },
  {
    id: "merriweather",
    name: "Merriweather",
    fontFamily: "'Merriweather', serif",
    weights: [400, 700],
    category: "serif",
    googleName: "Merriweather",
  },
  {
    id: "dancing-script",
    name: "Dancing Script",
    fontFamily: "'Dancing Script', cursive",
    weights: [400, 700],
    category: "display",
    googleName: "Dancing+Script",
  },
  {
    id: "bebas-neue",
    name: "Bebas Neue",
    fontFamily: "'Bebas Neue', sans-serif",
    weights: [400],
    category: "display",
    googleName: "Bebas+Neue",
  },
  {
    id: "righteous",
    name: "Righteous",
    fontFamily: "'Righteous', cursive",
    weights: [400],
    category: "display",
    googleName: "Righteous",
  },
  {
    id: "press-start",
    name: "Press Start 2P",
    fontFamily: "'Press Start 2P', monospace",
    weights: [400],
    category: "monospace",
    googleName: "Press+Start+2P",
  },
  {
    id: "vt323",
    name: "VT323",
    fontFamily: "'VT323', monospace",
    weights: [400],
    category: "monospace",
    googleName: "VT323",
  },
  {
    id: "orbitron",
    name: "Orbitron",
    fontFamily: "'Orbitron', sans-serif",
    weights: [400, 700, 900],
    category: "sans-serif",
    googleName: "Orbitron",
  },
  {
    id: "special-elite",
    name: "Special Elite",
    fontFamily: "'Special Elite', cursive",
    weights: [400],
    category: "display",
    googleName: "Special+Elite",
  },
];

export function getFont(id: string): FontDef | undefined {
  return fonts.find((f) => f.id === id);
}

export function getFontUrl(font: FontDef): string {
  if (!font.googleName) return "";
  const weights = font.weights.join(";");
  return `https://fonts.googleapis.com/css2?family=${font.googleName}:wght@${weights}&display=swap`;
}
