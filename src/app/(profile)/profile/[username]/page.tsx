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
import { getTheme } from "@/lib/themes";
import { getFont, getFontUrl } from "@/lib/fonts";
import { degreesLabel, formatRelationshipStatus } from "@/lib/utils";
import Link from "next/link";
import ProfileConnectButtons from "@/components/profile/ProfileConnectButtons";

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

  // Fetch friendship status between logged-in user and this profile
  type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "accepted";
  let friendshipStatus: FriendshipStatus = "none";
  if (user && !isOwner) {
    const { data: friendship } = await supabase
      .from("friendships")
      .select("id, status, requester_id")
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`
      )
      .maybeSingle();
    if (friendship) {
      if (friendship.status === "accepted") {
        friendshipStatus = "accepted";
      } else if (friendship.status === "pending") {
        friendshipStatus =
          friendship.requester_id === user.id ? "pending_sent" : "pending_received";
      }
    }
  }

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
  const degLabel = degreesLabel(degrees);

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

      {/* Top navigation bar */}
      <nav className="fp-topnav">
        <Link href="/feed">✦ NostaLink</Link>
        <div className="fp-topnav-actions">
          {isOwner && (
            <Link href={`/profile/${username}/edit`} className="fp-topnav-btn">
              ✏️ Edit Profile
            </Link>
          )}
          {!user && (
            <Link href="/login" className="fp-topnav-btn">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Page content wrapper */}
      <div className="fp-wrapper">

        {/* Profile header banner */}
        <div className="fp-banner">
          <h1>{(profile.display_name || profile.username) + "'s Profile"}</h1>
        </div>

        {/* Two-column layout */}
        <div className="fp-layout">

          {/* ── LEFT RAIL ── */}
          <aside className="fp-left">

            {/* Avatar + identity */}
            <div className="fp-avatar-box">
              <div className="fp-avatar-img">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="fp-avatar-img-inner"
                  />
                ) : (
                  <span className="fp-avatar-placeholder">👤</span>
                )}
              </div>
              <div className="fp-display-name">{profile.display_name || profile.username}</div>
              <div className="fp-username">@{profile.username}</div>
              {profile.headline && (
                <div className="fp-headline">{profile.headline}</div>
              )}
            </div>

            {/* Details */}
            {(profile.location || profile.mood || profile.relationship_status || profile.website) && (
              <div className="fp-section">
                <div className="fp-section-header teal">Details</div>
                <div className="fp-section-body">
                  {profile.location && (
                    <div className="fp-details-row">
                      <span>📍</span>
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.relationship_status && (
                    <div className="fp-details-row">
                      <span>💕</span>
                      <span className="fp-relationship-status">
                        {formatRelationshipStatus(profile.relationship_status)}
                      </span>
                    </div>
                  )}
                  {profile.mood && (
                    <div className="fp-details-row">
                      <span>😌</span>
                      <span>{profile.mood}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="fp-details-row">
                      <span>🔗</span>
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="fp-website-link"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Social actions */}
            <div className="fp-section">
              <div className="fp-section-header orange">Connect</div>
              <div className="fp-section-body">
                {isOwner ? (
                  <Link href={`/profile/${username}/edit`} className="fp-btn">
                    ✏️ Edit My Profile
                  </Link>
                ) : user ? (
                  <ProfileConnectButtons
                    profileId={profile.id}
                    profileUsername={profile.username}
                    initialFriendshipStatus={friendshipStatus}
                  />
                ) : (
                  <Link href="/login" className="fp-btn">
                    Sign in to connect
                  </Link>
                )}
              </div>
            </div>

            {/* Degrees of connection */}
            {degLabel && (
              <div className="fp-section">
                <div className="fp-section-header">Connection</div>
                <div className="fp-section-body fp-degrees">
                  {degLabel}
                </div>
              </div>
            )}

            {/* Hit counter */}
            <div className="fp-hitcounter">
              <HitCounterWidget count={profile.hit_count || 0} />
            </div>

          </aside>

          {/* ── RIGHT COLUMN ── */}
          <main className="fp-right">

            {/* Testimonials — coming soon */}
            <div className="fp-section fp-testimonials-soon">
              <div className="fp-section-header">Testimonials</div>
              <div className="fp-section-body">
                <p className="fp-coming-soon-note">
                  ✨ Testimonials coming soon
                </p>
              </div>
            </div>

            {/* About Me */}
            {profile.bio && (
              <div className="fp-section">
                <div className="fp-section-header orange">About Me</div>
                <div className="fp-section-body" style={{ whiteSpace: "pre-wrap" }}>
                  {profile.bio}
                </div>
              </div>
            )}

            {/* Custom HTML */}
            {profile.custom_html && (
              <div
                className="profile-custom-html fp-section"
                dangerouslySetInnerHTML={{ __html: profile.custom_html }}
              />
            )}

            {/* Widgets / interests (ProfileSections) */}
            <ProfileSections profile={profile} topFriends={top8Friends} />

            {/* Top 8 Friends */}
            {top8Friends.length > 0 && (
              <Top8FriendsWidget friends={top8Friends} />
            )}

            {/* Guestbook */}
            <GuestbookWidget profileId={profile.id} />

            {/* Shoutbox / Comments */}
            <ShoutboxWidget profileId={profile.id} />

          </main>
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
        style={{
          marginTop: "20px",
          padding: "10px",
          textAlign: "center",
          fontSize: "11px",
          opacity: 0.5,
          borderTop: "1px solid var(--border-color)",
        }}
      >
        <Link href="/feed" style={{ fontWeight: "bold", textDecoration: "none" }}>
          ✦ NostaLink
        </Link>
        {" "}— Your Digital Home
      </footer>
    </div>
  );
}
