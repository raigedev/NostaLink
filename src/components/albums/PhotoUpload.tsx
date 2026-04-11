"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadPhoto } from "@/app/actions/albums";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface Props { albumId: string; onUploaded?: () => void }

export default function PhotoUpload({ albumId, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, WebP, and GIF files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.");
      return;
    }
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const path = `${albumId}/${Date.now()}-${file.name}`;
    const { data, error: upErr } = await supabase.storage.from("photos").upload(path, file);
    if (upErr || !data) { setError(upErr?.message ?? "Upload failed"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(path);
    await uploadPhoto(albumId, publicUrl);
    setUploading(false);
    onUploaded?.();
  }

  return (
    <div>
      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      <label className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition inline-block">
        {uploading ? "Uploading…" : "Upload Photo"}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
      </label>
    </div>
  );
}
