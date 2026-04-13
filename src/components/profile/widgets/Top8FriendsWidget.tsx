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
    <div className="fp-section">
      <div className="fp-section-header blue">👥 Top 8 Friends</div>
      <div className="fp-section-body">
        <div className="grid grid-cols-4 gap-2">
          {slots.map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              {f ? (
                <Link href={`/profile/${f.username}`} className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg overflow-hidden" style={{ background: "var(--fp-avatar-bg)", border: "2px solid var(--fp-avatar-border)" }}>
                    {f.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : "👤"}
                  </div>
                  <p className="fp-friend-name">{f.display_name || f.username}</p>
                </Link>
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg" style={{ border: "2px dashed var(--fp-avatar-empty-border)", color: "var(--fp-avatar-empty-color)" }}>+</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
