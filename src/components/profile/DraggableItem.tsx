"use client";

/**
 * DraggableItem — wraps a profile section in drag + resize handles
 * during edit mode.
 *
 * Desktop: click-and-drag from the drag handle area.
 * Mobile:  long-press (~500 ms) on the item to enter drag mode; a normal
 *          tap fires the `onSelect` callback for editing.
 *
 * Resize: drag the resize handle at the bottom-right corner to change
 *         the item's width (horizontal only). Height remains auto.
 *
 * All coordinates stay clamped inside the parent canvas bounds.
 */

import { useRef, useCallback, useEffect, type ReactNode } from "react";
import type { LayoutItem } from "@/types/layout";
import { MIN_ITEM_W, MAX_ITEM_W } from "@/types/layout";

interface Props {
  item: LayoutItem;
  /** Whether this item is currently selected (shows selection ring) */
  selected: boolean;
  /** Called when the user taps/clicks the item without dragging */
  onSelect: (id: string) => void;
  /** Called whenever drag/resize produces a new position */
  onMove: (id: string, x: number, y: number, w: number) => void;
  /** Called when drag/resize gesture ends (for persistence) */
  onMoveEnd: (id: string, x: number, y: number, w: number) => void;
  /**
   * Canvas dimensions in pixels, required to clamp positions.
   * x/y/w are percentages/pixels relative to this canvas.
   */
  canvasWidth: number;
  canvasHeight: number;
  children: ReactNode;
}

const LONG_PRESS_MS = 500;
const CURSOR_DRAGGING = "grabbing";

export default function DraggableItem({
  item,
  selected,
  onSelect,
  onMove,
  onMoveEnd,
  canvasWidth,
  canvasHeight,
  children,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Shared pointer state ───────────────────────────────────────────────────
  const dragging = useRef(false);
  const resizing = useRef(false);

  // Pointer start values
  const pointerStartX = useRef(0);
  const pointerStartY = useRef(0);

  // Item start values
  const itemStartX = useRef(0); // percentage
  const itemStartY = useRef(0); // pixels
  const itemStartW = useRef(0); // percentage

  // Track whether user has moved enough to classify as drag (not tap/click)
  const movedEnough = useRef(false);

  // Long-press timer (touch only)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchDragEnabled = useRef(false);

  // Current item values (live, not committed yet)
  const liveX = useRef(item.x);
  const liveY = useRef(item.y);
  const liveW = useRef(item.w);

  // Keep live refs in sync with prop changes
  liveX.current = item.x;
  liveY.current = item.y;
  liveW.current = item.w;

  // ── Clamp helpers ──────────────────────────────────────────────────────────
  const clampX = useCallback(
    (x: number, w: number) =>
      Math.max(0, Math.min(100 - w, x)),
    [],
  );
  const clampY = useCallback(
    (y: number) => {
      const el = containerRef.current;
      const itemH = el ? el.offsetHeight : 100;
      return Math.max(0, Math.min(canvasHeight - itemH, y));
    },
    [canvasHeight],
  );
  const clampW = useCallback(
    (w: number) => Math.max(MIN_ITEM_W, Math.min(MAX_ITEM_W, w)),
    [],
  );

  // ── Mouse drag ─────────────────────────────────────────────────────────────
  const startMouseDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    movedEnough.current = false;
    pointerStartX.current = e.clientX;
    pointerStartY.current = e.clientY;
    itemStartX.current = liveX.current;
    itemStartY.current = liveY.current;
    document.body.style.cursor = CURSOR_DRAGGING;
    document.body.style.userSelect = "none";
  }, []);

  const startMouseResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    pointerStartX.current = e.clientX;
    itemStartW.current = liveW.current;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (dragging.current) {
        const dx = e.clientX - pointerStartX.current;
        const dy = e.clientY - pointerStartY.current;
        if (!movedEnough.current && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
          movedEnough.current = true;
        }
        if (!movedEnough.current) return;
        const newX = clampX(
          itemStartX.current + (dx / canvasWidth) * 100,
          liveW.current,
        );
        const newY = clampY(itemStartY.current + dy);
        liveX.current = newX;
        liveY.current = newY;
        onMove(item.id, newX, newY, liveW.current);
      } else if (resizing.current) {
        const dx = e.clientX - pointerStartX.current;
        const newW = clampW(
          itemStartW.current + (dx / canvasWidth) * 100,
        );
        liveW.current = newW;
        onMove(item.id, liveX.current, liveY.current, newW);
      }
    }
    function onMouseUp() {
      if (dragging.current || resizing.current) {
        onMoveEnd(item.id, liveX.current, liveY.current, liveW.current);
      }
      dragging.current = false;
      resizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [canvasWidth, canvasHeight, clampX, clampY, clampW, item.id, onMove, onMoveEnd]);

  // ── Touch drag (long-press to enter drag, normal tap = select) ─────────────
  const startTouchDrag = useCallback(
    (touch: React.Touch | Touch) => {
      touchDragEnabled.current = true;
      dragging.current = true;
      movedEnough.current = false;
      pointerStartX.current = touch.clientX;
      pointerStartY.current = touch.clientY;
      itemStartX.current = liveX.current;
      itemStartY.current = liveY.current;
    },
    [],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Don't initiate if tap is on the resize handle
      if ((e.target as HTMLElement).dataset.resize) return;
      touchDragEnabled.current = false;
      const touch = e.touches[0];
      longPressTimer.current = setTimeout(() => {
        startTouchDrag(touch);
        // Provide haptic feedback if available
        if ("vibrate" in navigator) navigator.vibrate(40);
      }, LONG_PRESS_MS);
    },
    [startTouchDrag],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onTouchMove(e: TouchEvent) {
      const touch = e.touches[0];
      if (!touchDragEnabled.current) {
        // If user moves before long press fires, cancel the timer
        clearTimeout(longPressTimer.current ?? undefined);
        return;
      }
      e.preventDefault(); // suppress scroll while dragging
      const dx = touch.clientX - pointerStartX.current;
      const dy = touch.clientY - pointerStartY.current;
      if (!movedEnough.current && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        movedEnough.current = true;
      }
      if (!movedEnough.current) return;
      const newX = clampX(
        itemStartX.current + (dx / canvasWidth) * 100,
        liveW.current,
      );
      const newY = clampY(itemStartY.current + dy);
      liveX.current = newX;
      liveY.current = newY;
      onMove(item.id, newX, newY, liveW.current);
    }

    function onTouchEnd() {
      clearTimeout(longPressTimer.current ?? undefined);
      if (touchDragEnabled.current && dragging.current) {
        onMoveEnd(item.id, liveX.current, liveY.current, liveW.current);
      } else if (!touchDragEnabled.current) {
        // Normal tap → select
        onSelect(item.id);
      }
      touchDragEnabled.current = false;
      dragging.current = false;
    }

    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [canvasWidth, canvasHeight, clampX, clampY, item.id, onMove, onMoveEnd, onSelect]);

  // Touch resize: drag the resize handle
  const handleResizeTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    resizing.current = true;
    touchDragEnabled.current = true;
    pointerStartX.current = touch.clientX;
    itemStartW.current = liveW.current;
  }, []);

  // ── Click (desktop, non-drag) ──────────────────────────────────────────────
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Only fire select if the click didn't result in a drag
      if (!movedEnough.current) {
        e.stopPropagation();
        onSelect(item.id);
      }
    },
    [item.id, onSelect],
  );

  return (
    <div
      ref={containerRef}
      data-layout-id={item.id}
      style={{
        position: "absolute",
        left: `${item.x}%`,
        top: `${item.y}px`,
        width: `${item.w}%`,
        boxSizing: "border-box",
        zIndex: selected ? 10 : 1,
      }}
      onMouseDown={(e) => {
        // If click is not on resize handle, start drag
        if (!(e.target as HTMLElement).dataset.resize) {
          startMouseDrag(e);
        }
      }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      className={`group/draggable ${selected ? "ring-2 ring-indigo-500 ring-offset-1" : "hover:ring-1 hover:ring-indigo-300 hover:ring-offset-1"}`}
    >
      {/* ── Drag handle strip (top) ── */}
      <div
        className={`
          absolute -top-5 left-0 right-0 h-5
          flex items-center justify-center gap-2
          bg-indigo-600 rounded-t
          text-white text-[10px] font-medium
          select-none cursor-grab active:cursor-grabbing
          opacity-0 group-hover/draggable:opacity-100 transition-opacity
          ${selected ? "opacity-100" : ""}
        `}
        title="Drag to move. On mobile, long-press to drag."
      >
        <span className="opacity-60">⠿⠿</span>
        <span className="truncate max-w-[120px]">{item.id}</span>
        <span className="opacity-60">⠿⠿</span>
      </div>

      {/* Content */}
      {children}

      {/* ── Resize handle (bottom-right) ── */}
      <div
        data-resize="true"
        onMouseDown={startMouseResize}
        onTouchStart={handleResizeTouchStart}
        onClick={(e) => e.stopPropagation()}
        className={`
          absolute -bottom-2 -right-2
          w-5 h-5 rounded-sm
          bg-indigo-500 border-2 border-white
          cursor-ew-resize
          opacity-0 group-hover/draggable:opacity-100 transition-opacity
          ${selected ? "opacity-100" : ""}
          flex items-center justify-center
        `}
        title="Drag to resize width"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1 7L7 1M4 7L7 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}
