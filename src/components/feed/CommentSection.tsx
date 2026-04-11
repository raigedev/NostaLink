"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Comment {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  author?: { username: string; display_name: string | null };
}

export default function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("comments")
      .select("*, author:profiles!author_id(username, display_name)")
      .eq("post_id", postId)
      .order("created_at")
      .then(({ data }) => setComments((data as Comment[]) ?? []));
  }, [postId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("comments")
      .insert({ post_id: postId, author_id: user.id, content: text.trim() })
      .select("*, author:profiles!author_id(username, display_name)")
      .single();

    if (data) setComments((prev) => [...prev, data as Comment]);
    setText("");
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2">
          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">
            👤
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1">
            <p className="text-xs font-semibold text-gray-700">
              {c.author?.display_name || c.author?.username}
            </p>
            <p className="text-xs text-gray-600">{c.content}</p>
          </div>
        </div>
      ))}
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 text-xs border border-gray-200 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-full text-xs disabled:opacity-50 hover:bg-indigo-700 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}
