"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface SearchProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface Props { query: string }

export default function SearchResults({ query }: Props) {
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20)
      .then(({ data }) => {
        setProfiles((data as SearchProfile[]) ?? []);
        setLoading(false);
      });
  }, [query]);

  if (loading) return <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-gray-700">People ({profiles.length})</h2>
      {profiles.map((p) => (
        <Link
          key={p.id}
          href={`/profile/${p.username}`}
          className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
            {p.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : "👤"}
          </div>
          <div>
            <p className="font-medium">{p.display_name || p.username}</p>
            <p className="text-xs text-gray-400">@{p.username}</p>
            {p.bio && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.bio}</p>}
          </div>
        </Link>
      ))}
      {profiles.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-3">🔍</p>
          <p>No results found for &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
