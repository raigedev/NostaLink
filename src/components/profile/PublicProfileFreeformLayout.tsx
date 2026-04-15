"use client";

/**
 * PublicProfileFreeformLayout — renders the profile sections using the
 * saved freeform layout (layout_data) on the public profile page.
 *
 * Used when a profile has layout_data saved. Falls back gracefully if not.
 * This is purely a render component — no editing controls.
 */

import { useMemo, type ReactNode } from "react";
import type { LayoutData, LayoutItem } from "@/types/layout";
import { CANVAS_MIN_HEIGHT } from "@/types/layout";

interface Section {
  id: string;
  node: ReactNode;
}

interface Props {
  layout: LayoutData;
  sections: Section[];
}

const APPROX_HEIGHTS: Record<string, number> = {
  "avatar-box":   210,
  "details":      150,
  "connect":       95,
  "hit-counter":  105,
  "music-player":  75,
  "about-me":     140,
  "custom-html":  130,
  "widgets":      210,
  "top-friends":  250,
  "guestbook":    230,
  "shoutbox":     190,
};

export default function PublicProfileFreeformLayout({ layout, sections }: Props) {
  const layoutMap = useMemo(
    () => new Map<string, LayoutItem>(layout.items.map((i) => [i.id, i])),
    [layout],
  );

  const canvasHeight = useMemo(
    () =>
      Math.max(
        CANVAS_MIN_HEIGHT,
        layout.items.reduce((acc, item) => {
          const h = APPROX_HEIGHTS[item.id] ?? 150;
          return Math.max(acc, item.y + h + 60);
        }, 0),
      ),
    [layout],
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: `${canvasHeight}px`,
        minHeight: `${CANVAS_MIN_HEIGHT}px`,
      }}
    >
      {sections.map((sec) => {
        const item = layoutMap.get(sec.id);
        if (!item) return null;
        return (
          <div
            key={sec.id}
            style={{
              position: "absolute",
              left: `${item.x}%`,
              top: `${item.y}px`,
              width: `${item.w}%`,
              boxSizing: "border-box",
            }}
          >
            {sec.node}
          </div>
        );
      })}
    </div>
  );
}
