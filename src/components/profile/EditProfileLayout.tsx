"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import type { Profile } from "@/app/actions/profile";
import ProfileEditor from "./ProfileEditor";
import ProfilePreviewPanel from "./ProfilePreviewPanel";

interface Props {
  profile: Profile;
}

const MIN_PANEL_WIDTH = 280;
const MAX_PANEL_WIDTH = 600;
const DEFAULT_PANEL_WIDTH = 360;

/**
 * Full-screen profile customization workspace.
 *
 * Desktop layout:
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │  Top bar: ← Back | Edit Profile | unsaved indicator           │
 *   ├──────────────────────────────────────┬─────────┬──────────────┤
 *   │                                      │  drag   │  Tools panel │
 *   │  Large live profile preview          │  handle │  (right,     │
 *   │  (dominant, fills remaining space)   │    ◀▶   │  resizable,  │
 *   │                                      │         │  collapsible)│
 *   └──────────────────────────────────────┴─────────┴──────────────┘
 *
 * Mobile: toggle between Editor and Preview.
 */
export default function EditProfileLayout({ profile }: Props) {
  const [draft, setDraft] = useState<Partial<Profile>>({});
  const [activeView, setActiveView] = useState<"editor" | "preview">("editor");
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  const handleDraftChange = useCallback((newDraft: Partial<Profile>) => {
    setDraft(newDraft);
  }, []);

  const hasUnsavedChanges = Object.keys(draft).length > 0;

  // ── Resize drag logic (horizontal) ──────────────────────────────────────
  function startDrag(e: React.MouseEvent | React.TouchEvent) {
    if (isCollapsed) return;
    dragging.current = true;
    dragStartX.current = "touches" in e ? e.touches[0].clientX : e.clientX;
    dragStartW.current = panelWidth;
    e.preventDefault();
  }

  function handleResizeKey(e: React.KeyboardEvent) {
    if (isCollapsed) return;
    const STEP = 20;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setPanelWidth((w) => Math.min(MAX_PANEL_WIDTH, w + STEP));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPanelWidth((w) => Math.max(MIN_PANEL_WIDTH, w - STEP));
    }
  }

  useEffect(() => {
    function onMove(e: MouseEvent | TouchEvent) {
      if (!dragging.current) return;
      // Prevent page scroll while dragging the resize handle
      e.preventDefault();
      const clientX = "touches" in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      // Dragging left increases panel width (handle is on the left edge of the panel)
      const delta = dragStartX.current - clientX;
      const newW = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, dragStartW.current + delta));
      setPanelWidth(newW);
    }
    function onUp() {
      dragging.current = false;
    }
    window.addEventListener("mousemove", onMove);
    // passive: false is required so we can call preventDefault() to suppress
    // native scroll while dragging the resize handle on touch devices.
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header className="flex-shrink-0 h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-3 z-20">
        <Link
          href={`/profile/${profile.username}`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
          ← Back to Profile
        </Link>

        <span className="text-gray-300 select-none">|</span>

        <span className="text-sm font-semibold text-gray-800">✏️ Edit Profile</span>

        {/* Right side: unsaved indicator + mobile toggle */}
        <div className="ml-auto flex items-center gap-2">
          {hasUnsavedChanges && (
            <span
              role="status"
              aria-live="polite"
              className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 hidden sm:inline-flex"
            >
              ● Unsaved changes
            </span>
          )}

          {/* Mobile toggle — shown only on small screens */}
          <div className="lg:hidden flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveView("editor")}
              aria-pressed={activeView === "editor"}
              className={`px-3 py-1 text-xs font-medium transition ${
                activeView === "editor"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => setActiveView("preview")}
              aria-pressed={activeView === "preview"}
              className={`px-3 py-1 text-xs font-medium transition border-l border-gray-200 ${
                activeView === "preview"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              👁 Preview
            </button>
          </div>
        </div>
      </header>

      {/* ── Desktop workspace: preview on left + tools panel on right ─ */}
      <div className="hidden lg:flex lg:flex-row flex-1 min-h-0 overflow-hidden">

        {/* ── Preview canvas (fills remaining space on the left) ────── */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <ProfilePreviewPanel profile={profile} draftOverrides={draft} />
        </div>

        {/* ── Resize drag handle (vertical bar between preview & panel) */}
        <div
          role="separator"
          aria-label="Drag to resize tools panel"
          aria-valuenow={isCollapsed ? 0 : panelWidth}
          aria-valuemin={MIN_PANEL_WIDTH}
          aria-valuemax={MAX_PANEL_WIDTH}
          aria-orientation="vertical"
          tabIndex={0}
          title={isCollapsed ? "Tools panel is collapsed" : "Drag or use ←/→ keys to resize"}
          className={`flex-shrink-0 w-2.5 bg-gray-200 hover:bg-indigo-200 active:bg-indigo-300 flex flex-col items-center justify-center transition-colors select-none z-10 group focus:outline-none focus:bg-indigo-200 relative ${isCollapsed ? "cursor-default" : "cursor-col-resize"}`}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          onKeyDown={handleResizeKey}
        >
          <div className="h-14 w-1 rounded-full bg-gray-400 group-hover:bg-indigo-400 transition-colors" />

          {/* ── Collapse / Expand toggle button ────────────────────── */}
          <button
            type="button"
            onClick={() => setIsCollapsed((c) => !c)}
            aria-label={isCollapsed ? "Expand tools panel" : "Collapse tools panel"}
            title={isCollapsed ? "Expand tools panel" : "Collapse tools panel"}
            className="absolute top-1/2 -translate-y-1/2 -right-3.5 w-7 h-7 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-400 hover:shadow-md transition-all z-20 text-xs"
          >
            {isCollapsed ? "›" : "‹"}
          </button>
        </div>

        {/* ── Editor tools panel (right side, resizable, collapsible) ─ */}
        <div
          className={`flex-shrink-0 bg-white border-l border-gray-200 transition-all duration-300 ${isCollapsed ? "overflow-hidden" : "overflow-y-auto"}`}
          style={{ width: isCollapsed ? 0 : panelWidth }}
        >
          {!isCollapsed && (
            <div className="p-3" style={{ minWidth: MIN_PANEL_WIDTH }}>
              <ProfileEditor profile={profile} onDraftChange={handleDraftChange} />
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile workspace: toggle between editor and preview ───── */}
      <div className="lg:hidden flex flex-col flex-1 min-h-0 overflow-hidden">
        {activeView === "editor" ? (
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="p-3">
              <ProfileEditor profile={profile} onDraftChange={handleDraftChange} />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <ProfilePreviewPanel profile={profile} draftOverrides={draft} />
          </div>
        )}
      </div>
    </div>
  );
}
