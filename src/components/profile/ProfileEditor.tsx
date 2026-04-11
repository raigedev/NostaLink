"use client";

import { useState, useRef } from "react";
import type { Profile } from "@/app/actions/profile";
import { updateProfile, updateProfileCustomization } from "@/app/actions/profile";
import ThemeSelector from "./ThemeSelector";
import FontSelector from "./FontSelector";
import CSSEditor from "./CSSEditor";
import HTMLEditor from "./HTMLEditor";
import BackgroundEditor from "./BackgroundEditor";
import ColorSchemeEditor from "./ColorSchemeEditor";

interface Props {
  profile: Profile;
}

const tabs = ["Basic Info", "Appearance", "Background", "Custom Code", "Music"];

function MusicUrlInput({ defaultValue, onSave }: { defaultValue: string; onSave: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="url"
        defaultValue={defaultValue}
        placeholder="https://example.com/song.mp3"
        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        onClick={() => onSave(inputRef.current?.value ?? "")}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
      >
        Save Music
      </button>
    </div>
  );
}


export default function ProfileEditor({ profile }: Props) {
  const [activeTab, setActiveTab] = useState("Basic Info");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleBasicSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);
    setSaving(false);
    setMessage(result?.error ?? "Saved!");
  }

  async function handleCustomSave(data: Parameters<typeof updateProfileCustomization>[0]) {
    setSaving(true);
    const result = await updateProfileCustomization(data);
    setSaving(false);
    setMessage(result?.error ?? "Saved!");
  }

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
          <div className={`mb-4 p-3 rounded-lg text-sm ${message === "Saved!" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {message}
          </div>
        )}

        {activeTab === "Basic Info" && (
          <form onSubmit={handleBasicSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input name="display_name" defaultValue={profile.display_name ?? ""} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea name="bio" defaultValue={profile.bio ?? ""} rows={4} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
              <input name="mood" defaultValue={profile.mood ?? ""} placeholder="e.g. 💖 Feeling nostalgic" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
              <input name="headline" defaultValue={profile.headline ?? ""} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input name="location" defaultValue={profile.location ?? ""} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input name="website" type="url" defaultValue={profile.website ?? ""} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Status</label>
              <select name="relationship_status" defaultValue={profile.relationship_status ?? ""} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Prefer not to say</option>
                <option value="single">Single</option>
                <option value="in_relationship">In a relationship</option>
                <option value="married">Married</option>
                <option value="complicated">It&apos;s complicated</option>
              </select>
            </div>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        )}

        {activeTab === "Appearance" && (
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
              <ColorSchemeEditor
                onSave={(colors) => handleCustomSave(colors)}
              />
            </div>
          </div>
        )}

        {activeTab === "Background" && (
          <BackgroundEditor
            currentUrl={profile.bg_url ?? ""}
            currentMode={profile.bg_mode ?? "tiled"}
            currentColor={profile.bg_color ?? ""}
            onSave={(data) => handleCustomSave(data)}
          />
        )}

        {activeTab === "Custom Code" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Custom CSS</h3>
              <CSSEditor
                defaultValue={profile.custom_css ?? ""}
                onSave={(css) => handleCustomSave({ custom_css: css })}
              />
            </div>
            <div>
              <h3 className="font-semibold mb-3">Custom HTML</h3>
              <HTMLEditor
                defaultValue={profile.custom_html ?? ""}
                onSave={(html) => handleCustomSave({ custom_html: html })}
              />
            </div>
          </div>
        )}

        {activeTab === "Music" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Enter a direct URL to an audio file to play on your profile.</p>
            <MusicUrlInput defaultValue={profile.profile_song_url ?? ""} onSave={(url) => handleCustomSave({ profile_song_url: url })} />
          </div>
        )}
      </div>
    </div>
  );
}
