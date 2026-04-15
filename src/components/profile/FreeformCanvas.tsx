"use client";

/**
 * FreeformCanvas — the absolutely-positioned profile canvas used in edit mode.
 *
 * • Renders each section as a DraggableItem
 * • Provides overlap/collision resolution (push-down)
 * • Exposes onLayoutChange for parent persistence
 * • Fallback: if an element doesn't have layout data it receives a safe
 *   default below the current bottom-most item
 */

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import DraggableItem from "./DraggableItem";
import type { LayoutData, LayoutItem } from "@/types/layout";
import { CANVAS_MIN_HEIGHT } from "@/types/layout";
import { getNewItemPosition } from "@/lib/defaultLayout";

interface Section {
  id: string;
  node: ReactNode;
}

interface Props {
  layout: LayoutData;
  sections: Section[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onLayoutChange: (layout: LayoutData) => void;
  /** Called after drag/resize settles so layout can be persisted */
  onLayoutCommit: (layout: LayoutData) => void;
}

const GAP = 8; // minimum pixel gap between items

/**
 * Maximum iterations for the push-down collision resolver.
 * Prevents an infinite loop when items are arranged in a tight cycle.
 */
const MAX_COLLISION_ITERATIONS = 30;

/** Approximate heights per id for collision resolution */
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

function getHeight(id: string, measured: Map<string, number>): number {
  return measured.get(id) ?? APPROX_HEIGHTS[id] ?? 150;
}

/** Axis-aligned bounding-box collision check (in canvas pixels) */
function overlaps(
  a: LayoutItem,
  b: LayoutItem,
  canvasWidth: number,
  measured: Map<string, number>,
): boolean {
  const aLeft   = (a.x / 100) * canvasWidth;
  const aRight  = aLeft + (a.w / 100) * canvasWidth;
  const aTop    = a.y;
  const aBottom = aTop + getHeight(a.id, measured);

  const bLeft   = (b.x / 100) * canvasWidth;
  const bRight  = bLeft + (b.w / 100) * canvasWidth;
  const bTop    = b.y;
  const bBottom = bTop + getHeight(b.id, measured);

  return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
}

/**
 * Resolve collisions: after the moved item is placed, push every OTHER item
 * that overlaps it downward (recursively until stable).
 */
function resolveCollisions(
  items: LayoutItem[],
  movedId: string,
  canvasWidth: number,
  measured: Map<string, number>,
): LayoutItem[] {
  let result = [...items];
  let changed = true;
  let iterations = 0;
  while (changed && iterations < MAX_COLLISION_ITERATIONS) {
    changed = false;
    iterations++;
    const moved = result.find((i) => i.id === movedId)!;
    result = result.map((item) => {
      if (item.id === movedId) return item;
      if (overlaps(moved, item, canvasWidth, measured)) {
        const movedBottom = moved.y + getHeight(moved.id, measured) + GAP;
        if (item.y < movedBottom) {
          changed = true;
          return { ...item, y: movedBottom };
        }
      }
      return item;
    });
  }
  return result;
}

export default function FreeformCanvas({
  layout,
  sections,
  selectedId,
  onSelect,
  onLayoutChange,
  onLayoutCommit,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const measuredHeights = useRef(new Map<string, number>());
  const itemRefs = useRef(new Map<string, HTMLDivElement>());

  // Observe canvas width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setCanvasWidth(entry.contentRect.width || 800);
    });
    ro.observe(el);
    setCanvasWidth(el.offsetWidth || 800);
    return () => ro.disconnect();
  }, []);

  // Measure item heights after render
  useEffect(() => {
    itemRefs.current.forEach((el, id) => {
      if (el) measuredHeights.current.set(id, el.offsetHeight);
    });
  });

  // Calculate canvas height: max(bottom of lowest item + margin, CANVAS_MIN_HEIGHT)
  const canvasHeight = Math.max(
    CANVAS_MIN_HEIGHT,
    layout.items.reduce((acc, item) => {
      const h = getHeight(item.id, measuredHeights.current);
      return Math.max(acc, item.y + h + 60);
    }, 0),
  );

  const handleMove = useCallback(
    (id: string, x: number, y: number, w: number) => {
      const updated = layout.items.map((item) =>
        item.id === id ? { ...item, x, y, w } : item,
      );
      onLayoutChange({ ...layout, items: updated });
    },
    [layout, onLayoutChange],
  );

  const handleMoveEnd = useCallback(
    (id: string, x: number, y: number, w: number) => {
      // Apply collision resolution after drop
      let updated = layout.items.map((item) =>
        item.id === id ? { ...item, x, y, w } : item,
      );
      updated = resolveCollisions(updated, id, canvasWidth, measuredHeights.current);
      const resolved = { ...layout, items: updated };
      onLayoutChange(resolved);
      onLayoutCommit(resolved);
    },
    [layout, canvasWidth, onLayoutChange, onLayoutCommit],
  );

  // Build a map from id → LayoutItem for fast lookup
  const layoutMap = new Map<string, LayoutItem>(layout.items.map((i) => [i.id as string, i]));

  // Ensure every visible section has a layout item (fallback for new sections)
  const effectiveItems: LayoutItem[] = sections.map((sec) => {
    if (layoutMap.has(sec.id)) return layoutMap.get(sec.id)!;
    // Generate a safe position below current content
    const pos = getNewItemPosition(layout);
    return { id: sec.id as LayoutItem["id"], ...pos };
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: `${canvasHeight}px`,
        minHeight: `${CANVAS_MIN_HEIGHT}px`,
      }}
      // Clicking the canvas background deselects
      onClick={(e) => {
        if (e.target === e.currentTarget) onSelect("");
      }}
    >
      {sections.map((sec) => {
        const layoutItem = effectiveItems.find((i) => i.id === sec.id);
        if (!layoutItem) return null;
        return (
          <DraggableItem
            key={sec.id}
            item={layoutItem}
            selected={selectedId === sec.id}
            onSelect={onSelect}
            onMove={handleMove}
            onMoveEnd={handleMoveEnd}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          >
            <div
              ref={(el) => {
                if (el) {
                  itemRefs.current.set(sec.id, el);
                } else {
                  itemRefs.current.delete(sec.id);
                }
              }}
            >
              {sec.node}
            </div>
          </DraggableItem>
        );
      })}
    </div>
  );
}
