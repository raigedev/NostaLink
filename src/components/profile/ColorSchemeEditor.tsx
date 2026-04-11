"use client";

import { useState } from "react";

interface Colors {
  custom_css?: string;
}

interface Props {
  onSave: (colors: Colors) => void;
}

export default function ColorSchemeEditor({ onSave }: Props) {
  const [primary, setPrimary] = useState("#6366f1");
  const [secondary, setSecondary] = useState("#8b5cf6");
  const [accent, setAccent] = useState("#f59e0b");
  const [bgColor, setBgColor] = useState("#ffffff");

  function handleSave() {
    const css = `
:root {
  --accent-1: ${primary};
  --accent-2: ${secondary};
  --accent-3: ${accent};
  --bg-primary: ${bgColor};
}
`.trim();
    onSave({ custom_css: css });
  }

  return (
    <div className="space-y-3">
      {[
        { label: "Primary Accent", value: primary, set: setPrimary },
        { label: "Secondary Accent", value: secondary, set: setSecondary },
        { label: "Highlight", value: accent, set: setAccent },
        { label: "Background", value: bgColor, set: setBgColor },
      ].map(({ label, value, set }) => (
        <div key={label} className="flex items-center gap-3">
          <input
            type="color"
            value={value}
            onChange={(e) => set(e.target.value)}
            className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-400">{value}</p>
          </div>
        </div>
      ))}
      <button
        onClick={handleSave}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
      >
        Apply Colors
      </button>
    </div>
  );
}
