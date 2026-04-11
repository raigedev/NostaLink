export interface Theme {
  id: string;
  name: string;
  cssClass: string;
  description: string;
  previewColors: string[];
}

export const themes: Theme[] = [
  {
    id: "y2k",
    name: "Y2K",
    cssClass: "theme-y2k",
    description: "Turn-of-the-millennium chrome and bubblegum vibes",
    previewColors: ["#ff69b4", "#00ffff", "#c0c0c0", "#ff00ff"],
  },
  {
    id: "emo",
    name: "Emo",
    cssClass: "theme-emo",
    description: "Dark hearts and broken poetry",
    previewColors: ["#1a1a1a", "#8b0000", "#2d2d2d", "#ff0000"],
  },
  {
    id: "scene",
    name: "Scene",
    cssClass: "theme-scene",
    description: "Neon hair and MySpace glitter",
    previewColors: ["#ff6600", "#cc00ff", "#00ff66", "#ff0099"],
  },
  {
    id: "pastel",
    name: "Pastel",
    cssClass: "theme-pastel",
    description: "Soft clouds and dreamy hues",
    previewColors: ["#ffd1dc", "#b5ead7", "#c7ceea", "#ffeaa7"],
  },
  {
    id: "dark",
    name: "Dark",
    cssClass: "theme-dark",
    description: "Classic dark mode elegance",
    previewColors: ["#121212", "#1e1e1e", "#bb86fc", "#03dac6"],
  },
  {
    id: "neon",
    name: "Neon",
    cssClass: "theme-neon",
    description: "Electric nights and laser grids",
    previewColors: ["#0d0d0d", "#00ff41", "#ff00ff", "#ffff00"],
  },
  {
    id: "grunge",
    name: "Grunge",
    cssClass: "theme-grunge",
    description: "Distorted textures and raw energy",
    previewColors: ["#3d2b1f", "#6b5a4e", "#8b7355", "#c4a882"],
  },
  {
    id: "kawaii",
    name: "Kawaii",
    cssClass: "theme-kawaii",
    description: "Super cute Japanese aesthetics",
    previewColors: ["#ffb3de", "#b3e0ff", "#b3ffb3", "#fff0b3"],
  },
  {
    id: "minimalist",
    name: "Minimalist",
    cssClass: "theme-minimalist",
    description: "Clean lines and white space",
    previewColors: ["#ffffff", "#f5f5f5", "#222222", "#767676"],
  },
  {
    id: "retro",
    name: "Retro",
    cssClass: "theme-retro",
    description: "80s arcade cabinet nostalgia",
    previewColors: ["#1a0533", "#6a0dad", "#ff6b35", "#f7931e"],
  },
  {
    id: "vaporwave",
    name: "Vaporwave",
    cssClass: "theme-vaporwave",
    description: "A E S T H E T I C mall nostalgia",
    previewColors: ["#ff71ce", "#01cdfe", "#05ffa1", "#b967ff"],
  },
  {
    id: "cottagecore",
    name: "Cottagecore",
    cssClass: "theme-cottagecore",
    description: "Wildflowers and rustic charm",
    previewColors: ["#f5e6ca", "#8fbc8f", "#d2691e", "#f4a460"],
  },
];

export function getTheme(id: string): Theme | undefined {
  return themes.find((t) => t.id === id);
}
