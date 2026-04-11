import { notFound } from "next/navigation";
import { getProfile } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/server";
import ProfileSections from "@/components/profile/ProfileSections";
import MusicPlayer from "@/components/profile/MusicPlayer";
import HitCounterWidget from "@/components/profile/widgets/HitCounterWidget";
import { getTheme } from "@/lib/themes";
import { getFont, getFontUrl } from "@/lib/fonts";
import Link from "next/link";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  // Increment hit counter (fire and forget)
  const supabase = await createClient();
  supabase
    .from("profiles")
    .update({ hit_count: (profile.hit_count || 0) + 1 })
    .eq("username", username)
    .then(() => {});

  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

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

  return (
    <div
      className={`min-h-screen ${theme?.cssClass ?? ""} ${bgModeClass}`}
      style={{
        ...bgStyle,
        fontFamily: font?.fontFamily,
        backgroundColor: bgStyle.backgroundColor || "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      {fontUrl && (
        <link rel="stylesheet" href={fontUrl} />
      )}
      {profile.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: profile.custom_css }} />
      )}

      {/* Cover */}
      <div className="relative h-48 bg-gradient-to-r from-indigo-400 to-purple-500 overflow-hidden">
        {profile.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Avatar + Info */}
        <div className="relative -mt-16 flex items-end gap-4 mb-6">
          <div className="w-32 h-32 rounded-full border-4 border-white bg-indigo-100 flex items-center justify-center text-5xl overflow-hidden flex-shrink-0 shadow-lg">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : "👤"}
          </div>
          <div className="pb-2 flex-1">
            <h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>
            <p className="text-sm opacity-70">@{profile.username}</p>
            {profile.headline && <p className="text-sm mt-1 opacity-80">{profile.headline}</p>}
          </div>
          <div className="pb-2 flex gap-2">
            {isOwner && (
              <Link
                href={`/profile/${username}/edit`}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
              >
                Edit Profile
              </Link>
            )}
            <HitCounterWidget count={profile.hit_count || 0} />
          </div>
        </div>

        {/* Profile Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2 space-y-4">
            {profile.bio && (
              <div className="p-4 rounded-xl" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                <h2 className="font-semibold mb-2">About Me</h2>
                <p className="text-sm opacity-80 whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}
            {profile.custom_html && (
              <div
                className="profile-custom-html"
                dangerouslySetInnerHTML={{ __html: profile.custom_html }}
              />
            )}
            <ProfileSections profile={profile} />
          </div>
          <div className="space-y-3">
            {profile.mood && (
              <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                <span className="font-semibold">Mood:</span> {profile.mood}
              </div>
            )}
            {profile.location && (
              <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                📍 {profile.location}
              </div>
            )}
            {profile.website && (
              <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                🔗{" "}
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
                  {profile.website}
                </a>
              </div>
            )}
            {profile.relationship_status && (
              <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                💕 {profile.relationship_status.replace("_", " ")}
              </div>
            )}
          </div>
        </div>
      </div>

      {profile.profile_song_url && (
        <MusicPlayer src={profile.profile_song_url} title={profile.display_name ?? profile.username} />
      )}
    </div>
  );
}
