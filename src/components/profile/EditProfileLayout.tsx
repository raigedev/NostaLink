"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { Profile } from "@/app/actions/profile";
import ProfileEditor from "./ProfileEditor";
import ProfilePreviewPanel from "./ProfilePreviewPanel";

interface Props {
  profile: Profile;
}

/**
 * Full-screen profile customization workspace.
 *
 * Desktop layout:
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  Top bar: ← Back | Edit Profile | unsaved indicator     │
 *   ├──────────────┬──────────────────────────────────────────┤
 *   │  Editor      │                                          │
 *   │  panel       │   Large live profile preview             │
 *   │  (~360 px)   │   (remaining width)                      │
 *   └──────────────┴──────────────────────────────────────────┘
 *
 * Mobile: toggle between Editor and Preview.
 */
export default function EditProfileLayout({ profile }: Props) {
  const [draft, setDraft] = useState<Partial<Profile>>({});
  const [activeView, setActiveView] = useState<"editor" | "preview">("editor");

  const handleDraftChange = useCallback((newDraft: Partial<Profile>) => {
    setDraft(newDraft);
  }, []);

  const hasUnsavedChanges = Object.keys(draft).length > 0;

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

      {/* ── Main workspace ───────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Editor panel (left, narrow) ───────────────────────── */}
        <aside
          className={`
            ${activeView === "preview" ? "hidden" : "flex flex-col"}
            lg:flex lg:flex-col
            w-full lg:w-[360px] lg:flex-shrink-0
            bg-white border-r border-gray-200
            overflow-y-auto
          `}
        >
          <div className="p-4 flex-1">
            <ProfileEditor profile={profile} onDraftChange={handleDraftChange} />
          </div>
        </aside>

        {/* ── Preview canvas (right, large) ────────────────────── */}
        <div
          className={`
            ${activeView === "editor" ? "hidden" : "flex flex-col"}
            lg:flex lg:flex-col
            flex-1 min-w-0
            overflow-y-auto
          `}
        >
          <ProfilePreviewPanel profile={profile} draftOverrides={draft} />
        </div>
      </div>
    </div>
  );
}
