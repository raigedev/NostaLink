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
      .then(({ data, error }) => {
        if (!error) setEntries((data as Entry[]) ?? []);
      });
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
    <div className="fp-section">
      <div className="fp-section-header blue">📖 Guestbook</div>
      <div className="fp-section-body">
        <form onSubmit={submit} className="flex gap-2 mb-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Leave a message…"
            className="fp-widget-input"
          />
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="fp-btn-widget"
          >
            Sign
          </button>
        </form>
        <div style={{ maxHeight: "var(--fp-scroll-height)", overflowY: "auto" }}>
          {entries.map((e) => (
            <div key={e.id} style={{ fontSize: "12px", borderBottom: "1px solid var(--fp-divider-color)", paddingBottom: "6px", marginBottom: "6px" }}>
              <span style={{ fontWeight: "bold", color: "var(--fp-author-highlight)" }}>{e.author?.display_name || e.author?.username}</span>
              <span style={{ color: "var(--fp-panel-text-muted)", marginLeft: "6px", fontSize: "11px" }}>{formatRelativeTime(e.created_at)}</span>
              <p style={{ marginTop: "2px", opacity: 0.85 }}>{e.content}</p>
            </div>
          ))}
          {entries.length === 0 && (
            <p style={{ fontSize: "12px", opacity: 0.5, textAlign: "center", padding: "8px 0" }}>No entries yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  );
}
