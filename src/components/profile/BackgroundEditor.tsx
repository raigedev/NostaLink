"use client";

import { useState, useRef } from "react";
import { uploadProfileBackground } from "@/app/actions/profile";

interface Props {
  currentUrl: string;
  currentMode: string;
  currentColor: string;
  onSave: (data: { bg_url?: string; bg_mode?: string; bg_color?: string }) => void;
}

const modes = ["tiled", "stretched", "fixed", "parallax"] as const;

export default function BackgroundEditor({ currentUrl, currentMode, currentColor, onSave }: Props) {
  const [url, setUrl] = useState(currentUrl);
  const [mode, setMode] = useState(currentMode);
  const [color, setColor] = useState(currentColor);
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
    const result = await uploadProfileBackground(fd);
    setUploading(false);
    if (!result || "error" in result) {
      setUploadError(result && "error" in result ? result.error : "Upload failed");
    } else if ("url" in result && result.url) {
      setUrl(result.url);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Background Image</label>
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload Image"}
          </button>
          <span className="text-xs text-gray-400">or paste URL below (max 10MB)</span>
        </div>
        {uploadError && <p className="text-xs text-red-600 mb-2">{uploadError}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/pattern.png"
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Background preview" className="mt-2 h-20 w-full object-cover rounded-lg border border-gray-200" />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Background Mode</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {modes.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`py-2 px-3 rounded-lg border-2 text-sm font-medium capitalize transition ${
                mode === m ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fallback Color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color || "#ffffff"}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
          />
          <span className="text-sm text-gray-600">{color || "No color"}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onSave({ bg_url: url, bg_mode: mode, bg_color: color })}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
      >
        Save Background
      </button>
    </div>
  );
}
