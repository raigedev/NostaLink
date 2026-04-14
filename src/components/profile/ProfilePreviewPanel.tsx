"use client";

import type { Profile } from "@/app/actions/profile";
import { getTheme } from "@/lib/themes";
import { getFont, getFontUrl } from "@/lib/fonts";
import { formatRelationshipStatus } from "@/lib/utils";
import MusicPlayer from "./MusicPlayer";

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
  const widgets = (p.widgets as Record<string, unknown>[] | null) ?? [];
  const TOP_FRIENDS_MAX = 8;

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

              {/* Placeholder for widgets/top8 (shown when present in saved data) */}
              {widgets.length > 0 && (
                <div className="fp-section">
                  <div className="fp-section-header blue">Widgets</div>
                  <div className="fp-section-body" style={{ fontSize: "11px", opacity: 0.75 }}>
                    {widgets.length} widget(s) configured
                  </div>
                </div>
              )}

              {(p.top_friends && p.top_friends.length > 0) && (
                <div className="fp-section">
                  <div className="fp-section-header green">Top {Math.min(p.top_friends.length, TOP_FRIENDS_MAX)}</div>
                  <div className="fp-section-body" style={{ fontSize: "11px", opacity: 0.75 }}>
                    {p.top_friends.length} friend(s) in your Top {Math.min(p.top_friends.length, TOP_FRIENDS_MAX)}
                  </div>
                </div>
              )}

              <p className="fp-coming-soon-note">
                💬 Testimonials — coming soon
              </p>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
