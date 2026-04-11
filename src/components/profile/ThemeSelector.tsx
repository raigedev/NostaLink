"use client";

import { themes } from "@/lib/themes";

interface Props {
  current: string;
  onSelect: (id: string) => void;
}

export default function ThemeSelector({ current, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {themes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onSelect(theme.id)}
          className={`p-3 rounded-xl border-2 text-left transition ${
            current === theme.id
              ? "border-indigo-600 ring-2 ring-indigo-200"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex gap-1 mb-2">
            {theme.previewColors.map((color, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <p className="font-medium text-sm">{theme.name}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{theme.description}</p>
        </button>
      ))}
    </div>
  );
}
