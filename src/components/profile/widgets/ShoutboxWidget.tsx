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
    <div className="p-4 rounded-xl border" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
      <h3 className="font-semibold mb-3">💬 Shoutbox</h3>
      <form onSubmit={send} className="flex gap-2 mb-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Say something…"
          className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-transparent"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs disabled:opacity-50 hover:bg-indigo-700 transition"
        >
          Shout
        </button>
      </form>
      <div className="space-y-1.5 max-h-36 overflow-y-auto">
        {shouts.map((s) => (
          <div key={s.id} className="flex items-baseline gap-1 text-xs">
            <span className="font-semibold text-indigo-600">{s.author?.username}:</span>
            <span className="opacity-80">{s.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
