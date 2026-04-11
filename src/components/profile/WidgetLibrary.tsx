"use client";

import { useState } from "react";

export interface WidgetDef {
  type: string;
  label: string;
  icon: string;
  category: "fun" | "info" | "social" | "media";
}

const WIDGETS: WidgetDef[] = [
  { type: "clock", label: "Clock", icon: "🕐", category: "info" },
  { type: "weather", label: "Weather", icon: "⛅", category: "info" },
  { type: "hit_counter", label: "Hit Counter", icon: "🔢", category: "fun" },
  { type: "mood", label: "Mood", icon: "😊", category: "info" },
  { type: "countdown", label: "Countdown", icon: "⏳", category: "fun" },
  { type: "horoscope", label: "Horoscope", icon: "♈", category: "fun" },
  { type: "music_playlist", label: "Playlist", icon: "🎵", category: "media" },
  { type: "photo_slideshow", label: "Slideshow", icon: "📷", category: "media" },
  { type: "guestbook", label: "Guestbook", icon: "📖", category: "social" },
  { type: "shoutbox", label: "Shoutbox", icon: "💬", category: "social" },
  { type: "top8", label: "Top 8 Friends", icon: "👥", category: "social" },
  { type: "custom_html", label: "Custom HTML", icon: "🔧", category: "fun" },
];

interface Props {
  onAdd: (widget: WidgetDef) => void;
  onClose: () => void;
}

const categories = ["fun", "info", "social", "media"] as const;

export default function WidgetLibrary({ onAdd, onClose }: Props) {
  const [cat, setCat] = useState<typeof categories[number] | "all">("all");

  const filtered = cat === "all" ? WIDGETS : WIDGETS.filter((w) => w.category === cat);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-lg">Add Widget</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="flex gap-2 p-3 border-b overflow-x-auto">
          {(["all", ...categories] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition capitalize ${
                cat === c ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="p-3 grid grid-cols-2 gap-2 overflow-y-auto">
          {filtered.map((w) => (
            <button
              key={w.type}
              onClick={() => { onAdd(w); onClose(); }}
              className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition text-left"
            >
              <span className="text-2xl">{w.icon}</span>
              <span className="text-sm font-medium">{w.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
