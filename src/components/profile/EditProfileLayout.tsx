"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import type { Profile } from "@/app/actions/profile";
import ProfileEditor from "./ProfileEditor";
import ProfilePreviewPanel from "./ProfilePreviewPanel";

interface Props {
  profile: Profile;
}

const MIN_EDITOR_HEIGHT = 120;
const MAX_EDITOR_HEIGHT = 520;
const DEFAULT_EDITOR_HEIGHT = 260;

/**
 * Full-screen profile customization workspace.
 *
 * Desktop layout:
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  Top bar: ← Back | Edit Profile | unsaved indicator     │
 *   ├─────────────────────────────────────────────────────────┤
 *   │  Tools panel (top-docked, resizable height)             │
 *   ╠═════════════════════════════════════════════════════════╣  ← drag handle
 *   │  Large live profile preview (dominant, full-width)      │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Mobile: toggle between Editor and Preview.
 */
export default function EditProfileLayout({ profile }: Props) {
  const [draft, setDraft] = useState<Partial<Profile>>({});
  const [activeView, setActiveView] = useState<"editor" | "preview">("editor");
  const [editorHeight, setEditorHeight] = useState(DEFAULT_EDITOR_HEIGHT);
  const dragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);

  const handleDraftChange = useCallback((newDraft: Partial<Profile>) => {
    setDraft(newDraft);
  }, []);

  const hasUnsavedChanges = Object.keys(draft).length > 0;

  // ── Resize drag logic ────────────────────────────────────────────────────
  function startDrag(e: React.MouseEvent | React.TouchEvent) {
    dragging.current = true;
    dragStartY.current = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragStartH.current = editorHeight;
    e.preventDefault();
  }

  function handleResizeKey(e: React.KeyboardEvent) {
    const STEP = 20;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setEditorHeight((h) => Math.min(MAX_EDITOR_HEIGHT, h + STEP));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setEditorHeight((h) => Math.max(MIN_EDITOR_HEIGHT, h - STEP));
    }
  }

  useEffect(() => {
    function onMove(e: MouseEvent | TouchEvent) {
      if (!dragging.current) return;
      // Prevent page scroll while dragging the resize handle
      e.preventDefault();
      const clientY = "touches" in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      const delta = clientY - dragStartY.current;
      const newH = Math.min(MAX_EDITOR_HEIGHT, Math.max(MIN_EDITOR_HEIGHT, dragStartH.current + delta));
      setEditorHeight(newH);
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

      {/* ── Desktop workspace: top tools + full-width preview below ─ */}
      <div className="hidden lg:flex lg:flex-col flex-1 min-h-0 overflow-hidden">

        {/* ── Editor tools panel (top-docked, resizable) ──────────── */}
        <div
          className="flex-shrink-0 bg-white border-b border-gray-200 overflow-y-auto"
          style={{ height: editorHeight }}
        >
          <div className="p-3">
            <ProfileEditor profile={profile} onDraftChange={handleDraftChange} />
          </div>
        </div>

        {/* ── Resize drag handle ───────────────────────────────────── */}
        <div
          role="separator"
          aria-label="Drag to resize panels"
          aria-valuenow={editorHeight}
          aria-valuemin={MIN_EDITOR_HEIGHT}
          aria-valuemax={MAX_EDITOR_HEIGHT}
          tabIndex={0}
          title="Drag or use ↑/↓ keys to resize"
          className="flex-shrink-0 h-2.5 bg-gray-200 hover:bg-indigo-200 active:bg-indigo-300 cursor-row-resize flex items-center justify-center transition-colors select-none z-10 group focus:outline-none focus:bg-indigo-200"
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          onKeyDown={handleResizeKey}
        >
          <div className="w-14 h-1 rounded-full bg-gray-400 group-hover:bg-indigo-400 transition-colors" />
        </div>

        {/* ── Preview canvas (full width, fills rest) ──────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <ProfilePreviewPanel profile={profile} draftOverrides={draft} />
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
