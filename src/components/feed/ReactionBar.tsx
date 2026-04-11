"use client";

import { useState, useOptimistic } from "react";
import { createClient } from "@/lib/supabase/client";

const REACTIONS = [
  { type: "like", emoji: "👍" },
  { type: "love", emoji: "❤️" },
  { type: "haha", emoji: "😂" },
  { type: "wow", emoji: "😮" },
  { type: "sad", emoji: "😢" },
  { type: "angry", emoji: "😡" },
];

interface Props {
  postId: string;
}

interface ReactionCount {
  type: string;
  count: number;
  userReacted: boolean;
}

export default function ReactionBar({ postId }: Props) {
  const [counts, setCounts] = useState<ReactionCount[]>(
    REACTIONS.map((r) => ({ type: r.type, count: 0, userReacted: false }))
  );
  const [optimisticCounts, updateOptimistic] = useOptimistic(
    counts,
    (state, { type, delta }: { type: string; delta: number }) =>
      state.map((r) =>
        r.type === type
          ? { ...r, count: r.count + delta, userReacted: delta > 0 }
          : r
      )
  );

  async function handleReact(type: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const current = counts.find((r) => r.type === type);
    if (current?.userReacted) {
      updateOptimistic({ type, delta: -1 });
      await supabase.from("reactions").delete().eq("post_id", postId).eq("user_id", user.id).eq("type", type);
      setCounts((prev) =>
        prev.map((r) => r.type === type ? { ...r, count: r.count - 1, userReacted: false } : r)
      );
    } else {
      updateOptimistic({ type, delta: 1 });
      await supabase.from("reactions").upsert({ post_id: postId, user_id: user.id, type });
      setCounts((prev) =>
        prev.map((r) => r.type === type ? { ...r, count: r.count + 1, userReacted: true } : r)
      );
    }
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {REACTIONS.map((r) => {
        const rc = optimisticCounts.find((c) => c.type === r.type)!;
        return (
          <button
            key={r.type}
            onClick={() => handleReact(r.type)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition ${
              rc.userReacted
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>{r.emoji}</span>
            {rc.count > 0 && <span>{rc.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
