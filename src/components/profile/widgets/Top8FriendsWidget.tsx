"use client";

import Link from "next/link";

interface Friend {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Props {
  friends?: Friend[];
}

export default function Top8FriendsWidget({ friends = [] }: Props) {
  const slots = Array.from({ length: 8 }, (_, i) => friends[i] ?? null);
  return (
    <div className="p-4 rounded-xl border" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
      <h3 className="font-semibold mb-3">👥 Top 8 Friends</h3>
      <div className="grid grid-cols-4 gap-2">
        {slots.map((f, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            {f ? (
              <Link href={`/profile/${f.username}`} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg overflow-hidden">
                  {f.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : "👤"}
                </div>
                <p className="text-xs text-center truncate w-full">{f.display_name || f.username}</p>
              </Link>
            ) : (
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-lg">+</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
