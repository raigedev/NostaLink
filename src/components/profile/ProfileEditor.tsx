"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/app/actions/profile";
import {
  updateProfile,
  updateProfileCustomization,
  uploadAvatar,
  uploadCoverPhoto,
  uploadProfileAudio,
  updateWidgets,
  updateTopFriends,
  updateCustomCss,
  updateCustomHtml,
} from "@/app/actions/profile";
import { USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH, USERNAME_PATTERN } from "@/lib/validations";
import { validateMusicUrl } from "@/lib/musicProvider";
import ThemeSelector from "./ThemeSelector";
import FontSelector from "./FontSelector";
import CSSEditor from "./CSSEditor";
import HTMLEditor from "./HTMLEditor";
import BackgroundEditor from "./BackgroundEditor";
import ColorSchemeEditor from "./ColorSchemeEditor";
import WidgetEditor from "./WidgetEditor";
import Top8Editor from "./Top8Editor";

interface Props {
  profile: Profile;
  /** Called whenever the in-editor draft changes so a parent can show a live preview */
  onDraftChange?: (draft: Partial<Profile>) => void;
}

const tabs = [
  "Basic Info",
  "Theme & Colors",
  "Custom CSS",
  "Custom HTML",
  "Music",
  "Widgets",
  "Top 8",
];

function FileUploadButton({
  label,
  accept,
  onUpload,
  currentUrl,
  onUrlChange,
}: {
  label: string;
  accept: string;
  onUpload: (formData: FormData) => Promise<{ success?: boolean; url?: string; error?: string } | null>;
  currentUrl?: string | null;
  onUrlChange?: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(currentUrl ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const result = await onUpload(fd);
    setUploading(false);
    if (!result || "error" in result) {
      setError((result && "error" in result ? result.error : null) ?? "Upload failed");
    } else if ("url" in result && result.url) {
      setUrl(result.url as string);
      onUrlChange?.(result.url as string);
    }
  }

  return (
    <div className="space-y-2">
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          {uploading ? "Uploading…" : label}
        </button>
        {url && <span className="text-xs text-gray-400 truncate max-w-[160px]">✓ Uploaded</span>}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </div>
  );
}

export type WidgetConfig = import("@/types/widget").WidgetConfig;

export default function ProfileEditor({ profile, onDraftChange }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Basic Info");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // ── Draft state for live preview ──────────────────────────────────────────
  // Using a ref (not state) since the draft doesn't need to re-render this
  // component — the parent's ProfilePreviewPanel handles that.
  const draftRef = useRef<Partial<Profile>>({
    username: profile.username,
    display_name: profile.display_name,
    bio: profile.bio,
    mood: profile.mood,
    headline: profile.headline,
    location: profile.location,
    website: profile.website,
    relationship_status: profile.relationship_status,
    avatar_url: profile.avatar_url,
    cover_url: profile.cover_url,
    theme_id: profile.theme_id,
    font_id: profile.font_id,
    bg_url: profile.bg_url,
    bg_mode: profile.bg_mode,
    bg_color: profile.bg_color,
    custom_css: profile.custom_css,
    custom_html: profile.custom_html,
    profile_song_url: profile.profile_song_url,
    widgets: profile.widgets,
    top_friends: profile.top_friends,
  });

  function updateDraft(updates: Partial<Profile>) {
    draftRef.current = { ...draftRef.current, ...updates };
    onDraftChange?.(draftRef.current);
  }

  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 4000);
  }, []);

  async function handleBasicSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);
    setSaving(false);
    if (result?.error) {
      showMessage(result.error);
    } else {
      showMessage("Saved!");
      if (result?.newUsername) {
        updateDraft({ username: result.newUsername });
        router.push(`/profile/${result.newUsername}/edit`);
      }
    }
  }

  async function handleCustomSave(data: Parameters<typeof updateProfileCustomization>[0]) {
    setSaving(true);
    const result = await updateProfileCustomization(data);
    setSaving(false);
    showMessage(result?.error ?? "Saved!");
  }

  async function handleCssSave(css: string) {
    setSaving(true);
    const result = await updateCustomCss(css);
    setSaving(false);
    showMessage(result?.error ?? "CSS saved!");
  }

  async function handleHtmlSave(html: string) {
    setSaving(true);
    const result = await updateCustomHtml(html);
    setSaving(false);
    showMessage(result?.error ?? "HTML saved!");
  }

  async function handleWidgetsSave(widgets: Record<string, unknown>[]) {
    setSaving(true);
    const result = await updateWidgets(widgets);
    setSaving(false);
    showMessage(result?.error ?? "Widgets saved!");
    if (!result?.error) updateDraft({ widgets });
  }

  async function handleTopFriendsSave(ids: string[]) {
    setSaving(true);
    const result = await updateTopFriends(ids);
    setSaving(false);
    showMessage(result?.error ?? "Top friends saved!");
    if (!result?.error) updateDraft({ top_friends: ids });
  }

  const isSuccess = (msg: string) =>
    ["Saved!", "CSS saved!", "HTML saved!", "Widgets saved!", "Top friends saved!"].includes(msg);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition ${
              activeTab === tab
                ? "border-b-2 border-indigo-600 text-indigo-600 bg-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-6">
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              isSuccess(message)
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* ── Tab 1: Basic Info ───────────────────────────────────────── */}
        {activeTab === "Basic Info" && (
          <form onSubmit={handleBasicSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
                <FileUploadButton
                  label="Upload Avatar"
                  accept="image/*"
                  currentUrl={profile.avatar_url}
                  onUpload={uploadAvatar}
                  onUrlChange={(url) => updateDraft({ avatar_url: url })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Photo</label>
                <FileUploadButton
                  label="Upload Cover"
                  accept="image/*"
                  currentUrl={profile.cover_url}
                  onUpload={uploadCoverPhoto}
                  onUrlChange={(url) => updateDraft({ cover_url: url })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="flex items-center">
                <span className="px-3 py-2 border border-r-0 rounded-l-lg bg-gray-50 text-gray-500 text-sm">@</span>
                <input
                  name="username"
                  defaultValue={profile.username}
                  minLength={USERNAME_MIN_LENGTH}
                  maxLength={USERNAME_MAX_LENGTH}
                  pattern={USERNAME_PATTERN}
                  title="Lowercase letters, numbers, and underscores only"
                  onChange={(e) => updateDraft({ username: e.target.value })}
                  className="w-full px-3 py-2 border rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Lowercase letters, numbers, and underscores. 3–30 characters.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                name="display_name"
                defaultValue={profile.display_name ?? ""}
                maxLength={50}
                onChange={(e) => updateDraft({ display_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                name="bio"
                defaultValue={profile.bio ?? ""}
                rows={4}
                maxLength={500}
                onChange={(e) => updateDraft({ bio: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
              <input
                name="mood"
                defaultValue={profile.mood ?? ""}
                placeholder="e.g. 💖 Feeling nostalgic"
                maxLength={100}
                onChange={(e) => updateDraft({ mood: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
              <input
                name="headline"
                defaultValue={profile.headline ?? ""}
                maxLength={150}
                onChange={(e) => updateDraft({ headline: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                name="location"
                defaultValue={profile.location ?? ""}
                maxLength={100}
                onChange={(e) => updateDraft({ location: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                name="website"
                type="url"
                defaultValue={profile.website ?? ""}
                onChange={(e) => updateDraft({ website: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Status</label>
              <select
                name="relationship_status"
                defaultValue={profile.relationship_status ?? ""}
                onChange={(e) => updateDraft({ relationship_status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Prefer not to say</option>
                <option value="single">Single</option>
                <option value="in_relationship">In a relationship</option>
                <option value="married">Married</option>
                <option value="complicated">It&apos;s complicated</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        )}

        {/* ── Tab 2: Theme & Colors ───────────────────────────────────── */}
        {activeTab === "Theme & Colors" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Theme</h3>
              <ThemeSelector
                current={profile.theme_id ?? "minimalist"}
                onSelect={(id) => {
                  updateDraft({ theme_id: id });
                  handleCustomSave({ theme_id: id });
                }}
              />
            </div>
            <div>
              <h3 className="font-semibold mb-3">Font</h3>
              <FontSelector
                current={profile.font_id ?? "inter"}
                onSelect={(id) => {
                  updateDraft({ font_id: id });
                  handleCustomSave({ font_id: id });
                }}
              />
            </div>
            <div>
              <h3 className="font-semibold mb-3">Color Scheme</h3>
              <ColorSchemeEditor onSave={(colors) => {
                updateDraft(colors);
                handleCustomSave(colors);
              }} />
            </div>
            <div>
              <h3 className="font-semibold mb-3">Background</h3>
              <BackgroundEditor
                currentUrl={profile.bg_url ?? ""}
                currentMode={profile.bg_mode ?? "tiled"}
                currentColor={profile.bg_color ?? ""}
                onSave={(data) => {
                  updateDraft(data);
                  handleCustomSave(data);
                }}
              />
            </div>
          </div>
        )}

        {/* ── Tab 3: Custom CSS ───────────────────────────────────────── */}
        {activeTab === "Custom CSS" && (
          <CSSEditor
            defaultValue={profile.custom_css ?? ""}
            userId={profile.id}
            onSave={(css) => {
              updateDraft({ custom_css: css });
              handleCssSave(css);
            }}
            onChange={(css) => updateDraft({ custom_css: css })}
          />
        )}

        {/* ── Tab 4: Custom HTML ──────────────────────────────────────── */}
        {activeTab === "Custom HTML" && (
          <HTMLEditor
            defaultValue={profile.custom_html ?? ""}
            onSave={(html) => {
              updateDraft({ custom_html: html });
              handleHtmlSave(html);
            }}
            onChange={(html) => updateDraft({ custom_html: html })}
          />
        )}

        {/* ── Tab 5: Music ────────────────────────────────────────────── */}
        {activeTab === "Music" && (
          <MusicTab
            currentUrl={profile.profile_song_url ?? ""}
            onSaveUrl={(url) => {
              updateDraft({ profile_song_url: url });
              handleCustomSave({ profile_song_url: url });
            }}
            onUrlChange={(url) => updateDraft({ profile_song_url: url })}
          />
        )}

        {/* ── Tab 6: Widgets ──────────────────────────────────────────── */}
        {activeTab === "Widgets" && (
          <WidgetEditor
            initialWidgets={(profile.widgets ?? []) as unknown as WidgetConfig[]}
            profileId={profile.id}
            onSave={handleWidgetsSave}
          />
        )}

        {/* ── Tab 7: Top 8 ────────────────────────────────────────────── */}
        {activeTab === "Top 8" && (
          <Top8Editor
            profileId={profile.id}
            currentTopFriends={profile.top_friends ?? []}
            onSave={handleTopFriendsSave}
          />
        )}
      </div>
    </div>
  );
}

// ── Music Tab ─────────────────────────────────────────────────────────────────

function MusicTab({
  currentUrl,
  onSaveUrl,
  onUrlChange,
}: {
  currentUrl: string;
  onSaveUrl: (url: string) => void;
  onUrlChange?: (url: string) => void;
}) {
  const [url, setUrl] = useState(currentUrl);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUrl(e.target.value);
    setUrlError(null);
    onUrlChange?.(e.target.value);
  }

  function handleSaveUrl() {
    if (!url.trim()) {
      // Allow clearing the music source.
      onSaveUrl("");
      return;
    }
    const result = validateMusicUrl(url.trim());
    if (!result.valid) {
      setUrlError(result.error ?? "Invalid URL");
      return;
    }
    onSaveUrl(url.trim());
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadProfileAudio(fd);
    setUploading(false);
    if (!result || "error" in result) {
      setUploadError(result && "error" in result ? result.error : "Upload failed");
    } else if ("url" in result && result.url) {
      setUrl(result.url);
      onSaveUrl(result.url);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Primary: provider link ─────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Profile Music Source</h3>
        <p className="text-sm text-gray-500 mb-3">
          Paste a link from one of the supported providers below. Visitors will
          see a compact music widget on your profile with a click-to-play button.
        </p>

        {/* Supported providers */}
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            { label: "YouTube", color: "bg-red-50 text-red-700 border-red-200" },
            { label: "SoundCloud", color: "bg-orange-50 text-orange-700 border-orange-200" },
            { label: "Spotify", color: "bg-green-50 text-green-700 border-green-200" },
          ].map(({ label, color }) => (
            <span
              key={label}
              className={`px-2 py-0.5 rounded text-xs font-medium border ${color}`}
            >
              ✓ {label}
            </span>
          ))}
        </div>

        <input
          type="url"
          value={url}
          onChange={handleUrlChange}
          placeholder="https://open.spotify.com/track/… or youtube.com/watch?v=…"
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            urlError ? "border-red-400" : "border-gray-300"
          }`}
        />
        {urlError && (
          <p className="text-xs text-red-600 mt-1">{urlError}</p>
        )}
        {url && !urlError && (
          <p className="text-xs text-green-600 mt-1">✓ URL entered</p>
        )}

        <button
          type="button"
          onClick={handleSaveUrl}
          className="mt-3 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          Save Music
        </button>
      </div>

      {/* ── Secondary: original audio upload (de-emphasised) ────────── */}
      <details className="border border-gray-200 rounded-lg">
        <summary className="px-4 py-2 text-xs font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700">
          ▸ Upload original / licensed audio instead
        </summary>
        <div className="px-4 py-3 space-y-2 border-t border-gray-100">
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            ⚠️ Only upload audio you created or have an explicit license to use.
            Do not upload copyrighted music you don&apos;t own.
          </p>
          <p className="text-xs text-gray-500">Supported: MP3, OGG, WAV (max 15 MB)</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Choose File"}
            </button>
            {url && !uploading && (
              <span className="text-xs text-green-600">✓ Audio set</span>
            )}
          </div>
          {uploadError && (
            <p className="text-xs text-red-600">{uploadError}</p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="audio/mpeg,audio/ogg,audio/wav,.mp3,.ogg,.wav"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </details>
    </div>
  );
}
