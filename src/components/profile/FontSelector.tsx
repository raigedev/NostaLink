"use client";

import { fonts } from "@/lib/fonts";

interface Props {
  current: string;
  onSelect: (id: string) => void;
}

export default function FontSelector({ current, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
      {fonts.map((font) => (
        <button
          key={font.id}
          onClick={() => onSelect(font.id)}
          className={`flex items-center justify-between p-3 rounded-lg border-2 text-left transition ${
            current === font.id
              ? "border-indigo-600 bg-indigo-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div>
            <p className="font-medium text-sm">{font.name}</p>
            <p className="text-xs text-gray-400 capitalize">{font.category}</p>
          </div>
          <span
            className="text-lg"
            style={{ fontFamily: font.fontFamily }}
          >
            Aa
          </span>
        </button>
      ))}
    </div>
  );
}
