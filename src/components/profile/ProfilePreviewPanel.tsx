"use client";

import { useState, useEffect, useMemo } from "react";
import type { Profile } from "@/app/actions/profile";
import { getTheme } from "@/lib/themes";
import { getFont, getFontUrl } from "@/lib/fonts";
import { formatRelationshipStatus } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import MusicPlayer from "./MusicPlayer";
import ProfileSections from "./ProfileSections";
import HitCounterWidget from "./widgets/HitCounterWidget";
import GuestbookWidget from "./widgets/GuestbookWidget";
import ShoutboxWidget from "./widgets/ShoutboxWidget";
import Top8FriendsWidget from "./widgets/Top8FriendsWidget";

interface Friend {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Props {
  /** Saved profile (base data) */
  profile: Profile;
  /** Unsaved draft overrides from the editor — merged on top of profile */
  draftOverrides: Partial<Profile>;
}

/**
 * Renders a live, read-only preview of the public profile page while
 * the user is editing.  Uses the same fp-* CSS classes as the real profile
 * page so the preview closely matches what visitors will see.
 *
 * Draft overrides are merged on top of the saved profile so unsaved changes
 * are immediately visible without being published.
 */
export default function ProfilePreviewPanel({ profile, draftOverrides }: Props) {
  // Merge saved profile with draft overrides
  const p: Profile = { ...profile, ...draftOverrides };

  // Fetch full friend objects for Top 8 display — IDs come from draft/profile
  const [top8Friends, setTop8Friends] = useState<Friend[]>([]);
  // Memoize the stringified key so it only recomputes when top_friends changes
  const topFriendIdsKey = useMemo(
    () => JSON.stringify(p.top_friends ?? []),
    // p is recomputed each render; use the underlying sources for stable deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile.top_friends, draftOverrides.top_friends],
  );
  useEffect(() => {
    const ids = p.top_friends;
    if (!ids || ids.length === 0) {
      setTop8Friends([]);
      return;
    }
    const supabase = createClient();
    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", ids);
        if (error) {
          console.error("ProfilePreviewPanel: failed to fetch top friends", error);
          return;
        }
        if (data) {
          const map = new Map(data.map((f: Friend) => [f.id, f]));
          setTop8Friends(ids.map((id) => map.get(id)).filter(Boolean) as Friend[]);
        }
      } catch (err) {
        console.error("ProfilePreviewPanel: unexpected error fetching top friends", err);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topFriendIdsKey]);

  const theme = getTheme(p.theme_id ?? "minimalist");
  const font = getFont(p.font_id ?? "inter");
  const fontUrl = font ? getFontUrl(font) : null;

  const bgStyle: React.CSSProperties = {};
  if (p.bg_url) {
    bgStyle.backgroundImage = `url(${p.bg_url})`;
  } else if (p.bg_color) {
    bgStyle.backgroundColor = p.bg_color;
  }

  const bgModeClass = p.bg_mode ? `bg-mode-${p.bg_mode}` : "";
  const scopedCssClass = `profile-custom-${p.id}`;

  return (
    <div className="preview-panel-root">
      {/* Sticky "Live Preview" label */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "linear-gradient(to right, #4f46e5, #7c3aed)",
          color: "#fff",
          padding: "6px 12px",
          fontSize: "11px",
          fontWeight: "bold",
          letterSpacing: "0.5px",
          fontFamily: "sans-serif",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span style={{ opacity: 0.85 }}>👁</span>
        <span>Live Preview</span>
        <span
          style={{
            marginLeft: "auto",
            fontWeight: "normal",
            opacity: 0.7,
            fontSize: "10px",
          }}
        >
          Unsaved changes · not yet published
        </span>
      </div>

      {/* Profile page replica */}
      <div
        className={`${theme?.cssClass ?? ""} ${bgModeClass} ${scopedCssClass}`}
        style={{
          ...bgStyle,
          fontFamily: font?.fontFamily,
          backgroundColor: bgStyle.backgroundColor || "var(--bg-primary)",
          color: "var(--text-primary)",
          minHeight: "400px",
        }}
      >
        {/* Load Google Font for the selected font */}
        {fontUrl && (
          <style dangerouslySetInnerHTML={{ __html: `@import url('${fontUrl}');` }} />
        )}

        {/* Custom CSS from draft */}
        {p.custom_css && (
          <style dangerouslySetInnerHTML={{ __html: p.custom_css }} />
        )}

        {/* Top nav (non-interactive replica) */}
        <nav className="fp-topnav">
          <span>✦ NostaLink</span>
          <div className="fp-topnav-actions">
            <span className="fp-topnav-btn" style={{ cursor: "default" }}>
              ✏️ Edit Profile
            </span>
          </div>
        </nav>

        {/* Page content wrapper */}
        <div className="fp-wrapper">
          {/* Profile header banner */}
          <div className="fp-banner">
            <h1>{(p.display_name || p.username) + "'s Profile"}</h1>
          </div>

          {/* Two-column layout */}
          <div className="fp-layout">
            {/* ── LEFT RAIL ── */}
            <aside className="fp-left">
              {/* Avatar + identity */}
              <div className="fp-avatar-box">
                <div className="fp-avatar-img">
                  {p.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.avatar_url}
                      alt="Avatar"
                      className="fp-avatar-img-inner"
                    />
                  ) : (
                    <span className="fp-avatar-placeholder">👤</span>
                  )}
                </div>
                <div className="fp-display-name">{p.display_name || p.username}</div>
                <div className="fp-username">@{p.username}</div>
                {p.headline && (
                  <div className="fp-headline">{p.headline}</div>
                )}
              </div>

              {/* Details */}
              {(p.location || p.mood || p.relationship_status || p.website) && (
                <div className="fp-section">
                  <div className="fp-section-header teal">Details</div>
                  <div className="fp-section-body">
                    {p.location && (
                      <div className="fp-details-row">
                        <span>📍</span>
                        <span>{p.location}</span>
                      </div>
                    )}
                    {p.relationship_status && (
                      <div className="fp-details-row">
                        <span>💕</span>
                        <span className="fp-relationship-status">
                          {formatRelationshipStatus(p.relationship_status)}
                        </span>
                      </div>
                    )}
                    {p.mood && (
                      <div className="fp-details-row">
                        <span>😌</span>
                        <span>{p.mood}</span>
                      </div>
                    )}
                    {p.website && (
                      <div className="fp-details-row">
                        <span>🔗</span>
                        <span className="fp-website-link">
                          {p.website}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Connect section (read-only in preview) */}
              <div className="fp-section">
                <div className="fp-section-header green">Connect</div>
                <div className="fp-section-body">
                  <span
                    className="fp-btn"
                    style={{ display: "block", textAlign: "center", cursor: "default" }}
                  >
                    ✏️ Edit My Profile
                  </span>
                </div>
              </div>

              {/* Hit counter */}
              <div className="fp-hitcounter">
                <HitCounterWidget count={p.hit_count || 0} memberSince={p.created_at} />
              </div>
            </aside>

            {/* ── RIGHT COLUMN ── */}
            <main className="fp-right">
              {/* Music player */}
              {p.profile_song_url && (
                <MusicPlayer
                  src={p.profile_song_url}
                  title={p.display_name ?? p.username}
                />
              )}

              {/* About Me */}
              {p.bio && (
                <div className="fp-section">
                  <div className="fp-section-header blue">About Me</div>
                  <div className="fp-section-body" style={{ whiteSpace: "pre-wrap" }}>
                    {p.bio}
                  </div>
                </div>
              )}

              {/* Custom HTML */}
              {p.custom_html && (
                <div
                  className={`profile-custom-html fp-section ${scopedCssClass}`}
                  dangerouslySetInnerHTML={{ __html: p.custom_html }}
                />
              )}

              {/* Widgets / interests (ProfileSections) */}
              <ProfileSections profile={p} topFriends={top8Friends} />

              {/* Top 8 Friends */}
              {top8Friends.length > 0 && (
                <Top8FriendsWidget friends={top8Friends} />
              )}

              {/* Guestbook */}
              <GuestbookWidget profileId={p.id} />

              {/* Shoutbox / Comments */}
              <ShoutboxWidget profileId={p.id} />

              <p className="fp-coming-soon-note">
                💬 Testimonials — coming soon
              </p>
            </main>
          </div>
        </div>

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
          <span style={{ fontWeight: "bold" }}>✦ NostaLink</span>
          {" "}— Your Digital Home
        </footer>
      </div>
    </div>
  );
}
