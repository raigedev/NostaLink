"use client";

import { useState, useCallback } from "react";
import type { Profile } from "@/app/actions/profile";
import ProfileEditor from "./ProfileEditor";
import ProfilePreviewPanel from "./ProfilePreviewPanel";

interface Props {
  profile: Profile;
}

/**
 * Wraps the profile editor with a live full-profile preview pane.
 *
 * Layout:
 *   - xl+ screens: two-column split — editor on the left, preview on the right
 *   - smaller screens: tab toggle between "Editor" and "Preview"
 */
export default function EditProfileLayout({ profile }: Props) {
  const [draft, setDraft] = useState<Partial<Profile>>({});
  const [activeView, setActiveView] = useState<"editor" | "preview">("editor");

  const handleDraftChange = useCallback((newDraft: Partial<Profile>) => {
    setDraft(newDraft);
  }, []);

  return (
    <>
      {/* ── Mobile / tablet toggle (visible below xl) ─────────────── */}
      <div className="xl:hidden flex items-center gap-0 mb-4 border border-gray-200 rounded-lg overflow-hidden w-fit">
        <button
          onClick={() => setActiveView("editor")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeView === "editor"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          ✏️ Editor
        </button>
        <button
          onClick={() => setActiveView("preview")}
          className={`px-4 py-2 text-sm font-medium transition border-l border-gray-200 ${
            activeView === "preview"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          👁 Preview
        </button>
      </div>

      {/* ── Two-pane layout ───────────────────────────────────────── */}
      <div className="xl:grid xl:grid-cols-[420px_1fr] xl:gap-4 xl:items-start">

        {/* Editor pane */}
        <div className={activeView === "preview" ? "hidden xl:block" : ""}>
          <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
          <ProfileEditor profile={profile} onDraftChange={handleDraftChange} />
        </div>

        {/* Preview pane */}
        <div
          className={`${activeView === "editor" ? "hidden xl:block" : ""} xl:sticky xl:top-[72px] xl:max-h-[calc(100vh-88px)] xl:overflow-y-auto rounded-xl border border-gray-200 overflow-hidden shadow-sm`}
        >
          <ProfilePreviewPanel profile={profile} draftOverrides={draft} />
        </div>
      </div>
    </>
  );
}
