"use client";

import { useState, useRef } from "react";
import WidgetLibrary, { type WidgetDef } from "./WidgetLibrary";
import type { WidgetConfig } from "@/types/widget";

export type { WidgetConfig };

interface Props {
  initialWidgets: WidgetConfig[];
  profileId: string;
  onSave: (widgets: Record<string, unknown>[]) => void;
}

function createWidget(def: WidgetDef, order: number): WidgetConfig {
  return {
    id: `${def.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: def.type,
    label: def.label,
    icon: def.icon,
    visible: true,
    settings: {},
    order,
  };
}

export default function WidgetEditor({ initialWidgets, onSave }: Props) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(
    [...initialWidgets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  );
  const [showLibrary, setShowLibrary] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);

  function addWidget(def: WidgetDef) {
    const newWidget = createWidget(def, widgets.length);
    setWidgets((prev) => [...prev, newWidget]);
  }

  function removeWidget(id: string) {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }

  function toggleVisible(id: string) {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  }

  function updateSetting(id: string, key: string, value: unknown) {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, settings: { ...w.settings, [key]: value } } : w
      )
    );
  }

  // HTML5 Drag and Drop handlers
  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === index) return;

    setWidgets((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      // Update order values
      return next.map((w, i) => ({ ...w, order: i }));
    });
    dragIndex.current = index;
  }

  function handleDragEnd() {
    dragIndex.current = null;
  }

  function handleSave() {
    onSave(widgets as unknown as Record<string, unknown>[]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Drag widgets to reorder them. Click the gear icon to configure.
        </p>
        <button
          type="button"
          onClick={() => setShowLibrary(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-1"
        >
          + Add Widget
        </button>
      </div>

      {widgets.length === 0 && (
        <div className="py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-2xl mb-2">🧩</p>
          <p className="text-sm">No widgets yet. Add some from the catalog!</p>
        </div>
      )}

      <div className="space-y-2">
        {widgets.map((widget, index) => (
          <div
            key={widget.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`border rounded-xl overflow-hidden transition ${
              widget.visible ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-60"
            }`}
          >
            {/* Widget Header */}
            <div className="flex items-center gap-3 p-3 cursor-grab active:cursor-grabbing">
              {/* Drag handle */}
              <span className="text-gray-300 select-none text-sm">⠿</span>
              <span className="text-lg">{widget.icon}</span>
              <span className="font-medium text-sm flex-1">{widget.label}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleVisible(widget.id)}
                  className="p-1 rounded hover:bg-gray-100 text-xs text-gray-500"
                  title={widget.visible ? "Hide" : "Show"}
                >
                  {widget.visible ? "👁" : "🙈"}
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === widget.id ? null : widget.id)}
                  className="p-1 rounded hover:bg-gray-100 text-xs text-gray-500"
                  title="Settings"
                >
                  ⚙️
                </button>
                <button
                  type="button"
                  onClick={() => removeWidget(widget.id)}
                  className="p-1 rounded hover:bg-red-50 text-xs text-red-400 hover:text-red-600"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            {expandedId === widget.id && (
              <div className="border-t border-gray-100 p-3 bg-gray-50">
                <WidgetSettings widget={widget} onChange={updateSetting} />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
      >
        Save Widget Layout
      </button>

      {showLibrary && (
        <WidgetLibrary
          onAdd={addWidget}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  );
}

// ── Per-widget settings forms ─────────────────────────────────────────────────

function WidgetSettings({
  widget,
  onChange,
}: {
  widget: WidgetConfig;
  onChange: (id: string, key: string, value: unknown) => void;
}) {
  const s = widget.settings;

  switch (widget.type) {
    case "clock":
      return (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-600">Style</label>
          <select
            value={(s.style as string) ?? "digital"}
            onChange={(e) => onChange(widget.id, "style", e.target.value)}
            className="w-full px-2 py-1.5 border rounded text-sm"
          >
            <option value="digital">Digital</option>
            <option value="analog">Analog</option>
          </select>
          <label className="block text-xs font-medium text-gray-600 mt-2">Timezone</label>
          <input
            type="text"
            value={(s.timezone as string) ?? "UTC"}
            onChange={(e) => onChange(widget.id, "timezone", e.target.value)}
            placeholder="e.g. America/New_York"
            className="w-full px-2 py-1.5 border rounded text-sm"
          />
        </div>
      );

    case "weather":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600">City</label>
          <input
            type="text"
            value={(s.city as string) ?? ""}
            onChange={(e) => onChange(widget.id, "city", e.target.value)}
            placeholder="e.g. Tokyo"
            className="w-full px-2 py-1.5 border rounded text-sm mt-1"
          />
        </div>
      );

    case "countdown":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600">Target Date</label>
          <input
            type="datetime-local"
            value={(s.targetDate as string) ?? ""}
            onChange={(e) => onChange(widget.id, "targetDate", e.target.value)}
            className="w-full px-2 py-1.5 border rounded text-sm mt-1"
          />
          <label className="block text-xs font-medium text-gray-600 mt-2">Label</label>
          <input
            type="text"
            value={(s.label as string) ?? ""}
            onChange={(e) => onChange(widget.id, "label", e.target.value)}
            placeholder="e.g. My Birthday!"
            className="w-full px-2 py-1.5 border rounded text-sm mt-1"
          />
        </div>
      );

    case "horoscope":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600">Zodiac Sign</label>
          <select
            value={(s.sign as string) ?? "aries"}
            onChange={(e) => onChange(widget.id, "sign", e.target.value)}
            className="w-full px-2 py-1.5 border rounded text-sm mt-1"
          >
            {["aries","taurus","gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"].map((sign) => (
              <option key={sign} value={sign}>{sign.charAt(0).toUpperCase() + sign.slice(1)}</option>
            ))}
          </select>
        </div>
      );

    default:
      return (
        <p className="text-xs text-gray-400">No settings available for this widget.</p>
      );
  }
}
