"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Friend {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Props {
  profileId: string;
  currentTopFriends: string[];
  onSave: (ids: string[]) => void;
}

export default function Top8Editor({ profileId, currentTopFriends, onSave }: Props) {
  const [allFriends, setAllFriends] = useState<Friend[]>([]);
  const [topIds, setTopIds] = useState<string[]>(currentTopFriends.slice(0, 8));
  const [loading, setLoading] = useState(true);
  const dragIndex = useRef<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("friendships")
      .select("user_id, friend_id, user:profiles!user_id(id, username, display_name, avatar_url), friend:profiles!friend_id(id, username, display_name, avatar_url)")
      .or(`user_id.eq.${profileId},friend_id.eq.${profileId}`)
      .eq("status", "accepted")
      .then(({ data }) => {
        const friends: Friend[] = [];
        for (const row of data ?? []) {
          const other = row.user_id === profileId
            ? (row.friend as unknown as Friend)
            : (row.user as unknown as Friend);
          if (other?.id) friends.push(other);
        }
        setAllFriends(friends);
        setLoading(false);
      });
  }, [profileId]);

  const topFriends = topIds
    .map((id) => allFriends.find((f) => f.id === id))
    .filter(Boolean) as Friend[];

  const slots = Array.from({ length: 8 }, (_, i) => topFriends[i] ?? null);
  const availableFriends = allFriends.filter((f) => !topIds.includes(f.id));

  function addToTop(friend: Friend) {
    if (topIds.length >= 8) return;
    setTopIds((prev) => [...prev, friend.id]);
  }

  function removeFromTop(id: string) {
    setTopIds((prev) => prev.filter((i) => i !== id));
  }

  // HTML5 Drag and Drop for reordering the top 8 grid
  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === index) return;
    setTopIds((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
    dragIndex.current = index;
  }

  function handleDragEnd() {
    dragIndex.current = null;
  }

  if (loading) {
    return <p className="text-sm text-gray-500 py-4">Loading friends…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2 text-sm">Your Top 8 (drag to reorder)</h3>
        <p className="text-xs text-gray-500 mb-3">
          Select up to 8 friends to feature on your profile.
        </p>
        <div className="grid grid-cols-4 gap-3">
          {slots.map((friend, i) => (
            <div
              key={friend?.id ?? `empty-${i}`}
              draggable={!!friend}
              onDragStart={() => friend && handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition ${
                friend
                  ? "border-indigo-200 bg-indigo-50 cursor-grab active:cursor-grabbing"
                  : "border-dashed border-gray-200 bg-gray-50"
              }`}
            >
              {friend ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-lg flex-shrink-0">
                    {friend.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={friend.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : "👤"}
                  </div>
                  <p className="text-xs text-center truncate w-full font-medium">
                    {friend.display_name || friend.username}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeFromTop(friend.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    remove
                  </button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-2xl">
                    +
                  </div>
                  <p className="text-xs text-gray-300">Empty</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {availableFriends.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2 text-sm">Add Friends</h3>
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            {availableFriends.map((friend) => (
              <button
                key={friend.id}
                type="button"
                onClick={() => addToTop(friend)}
                disabled={topIds.length >= 8}
                className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition text-left disabled:opacity-40"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-sm flex-shrink-0">
                  {friend.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={friend.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : "👤"}
                </div>
                <span className="text-xs font-medium truncate">
                  {friend.display_name || friend.username}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {allFriends.length === 0 && (
        <div className="py-8 text-center text-gray-400">
          <p className="text-3xl mb-2">👥</p>
          <p className="text-sm">No friends yet.</p>
          <Link href="/friends" className="text-xs text-indigo-500 hover:underline mt-1 block">
            Find friends →
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={() => onSave(topIds)}
        className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
      >
        Save Top 8
      </button>
    </div>
  );
}
