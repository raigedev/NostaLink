"use client";

import { useState, useRef, useCallback } from "react";
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
}: {
  label: string;
  accept: string;
  onUpload: (formData: FormData) => Promise<{ success?: boolean; url?: string; error?: string } | null>;
  currentUrl?: string | null;
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

export default function ProfileEditor({ profile }: Props) {
  const [activeTab, setActiveTab] = useState("Basic Info");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    showMessage(result?.error ?? "Saved!");
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
  }

  async function handleTopFriendsSave(ids: string[]) {
    setSaving(true);
    const result = await updateTopFriends(ids);
    setSaving(false);
    showMessage(result?.error ?? "Top friends saved!");
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Photo</label>
                <FileUploadButton
                  label="Upload Cover"
                  accept="image/*"
                  currentUrl={profile.cover_url}
                  onUpload={uploadCoverPhoto}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                name="display_name"
                defaultValue={profile.display_name ?? ""}
                maxLength={50}
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
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
              <input
                name="headline"
                defaultValue={profile.headline ?? ""}
                maxLength={150}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                name="location"
                defaultValue={profile.location ?? ""}
                maxLength={100}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                name="website"
                type="url"
                defaultValue={profile.website ?? ""}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Status</label>
              <select
                name="relationship_status"
                defaultValue={profile.relationship_status ?? ""}
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
                onSelect={(id) => handleCustomSave({ theme_id: id })}
              />
            </div>
            <div>
              <h3 className="font-semibold mb-3">Font</h3>
              <FontSelector
                current={profile.font_id ?? "inter"}
                onSelect={(id) => handleCustomSave({ font_id: id })}
              />
            </div>
            <div>
              <h3 className="font-semibold mb-3">Color Scheme</h3>
              <ColorSchemeEditor onSave={(colors) => handleCustomSave(colors)} />
            </div>
            <div>
              <h3 className="font-semibold mb-3">Background</h3>
              <BackgroundEditor
                currentUrl={profile.bg_url ?? ""}
                currentMode={profile.bg_mode ?? "tiled"}
                currentColor={profile.bg_color ?? ""}
                onSave={(data) => handleCustomSave(data)}
              />
            </div>
          </div>
        )}

        {/* ── Tab 3: Custom CSS ───────────────────────────────────────── */}
        {activeTab === "Custom CSS" && (
          <CSSEditor
            defaultValue={profile.custom_css ?? ""}
            userId={profile.id}
            onSave={handleCssSave}
          />
        )}

        {/* ── Tab 4: Custom HTML ──────────────────────────────────────── */}
        {activeTab === "Custom HTML" && (
          <HTMLEditor
            defaultValue={profile.custom_html ?? ""}
            onSave={handleHtmlSave}
          />
        )}

        {/* ── Tab 5: Music ────────────────────────────────────────────── */}
        {activeTab === "Music" && (
          <MusicTab
            currentUrl={profile.profile_song_url ?? ""}
            onSaveUrl={(url) => handleCustomSave({ profile_song_url: url })}
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
}: {
  currentUrl: string;
  onSaveUrl: (url: string) => void;
}) {
  const [url, setUrl] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      <p className="text-sm text-gray-600">
        Upload an audio file or paste a direct URL to play on your profile.
        Supported: MP3, OGG, WAV (max 15MB).
      </p>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Audio File</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Choose File"}
            </button>
            {url && !uploading && <span className="text-xs text-green-600">✓ Audio set</span>}
          </div>
          {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
          <input
            ref={inputRef}
            type="file"
            accept="audio/mpeg,audio/ogg,audio/wav,.mp3,.ogg,.wav"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Or paste a URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/song.mp3"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {url && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
            {/* Audio preview for selected file */}
            <audio controls src={url} className="w-full" />
          </div>
        )}
        <button
          type="button"
          onClick={() => onSaveUrl(url)}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          Save Music URL
        </button>
      </div>
    </div>
  );
}
