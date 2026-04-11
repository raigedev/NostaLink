"use client";

import { useState } from "react";
import { sanitizeCSS } from "@/lib/sanitize";

interface Props {
  defaultValue: string;
  onSave: (css: string) => void;
}

export default function CSSEditor({ defaultValue, onSave }: Props) {
  const [value, setValue] = useState(defaultValue);

  function handleSave() {
    onSave(sanitizeCSS(value));
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">
        Custom CSS applied to your profile. Fixed positioning and z-index &gt; 100 are blocked for safety.
      </p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={12}
        className="w-full font-mono text-xs border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-gray-950 text-green-400"
        placeholder=".profile-header { color: hotpink; }"
        spellCheck={false}
      />
      <button
        onClick={handleSave}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
      >
        Save CSS
      </button>
    </div>
  );
}
