"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import type { Profile } from "@/app/actions/profile";
import ProfileEditor from "./ProfileEditor";
import ProfilePreviewPanel from "./ProfilePreviewPanel";

interface Props {
  profile: Profile;
}

type PanelPosition = "left" | "right" | "top" | "bottom";

const MIN_PANEL_WIDTH = 280;
const MAX_PANEL_WIDTH = 600;
const DEFAULT_PANEL_WIDTH = 360;

const MIN_PANEL_HEIGHT = 200;
const MAX_PANEL_HEIGHT = 500;
const DEFAULT_PANEL_HEIGHT = 320;

const LS_POSITION = "editprofile_panel_position";
const LS_WIDTH = "editprofile_panel_width";
const LS_HEIGHT = "editprofile_panel_height";

function readLS(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch { /* ignore */ }
}

const POSITION_OPTIONS: { pos: PanelPosition; icon: string; label: string }[] = [
  { pos: "top",    icon: "⬆", label: "Top"    },
  { pos: "left",   icon: "⬅", label: "Left"   },
  { pos: "right",  icon: "➡", label: "Right"  },
  { pos: "bottom", icon: "⬇", label: "Bottom" },
];

/**
 * Full-screen profile customization workspace.
 *
 * Desktop layout supports four panel positions: left, right, top, bottom.
 * The tools panel is resizable and collapsible in every position.
 * The user's preference is persisted in localStorage.
 *
 * Mobile: toggle between Editor and Preview (unchanged).
 */
export default function EditProfileLayout({ profile }: Props) {
  const [draft, setDraft] = useState<Partial<Profile>>({});
  const [activeView, setActiveView] = useState<"editor" | "preview">("editor");
  const [panelPosition, setPanelPosition] = useState<PanelPosition>("right");
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [panelHeight, setPanelHeight] = useState(DEFAULT_PANEL_HEIGHT);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPositionPicker, setShowPositionPicker] = useState(false);

  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartW = useRef(0);
  const dragStartH = useRef(0);

  // Keep a ref to the current position so drag event listeners always read
  // the latest value without needing to re-register on every position change.
  const panelPositionRef = useRef<PanelPosition>("right");
  panelPositionRef.current = panelPosition;

  // ── Load persisted preferences on mount ─────────────────────────────────
  useEffect(() => {
    const savedPosition = readLS(LS_POSITION, "right");
    const validPositions = POSITION_OPTIONS.map((o) => o.pos);
    if (validPositions.includes(savedPosition as PanelPosition)) {
      const pos = savedPosition as PanelPosition;
      setPanelPosition(pos);
      panelPositionRef.current = pos;
    }
    const savedWidth = parseInt(readLS(LS_WIDTH, String(DEFAULT_PANEL_WIDTH)), 10);
    if (!isNaN(savedWidth)) {
      setPanelWidth(Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, savedWidth)));
    }
    const savedHeight = parseInt(readLS(LS_HEIGHT, String(DEFAULT_PANEL_HEIGHT)), 10);
    if (!isNaN(savedHeight)) {
      setPanelHeight(Math.min(MAX_PANEL_HEIGHT, Math.max(MIN_PANEL_HEIGHT, savedHeight)));
    }
  }, []);

  const handleDraftChange = useCallback((newDraft: Partial<Profile>) => {
    setDraft(newDraft);
  }, []);

  const hasUnsavedChanges = Object.keys(draft).length > 0;

  const isHorizontal = panelPosition === "left" || panelPosition === "right";

  function changePosition(pos: PanelPosition) {
    setPanelPosition(pos);
    writeLS(LS_POSITION, pos);
    setShowPositionPicker(false);
    setIsCollapsed(false);
  }

  // ── Size adjustment helpers ──────────────────────────────────────────────
  function adjustPanelWidth(delta: number) {
    setPanelWidth((w) => {
      const v = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, w + delta));
      writeLS(LS_WIDTH, String(v));
      return v;
    });
  }

  function adjustPanelHeight(delta: number) {
    setPanelHeight((h) => {
      const v = Math.min(MAX_PANEL_HEIGHT, Math.max(MIN_PANEL_HEIGHT, h + delta));
      writeLS(LS_HEIGHT, String(v));
      return v;
    });
  }

  // ── Resize drag logic ────────────────────────────────────────────────────
  function startDrag(e: React.MouseEvent | React.TouchEvent) {
    if (isCollapsed) return;
    dragging.current = true;
    dragStartX.current = "touches" in e ? e.touches[0].clientX : e.clientX;
    dragStartY.current = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragStartW.current = panelWidth;
    dragStartH.current = panelHeight;
    e.preventDefault();
  }

  function handleResizeKey(e: React.KeyboardEvent) {
    if (isCollapsed) return;
    const STEP = 20;
    if (isHorizontal) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        adjustPanelWidth(panelPosition === "right" ? STEP : -STEP);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        adjustPanelWidth(panelPosition === "right" ? -STEP : STEP);
      }
    } else {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        adjustPanelHeight(panelPosition === "bottom" ? STEP : -STEP);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        adjustPanelHeight(panelPosition === "bottom" ? -STEP : STEP);
      }
    }
  }

  useEffect(() => {
    function onMove(e: MouseEvent | TouchEvent) {
      if (!dragging.current) return;
      // Prevent page scroll while dragging the resize handle.
      e.preventDefault();
      const pos = panelPositionRef.current;
      const horizontal = pos === "left" || pos === "right";
      if (horizontal) {
        const clientX = "touches" in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
        // For right panel: dragging left increases width.
        // For left panel: dragging right increases width.
        const delta = pos === "right"
          ? dragStartX.current - clientX
          : clientX - dragStartX.current;
        const newW = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, dragStartW.current + delta));
        setPanelWidth(newW);
        writeLS(LS_WIDTH, String(newW));
      } else {
        const clientY = "touches" in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
        // For bottom panel: dragging up increases height.
        // For top panel: dragging down increases height.
        const delta = pos === "bottom"
          ? dragStartY.current - clientY
          : clientY - dragStartY.current;
        const newH = Math.min(MAX_PANEL_HEIGHT, Math.max(MIN_PANEL_HEIGHT, dragStartH.current + delta));
        setPanelHeight(newH);
        writeLS(LS_HEIGHT, String(newH));
      }
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

  // Close position picker on outside click.
  useEffect(() => {
    if (!showPositionPicker) return;
    function handleOutsideClick() { setShowPositionPicker(false); }
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [showPositionPicker]);

  // ── Collapse toggle arrow direction ──────────────────────────────────────
  function getCollapseIcon(): string {
    if (panelPosition === "right")  return isCollapsed ? "›" : "‹";
    if (panelPosition === "left")   return isCollapsed ? "‹" : "›";
    if (panelPosition === "top")    return isCollapsed ? "∧" : "∨";
    /* bottom */                    return isCollapsed ? "∨" : "∧";
  }

  // Collapse button sits on the edge of the handle that faces the tools panel.
  function getCollapseButtonPositionClass(): string {
    if (panelPosition === "right")  return "top-1/2 -translate-y-1/2 -right-3.5";
    if (panelPosition === "left")   return "top-1/2 -translate-y-1/2 -left-3.5";
    if (panelPosition === "top")    return "left-1/2 -translate-x-1/2 -top-3.5";
    /* bottom */                    return "left-1/2 -translate-x-1/2 -bottom-3.5";
  }

  // ── Desktop workspace sub-elements ──────────────────────────────────────
  const previewCanvas = (
    <div className={`flex-1 overflow-y-auto ${isHorizontal ? "min-w-0" : "min-h-0"}`}>
      <ProfilePreviewPanel profile={profile} draftOverrides={draft} />
    </div>
  );

  const panelBorderClass = {
    right:  "border-l",
    left:   "border-r",
    top:    "border-b",
    bottom: "border-t",
  }[panelPosition];

  const toolsPanel = (
    <div
      className={`flex-shrink-0 bg-white ${panelBorderClass} border-gray-200 transition-all duration-300 ${isCollapsed ? "overflow-hidden" : "overflow-y-auto"}`}
      style={isHorizontal
        ? { width:  isCollapsed ? 0 : panelWidth  }
        : { height: isCollapsed ? 0 : panelHeight }
      }
    >
      {!isCollapsed && (
        <div
          className="p-2"
          style={isHorizontal
            ? { minWidth:  MIN_PANEL_WIDTH  }
            : { minHeight: MIN_PANEL_HEIGHT }
          }
        >
          <ProfileEditor profile={profile} onDraftChange={handleDraftChange} />
        </div>
      )}
    </div>
  );

  const resizeHandle = (
    <div
      role="separator"
      aria-label="Drag to resize tools panel"
      aria-valuenow={isCollapsed ? 0 : (isHorizontal ? panelWidth : panelHeight)}
      aria-valuemin={isHorizontal ? MIN_PANEL_WIDTH  : MIN_PANEL_HEIGHT}
      aria-valuemax={isHorizontal ? MAX_PANEL_WIDTH  : MAX_PANEL_HEIGHT}
      aria-orientation={isHorizontal ? "vertical" : "horizontal"}
      tabIndex={0}
      title={isCollapsed
        ? "Tools panel is collapsed"
        : `Drag or use ${isHorizontal ? "←/→" : "↑/↓"} keys to resize`
      }
      className={`flex-shrink-0 bg-gray-200 hover:bg-indigo-200 active:bg-indigo-300 transition-colors select-none z-10 group focus:outline-none focus:bg-indigo-200 relative ${
        isHorizontal
          ? `w-2.5 flex flex-col items-center justify-center ${isCollapsed ? "cursor-default" : "cursor-col-resize"}`
          : `h-2.5 flex flex-row items-center justify-center ${isCollapsed ? "cursor-default" : "cursor-row-resize"}`
      }`}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
      onKeyDown={handleResizeKey}
    >
      {isHorizontal
        ? <div className="h-14 w-1 rounded-full bg-gray-400 group-hover:bg-indigo-400 transition-colors" />
        : <div className="w-14 h-1 rounded-full bg-gray-400 group-hover:bg-indigo-400 transition-colors" />
      }

      {/* ── Collapse / Expand toggle button ──────────────────────── */}
      <button
        type="button"
        onClick={() => setIsCollapsed((c) => !c)}
        aria-label={isCollapsed ? "Expand tools panel" : "Collapse tools panel"}
        title={isCollapsed ? "Expand tools panel" : "Collapse tools panel"}
        className={`absolute w-7 h-7 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-400 hover:shadow-md transition-all z-20 text-xs ${getCollapseButtonPositionClass()}`}
      >
        {getCollapseIcon()}
      </button>
    </div>
  );

  // Compose preview + handle + panel in the correct order for each position.
  function desktopChildren() {
    if (panelPosition === "right" || panelPosition === "bottom") {
      return <>{previewCanvas}{resizeHandle}{toolsPanel}</>;
    }
    return <>{toolsPanel}{resizeHandle}{previewCanvas}</>;
  }

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

        {/* Right side: unsaved indicator + panel position picker + mobile toggle */}
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

          {/* ── Panel position picker — desktop only ──────────────── */}
          <div className="relative hidden lg:block">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowPositionPicker((v) => !v); }}
              title="Change tools panel position"
              aria-label="Change tools panel position"
              aria-expanded={showPositionPicker}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 rounded-lg transition-all"
            >
              <span>{POSITION_OPTIONS.find((o) => o.pos === panelPosition)?.icon}</span>
              <span className="hidden sm:inline">Panel</span>
            </button>

            {showPositionPicker && (
              <div
                className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-50 min-w-[148px]"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-xs text-gray-400 font-medium px-2 pb-1.5">Tools position</p>
                <div className="grid grid-cols-2 gap-1">
                  {POSITION_OPTIONS.map(({ pos, icon, label }) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => changePosition(pos)}
                      className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs transition-all ${
                        panelPosition === pos
                          ? "bg-indigo-100 text-indigo-700 border border-indigo-300 font-medium"
                          : "text-gray-600 hover:bg-gray-100 border border-transparent"
                      }`}
                    >
                      <span className="text-base leading-none">{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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

      {/* ── Desktop workspace (all four positions) ────────────────── */}
      <div className={`hidden lg:flex flex-1 min-h-0 overflow-hidden ${isHorizontal ? "flex-row" : "flex-col"}`}>
        {desktopChildren()}
      </div>

      {/* ── Mobile workspace: toggle between editor and preview ───── */}
      <div className="lg:hidden flex flex-col flex-1 min-h-0 overflow-hidden">
        {activeView === "editor" ? (
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-2">
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
