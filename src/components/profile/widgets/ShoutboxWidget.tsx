"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Shout {
  id: string;
  content: string;
  created_at: string;
  author?: { username: string };
}

interface Props {
  profileId: string;
}

export default function ShoutboxWidget({ profileId }: Props) {
  const [shouts, setShouts] = useState<Shout[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("shoutbox_messages")
      .select("*, author:profiles!author_id(username)")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!error) setShouts((data as Shout[]) ?? []);
      });

    const channel = supabase
      .channel(`shoutbox:${profileId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "shoutbox_messages",
        filter: `profile_id=eq.${profileId}`,
      }, (payload) => {
        setShouts((prev) => [payload.new as Shout, ...prev.slice(0, 19)]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profileId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("shoutbox_messages").insert({
      profile_id: profileId,
      author_id: user.id,
      content: text.trim(),
    });
    setText("");
  }

  return (
    <div className="fp-section">
      <div className="fp-section-header teal">💬 Shoutbox</div>
      <div className="fp-section-body">
        <form onSubmit={send} className="flex gap-2 mb-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Say something…"
            className="fp-widget-input"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="fp-btn-widget"
          >
            Shout
          </button>
        </form>
        <div style={{ maxHeight: "var(--fp-scroll-height)", overflowY: "auto" }}>
          {shouts.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "baseline", gap: "4px", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ fontWeight: "bold", color: "var(--fp-shout-highlight)" }}>{s.author?.username}:</span>
              <span style={{ opacity: 0.85 }}>{s.content}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
