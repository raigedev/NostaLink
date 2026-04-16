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
import { degreesLabel, formatRelationshipStatus, safeCssUrl } from "@/lib/utils";
import Link from "next/link";
import AddFriendButton from "@/components/profile/AddFriendButton";
import SendMessageButton from "@/components/profile/SendMessageButton";
import PublicProfileFreeformLayout from "@/components/profile/PublicProfileFreeformLayout";
import { LAYOUT_IDS } from "@/types/layout";
import { mergeWithDefaults } from "@/lib/defaultLayout";
import { parseLayoutData } from "@/lib/parseLayoutData";

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
  const degLabel = degreesLabel(degrees);

  // Fetch friendship status between current user and profile owner
  type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "friends";
  let friendshipStatus: FriendshipStatus = "none";
  if (user && !isOwner) {
    // Use two separate queries instead of string-interpolated .or() to avoid injection risk
    const [{ data: sentRequest }, { data: receivedRequest }] = await Promise.all([
      supabase
        .from("friendships")
        .select("id, requester_id, addressee_id, status")
        .eq("requester_id", user.id)
        .eq("addressee_id", profile.id)
        .maybeSingle(),
      supabase
        .from("friendships")
        .select("id, requester_id, addressee_id, status")
        .eq("requester_id", profile.id)
        .eq("addressee_id", user.id)
        .maybeSingle(),
    ]);
    const friendship = sentRequest ?? receivedRequest;
    if (friendship) {
      if (friendship.status === "accepted") {
        friendshipStatus = "friends";
      } else if (friendship.status === "pending" && friendship.requester_id === user.id) {
        friendshipStatus = "pending_sent";
      } else if (friendship.status === "pending" && friendship.addressee_id === user.id) {
        friendshipStatus = "pending_received";
      }
    }
  }

  // ── Build section nodes for freeform layout (if applicable) ──────────────
  const parsedLayout = parseLayoutData(profile.layout_data);
  const freeformLayout = parsedLayout ? mergeWithDefaults(parsedLayout) : null;
  const coverBgUrl = safeCssUrl(profile.cover_url);

  const avatarNode = (
    <div className="fp-avatar-box">
      {coverBgUrl && (
        <div
          className="fp-cover-photo"
          style={{ backgroundImage: `url(${coverBgUrl})` }}
        />
      )}
      <div className="fp-avatar-img">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="Avatar" className="fp-avatar-img-inner" />
        ) : (
          <span className="fp-avatar-placeholder">👤</span>
        )}
      </div>
      <div className="fp-display-name">{profile.display_name || profile.username}</div>
      <div className="fp-username">@{profile.username}</div>
      {profile.headline && <div className="fp-headline">{profile.headline}</div>}
    </div>
  );

  const detailsNode = (profile.location || profile.mood || profile.relationship_status || profile.website) ? (
    <div className="fp-section">
      <div className="fp-section-header teal">Details</div>
      <div className="fp-section-body">
        {profile.location && <div className="fp-details-row"><span>📍</span><span>{profile.location}</span></div>}
        {profile.relationship_status && (
          <div className="fp-details-row">
            <span>💕</span>
            <span className="fp-relationship-status">{formatRelationshipStatus(profile.relationship_status)}</span>
          </div>
        )}
        {profile.mood && <div className="fp-details-row"><span>😌</span><span>{profile.mood}</span></div>}
        {profile.website && (
          <div className="fp-details-row">
            <span>🔗</span>
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="fp-website-link">{profile.website}</a>
          </div>
        )}
      </div>
    </div>
  ) : null;

  const connectNode = (
    <div className="fp-section">
      <div className="fp-section-header green">Connect</div>
      <div className="fp-section-body">
        {isOwner ? (
          <Link href={`/profile/${username}/edit`} className="fp-btn">✏️ Edit My Profile</Link>
        ) : user ? (
          <>
            <AddFriendButton profileId={profile.id} initialStatus={friendshipStatus} />
            <SendMessageButton profileId={profile.id} />
          </>
        ) : (
          <Link href="/login" className="fp-btn">Sign in to connect</Link>
        )}
        {degLabel && (
          <div className="fp-section" style={{ marginTop: "6px" }}>
            <div className="fp-section-header">Connection</div>
            <div className="fp-section-body fp-degrees">{degLabel}</div>
          </div>
        )}
      </div>
    </div>
  );

  const hitCounterNode = (
    <div className="fp-hitcounter">
      <HitCounterWidget count={profile.hit_count || 0} memberSince={profile.created_at} />
    </div>
  );

  const musicNode = profile.profile_song_url ? (
    <MusicPlayer src={profile.profile_song_url} title={profile.display_name ?? profile.username} />
  ) : null;

  const aboutNode = profile.bio ? (
    <div className="fp-section">
      <div className="fp-section-header blue">About Me</div>
      <div className="fp-section-body" style={{ whiteSpace: "pre-wrap" }}>{profile.bio}</div>
    </div>
  ) : null;

  const customHtmlNode = profile.custom_html ? (
    <div className="profile-custom-html fp-section" dangerouslySetInnerHTML={{ __html: profile.custom_html }} />
  ) : null;

  const widgetsNode = <ProfileSections profile={profile} topFriends={top8Friends} />;
  const topFriendsNode = top8Friends.length > 0 ? <Top8FriendsWidget friends={top8Friends} /> : null;
  const guestbookNode = <GuestbookWidget profileId={profile.id} />;
  const shoutboxNode = <ShoutboxWidget profileId={profile.id} />;

  const allSections = [
    { id: LAYOUT_IDS.AVATAR_BOX,   node: avatarNode },
    detailsNode   ? { id: LAYOUT_IDS.DETAILS,       node: detailsNode } : null,
    { id: LAYOUT_IDS.CONNECT,      node: connectNode },
    { id: LAYOUT_IDS.HIT_COUNTER,  node: hitCounterNode },
    musicNode     ? { id: LAYOUT_IDS.MUSIC_PLAYER,  node: musicNode } : null,
    aboutNode     ? { id: LAYOUT_IDS.ABOUT_ME,      node: aboutNode } : null,
    customHtmlNode? { id: LAYOUT_IDS.CUSTOM_HTML,   node: customHtmlNode } : null,
    { id: LAYOUT_IDS.WIDGETS,      node: widgetsNode },
    topFriendsNode? { id: LAYOUT_IDS.TOP_FRIENDS,   node: topFriendsNode } : null,
    { id: LAYOUT_IDS.GUESTBOOK,    node: guestbookNode },
    { id: LAYOUT_IDS.SHOUTBOX,     node: shoutboxNode },
  ].filter(Boolean) as { id: string; node: React.ReactNode }[];

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

        {freeformLayout ? (
          /* ── FREEFORM LAYOUT (when layout_data is saved) ──────── */
          <PublicProfileFreeformLayout
            layout={freeformLayout}
            sections={allSections}
          />
        ) : (
          /* ── DEFAULT TWO-COLUMN LAYOUT ─────────────────────────── */
          <div className="fp-layout">

            {/* ── LEFT RAIL ── */}
            <aside className="fp-left">
              {avatarNode}
              {detailsNode}
              {/* Social actions */}
              <div className="fp-section">
                <div className="fp-section-header green">Connect</div>
                <div className="fp-section-body">
                  {isOwner ? (
                    <Link href={`/profile/${username}/edit`} className="fp-btn">
                      ✏️ Edit My Profile
                    </Link>
                  ) : user ? (
                    <>
                      <AddFriendButton profileId={profile.id} initialStatus={friendshipStatus} />
                      <SendMessageButton profileId={profile.id} />
                    </>
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
                  <div className="fp-section-body fp-degrees">{degLabel}</div>
                </div>
              )}
              {hitCounterNode}
            </aside>

            {/* ── RIGHT COLUMN ── */}
            <main className="fp-right">
              {musicNode}
              {aboutNode}
              {customHtmlNode}
              {widgetsNode}
              {topFriendsNode}
              {guestbookNode}
              {shoutboxNode}
              <p className="fp-coming-soon-note">💬 Testimonials — coming soon</p>
            </main>
          </div>
        )}
      </div>

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
