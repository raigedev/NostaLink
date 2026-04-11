"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";

interface Entry {
  id: string;
  content: string;
  created_at: string;
  author?: { username: string; display_name: string | null };
}

interface Props {
  profileId: string;
}

export default function GuestbookWidget({ profileId }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("guestbook_entries")
      .select("*, author:profiles!author_id(username, display_name)")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setEntries((data as Entry[]) ?? []));
  }, [profileId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("guestbook_entries")
      .insert({ profile_id: profileId, author_id: user.id, content: text.trim() })
      .select("*, author:profiles!author_id(username, display_name)")
      .single();

    if (data) setEntries((prev) => [data as Entry, ...prev]);
    setText("");
    setLoading(false);
  }

  return (
    <div className="p-4 rounded-xl border" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
      <h3 className="font-semibold mb-3">📖 Guestbook</h3>
      <form onSubmit={submit} className="flex gap-2 mb-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Leave a message…"
          className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-transparent"
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs disabled:opacity-50 hover:bg-indigo-700 transition"
        >
          Sign
        </button>
      </form>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {entries.map((e) => (
          <div key={e.id} className="text-xs border-b border-gray-100 pb-2">
            <span className="font-semibold">{e.author?.display_name || e.author?.username}</span>
            <span className="text-gray-400 ml-2">{formatRelativeTime(e.created_at)}</span>
            <p className="mt-0.5 opacity-80">{e.content}</p>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-xs opacity-50 text-center py-2">No entries yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}
