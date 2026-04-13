import { notFound } from "next/navigation";
import { getProfile } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/server";
import ProfileSections from "@/components/profile/ProfileSections";
import MusicPlayer from "@/components/profile/MusicPlayer";
import HitCounterWidget from "@/components/profile/widgets/HitCounterWidget";
import HitCountTracker from "@/components/profile/HitCountTracker";
import GuestbookWidget from "@/components/profile/widgets/GuestbookWidget";
import ShoutboxWidget from "@/components/profile/widgets/ShoutboxWidget";
import Top8FriendsWidget from "@/components/profile/widgets/Top8FriendsWidget";
import DegreesOfConnection from "@/components/friends/DegreesOfConnection";
import { getTheme } from "@/lib/themes";
import { getFont, getFontUrl } from "@/lib/fonts";
import Link from "next/link";

interface Props {
  params: Promise<{ username: string }>;
}

interface Friend {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  // Fetch degrees of connection for non-owners
  let degrees: number | null = null;
  if (user && !isOwner) {
    try {
      const { data: degData } = await supabase.rpc("get_degrees_of_connection", {
        user1_id: user.id,
        user2_id: profile.id,
      });
      degrees = degData ?? null;
    } catch (err) {
      console.error("get_degrees_of_connection RPC error:", err);
      degrees = null;
    }
  }

  // Fetch top 8 friends data
  let top8Friends: Friend[] = [];
  if (profile.top_friends && profile.top_friends.length > 0) {
    const { data: friendData } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", profile.top_friends);
    if (friendData) {
      const map = new Map(friendData.map((f: Friend) => [f.id, f]));
      top8Friends = profile.top_friends
        .map((id) => map.get(id))
        .filter(Boolean) as Friend[];
    }
  }

  const theme = getTheme(profile.theme_id ?? "minimalist");
  const font = getFont(profile.font_id ?? "inter");
  const fontUrl = font ? getFontUrl(font) : null;

  const bgStyle: React.CSSProperties = {};
  if (profile.bg_url) {
    bgStyle.backgroundImage = `url(${profile.bg_url})`;
  } else if (profile.bg_color) {
    bgStyle.backgroundColor = profile.bg_color;
  }

  const bgModeClass = profile.bg_mode ? `bg-mode-${profile.bg_mode}` : "";
  const scopedCssClass = `profile-custom-${profile.id}`;

  return (
    <div
      className={`min-h-screen ${theme?.cssClass ?? ""} ${bgModeClass} ${scopedCssClass}`}
      style={{
        ...bgStyle,
        fontFamily: font?.fontFamily,
        backgroundColor: bgStyle.backgroundColor || "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}
      {profile.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: profile.custom_css }} />
      )}

      {/* Minimal top nav — doesn't overshadow the profile */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
        }}
      >
        <Link
          href="/feed"
          className="text-white/80 hover:text-white text-sm font-semibold tracking-widest uppercase transition flex items-center gap-1"
        >
          ✦ NostaLink
        </Link>
        <div className="flex items-center gap-3">
          {isOwner && (
            <Link
              href={`/profile/${username}/edit`}
              className="px-3 py-1 rounded-full text-xs font-semibold border border-white/40 text-white/90 hover:bg-white/20 transition backdrop-blur-sm"
            >
              ✏️ Edit Profile
            </Link>
          )}
          {!user && (
            <Link
              href="/login"
              className="px-3 py-1 rounded-full text-xs font-semibold border border-white/40 text-white/90 hover:bg-white/20 transition backdrop-blur-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Hero — cover photo full-bleed */}
      <div className="relative w-full" style={{ minHeight: "320px" }}>
        <div
          className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500"
          aria-hidden={true}
        />
        {profile.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.cover_url}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Gradient overlay so text is always readable */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.5) 80%, var(--bg-primary) 100%)",
          }}
          aria-hidden={true}
        />
        {/* Profile identity block anchored to bottom of hero */}
        <div className="relative z-10 flex items-end gap-5 px-6 md:px-12 pb-6 pt-24">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white/80 bg-indigo-200 flex items-center justify-center text-5xl overflow-hidden flex-shrink-0 shadow-2xl">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              "👤"
            )}
          </div>
          <div className="pb-1 flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg leading-tight truncate">
              {profile.display_name || profile.username}
            </h1>
            <p className="text-white/70 text-sm mt-0.5">@{profile.username}</p>
            {profile.headline && (
              <p className="text-white/85 text-sm mt-1 italic drop-shadow">
                {profile.headline}
              </p>
            )}
            {!isOwner && <DegreesOfConnection degrees={degrees} />}
          </div>
          <div className="pb-1 flex-shrink-0">
            <HitCounterWidget count={profile.hit_count || 0} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">

        {/* Quick facts strip */}
        {(profile.mood || profile.location || profile.website || profile.relationship_status) && (
          <div
            className="flex flex-wrap gap-3"
          >
            {profile.mood && (
              <span
                className="px-3 py-1 rounded-full text-sm"
                style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)" }}
              >
                😌 {profile.mood}
              </span>
            )}
            {profile.location && (
              <span
                className="px-3 py-1 rounded-full text-sm"
                style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)" }}
              >
                📍 {profile.location}
              </span>
            )}
            {profile.relationship_status && (
              <span
                className="px-3 py-1 rounded-full text-sm"
                style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)" }}
              >
                💕 {profile.relationship_status.replace("_", " ")}
              </span>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded-full text-sm hover:opacity-80 transition"
                style={{
                  backgroundColor: "var(--card-bg)",
                  border: "1px solid var(--border-color)",
                  color: "var(--accent-1)",
                }}
              >
                🔗 {profile.website}
              </a>
            )}
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / main column */}
          <div className="lg:col-span-2 space-y-6">
            {profile.bio && (
              <section
                className="p-5 rounded-2xl shadow-sm"
                style={{
                  backgroundColor: "var(--card-bg)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <h2 className="font-bold text-base mb-2 uppercase tracking-widest opacity-60 text-xs">
                  About Me
                </h2>
                <p className="text-sm leading-relaxed whitespace-pre-wrap opacity-90">
                  {profile.bio}
                </p>
              </section>
            )}

            {profile.custom_html && (
              <div
                className="profile-custom-html"
                dangerouslySetInnerHTML={{ __html: profile.custom_html }}
              />
            )}

            <ProfileSections profile={profile} topFriends={top8Friends} />

            {top8Friends.length > 0 && (
              <section>
                <Top8FriendsWidget friends={top8Friends} />
              </section>
            )}

            <section>
              <GuestbookWidget profileId={profile.id} />
            </section>

            <section>
              <ShoutboxWidget profileId={profile.id} />
            </section>
          </div>

          {/* Right / sidebar column */}
          <div className="space-y-4">
            {/* Decorative "profile card" box */}
            <div
              className="p-4 rounded-2xl shadow-sm text-center"
              style={{
                backgroundColor: "var(--card-bg)",
                border: "2px solid var(--border-color)",
              }}
            >
              <div className="w-20 h-20 rounded-full border-2 border-white/50 bg-indigo-200 flex items-center justify-center text-3xl overflow-hidden mx-auto mb-3 shadow-lg">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "👤"
                )}
              </div>
              <p className="font-bold text-base">{profile.display_name || profile.username}</p>
              <p className="text-xs opacity-50 mb-3">@{profile.username}</p>
              {isOwner ? (
                <Link
                  href={`/profile/${username}/edit`}
                  className="block w-full text-center px-3 py-1.5 rounded-full text-xs font-semibold transition"
                  style={{
                    backgroundColor: "var(--accent-1)",
                    color: "#fff",
                  }}
                >
                  ✏️ Edit My Profile
                </Link>
              ) : user ? (
                <Link
                  href={`/friends`}
                  className="block w-full text-center px-3 py-1.5 rounded-full text-xs font-semibold transition"
                  style={{
                    backgroundColor: "var(--accent-1)",
                    color: "#fff",
                  }}
                >
                  ➕ Add Friend
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="block w-full text-center px-3 py-1.5 rounded-full text-xs font-semibold transition"
                  style={{
                    backgroundColor: "var(--accent-1)",
                    color: "#fff",
                  }}
                >
                  Sign in to connect
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {profile.profile_song_url && (
        <MusicPlayer
          src={profile.profile_song_url}
          title={profile.display_name ?? profile.username}
        />
      )}

      <HitCountTracker profileId={profile.id} />

      {/* Footer */}
      <footer
        className="mt-16 py-6 text-center text-xs opacity-40"
        style={{ borderTop: "1px solid var(--border-color)" }}
      >
        <Link href="/feed" className="hover:opacity-70 transition font-semibold tracking-widest uppercase">
          ✦ NostaLink
        </Link>
        {" "}— Your Digital Home
      </footer>
    </div>
  );
}
