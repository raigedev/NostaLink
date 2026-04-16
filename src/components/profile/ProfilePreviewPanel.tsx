"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import FreeformCanvas from "./FreeformCanvas";
import InlineSectionEditor from "./InlineSectionEditor";
import type { LayoutData } from "@/types/layout";
import { LAYOUT_IDS } from "@/types/layout";
import { getDefaultLayout, mergeWithDefaults } from "@/lib/defaultLayout";

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
  /** When true, renders draggable/selectable overlay in the preview */
  isEditMode?: boolean;
  /** Current freeform layout data (only used when isEditMode=true) */
  layoutData?: LayoutData | null;
  /** Currently selected element ID (edit mode only) */
  selectedId?: string | null;
  /** Called when user clicks/taps a profile section in preview */
  onSelect?: (id: string) => void;
  /** Called on every drag/resize update (live) */
  onLayoutChange?: (layout: LayoutData) => void;
  /** Called when a drag/resize gesture ends (for persistence) */
  onLayoutCommit?: (layout: LayoutData) => void;
  /**
   * Called when the user clicks "Apply Changes" inside an inline section editor.
   * Receives the section ID and the set of field updates to persist.
   * Should return `null` on success or `{ error: string }` on failure.
   */
  onInlineSave?: (
    sectionId: string,
    updates: Partial<Profile>,
  ) => Promise<{ error?: string } | null>;
}

/**
 * Renders a live preview of the public profile page while the user is editing.
 *
 * In non-edit mode (isEditMode=false): renders with normal CSS flow layout,
 * matching the public profile page.
 *
 * In edit mode (isEditMode=true): replaces the two-column layout with a
 * FreeformCanvas where every major section can be dragged and resized.
 */
export default function ProfilePreviewPanel({
  profile,
  draftOverrides,
  isEditMode = false,
  layoutData,
  selectedId,
  onSelect,
  onLayoutChange,
  onLayoutCommit,
  onInlineSave,
}: Props) {
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

  // ── Effective layout: stored or generated default ────────────────────────
  const effectiveLayout = useMemo((): LayoutData => {
    if (!isEditMode) return getDefaultLayout();
    if (layoutData) return mergeWithDefaults(layoutData);
    return getDefaultLayout();
  }, [isEditMode, layoutData]);

  // ── Click handler for non-freeform mode (adds edit mode click-to-edit) ──
  const handleSectionClick = useCallback(
    (id: string) => {
      if (isEditMode && onSelect) onSelect(id);
    },
    [isEditMode, onSelect],
  );

  // ── Build a stable onApply callback for a given sectionId ────────────────
  const makeInlineApply = useCallback(
    (sectionId: string) =>
      (updates: Partial<Profile>) =>
        onInlineSave ? onInlineSave(sectionId, updates) : Promise.resolve(null),
    [onInlineSave],
  );

  // ── Cancel (deselect) ─────────────────────────────────────────────────────
  const handleInlineCancel = useCallback(() => {
    if (onSelect) onSelect("");
  }, [onSelect]);

  /** Wraps a section node with InlineSectionEditor when in edit mode */
  const wrapSection = useCallback(
    (sectionId: string, node: React.ReactNode) => {
      if (!isEditMode) return node;
      return (
        <InlineSectionEditor
          sectionId={sectionId}
          profile={p}
          isSelected={selectedId === sectionId}
          isEditMode={isEditMode}
          onApply={makeInlineApply(sectionId)}
          onCancel={handleInlineCancel}
        >
          {node}
        </InlineSectionEditor>
      );
    },
    // p is reconstructed each render; use specific stable deps instead
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isEditMode, selectedId, makeInlineApply, handleInlineCancel,
      p.avatar_url, p.display_name, p.username, p.headline,
      p.location, p.mood, p.relationship_status, p.website,
      p.bio, p.custom_html, p.profile_song_url, p.widgets,
      p.cover_url,
    ],
  );

  // ── Build named sections for FreeformCanvas ──────────────────────────────
  const sections = useMemo(() => {
    // Avatar + identity
    const avatarSection = {
      id: LAYOUT_IDS.AVATAR_BOX,
      node: wrapSection(
        LAYOUT_IDS.AVATAR_BOX,
        <div className="fp-avatar-box">
          {p.cover_url && /^https?:\/\/[^\s"')]+$/.test(p.cover_url) && (
            <div
              className="fp-cover-photo"
              style={{ backgroundImage: `url(${p.cover_url})` }}
            />
          )}
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
        </div>,
      ),
    };

    // Details
    const detailsSection = (p.location || p.mood || p.relationship_status || p.website) ? {
      id: LAYOUT_IDS.DETAILS,
      node: wrapSection(
        LAYOUT_IDS.DETAILS,
        <div className="fp-section">
          <div className="fp-section-header teal">Details</div>
          <div className="fp-section-body">
            {p.location && (
              <div className="fp-details-row"><span>📍</span><span>{p.location}</span></div>
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
              <div className="fp-details-row"><span>😌</span><span>{p.mood}</span></div>
            )}
            {p.website && (
              <div className="fp-details-row">
                <span>🔗</span>
                <span className="fp-website-link">{p.website}</span>
              </div>
            )}
          </div>
        </div>,
      ),
    } : null;

    // Connect
    const connectSection = {
      id: LAYOUT_IDS.CONNECT,
      node: wrapSection(
        LAYOUT_IDS.CONNECT,
        <div className="fp-section">
          <div className="fp-section-header green">Connect</div>
          <div className="fp-section-body">
            <span className="fp-btn" style={{ display: "block", textAlign: "center", cursor: "default" }}>
              ✏️ Edit My Profile
            </span>
          </div>
        </div>,
      ),
    };

    // Hit counter
    const hitCounterSection = {
      id: LAYOUT_IDS.HIT_COUNTER,
      node: wrapSection(
        LAYOUT_IDS.HIT_COUNTER,
        <div className="fp-hitcounter">
          <HitCounterWidget count={p.hit_count || 0} memberSince={p.created_at} />
        </div>,
      ),
    };

    // Music player
    const musicSection = p.profile_song_url ? {
      id: LAYOUT_IDS.MUSIC_PLAYER,
      node: wrapSection(
        LAYOUT_IDS.MUSIC_PLAYER,
        <MusicPlayer
          src={p.profile_song_url}
          title={p.display_name ?? p.username}
        />,
      ),
    } : null;

    // About Me
    const aboutSection = p.bio ? {
      id: LAYOUT_IDS.ABOUT_ME,
      node: wrapSection(
        LAYOUT_IDS.ABOUT_ME,
        <div className="fp-section">
          <div className="fp-section-header blue">About Me</div>
          <div className="fp-section-body" style={{ whiteSpace: "pre-wrap" }}>
            {p.bio}
          </div>
        </div>,
      ),
    } : null;

    // Custom HTML
    const customHtmlSection = p.custom_html ? {
      id: LAYOUT_IDS.CUSTOM_HTML,
      node: wrapSection(
        LAYOUT_IDS.CUSTOM_HTML,
        <div
          className={`profile-custom-html fp-section ${scopedCssClass}`}
          dangerouslySetInnerHTML={{ __html: p.custom_html }}
        />,
      ),
    } : null;

    // Widgets
    const widgetsSection = {
      id: LAYOUT_IDS.WIDGETS,
      node: wrapSection(
        LAYOUT_IDS.WIDGETS,
        <ProfileSections profile={p} topFriends={top8Friends} />,
      ),
    };

    // Top 8 Friends
    const topFriendsSection = top8Friends.length > 0 ? {
      id: LAYOUT_IDS.TOP_FRIENDS,
      node: wrapSection(
        LAYOUT_IDS.TOP_FRIENDS,
        <Top8FriendsWidget friends={top8Friends} />,
      ),
    } : null;

    // Guestbook
    const guestbookSection = {
      id: LAYOUT_IDS.GUESTBOOK,
      node: wrapSection(
        LAYOUT_IDS.GUESTBOOK,
        <GuestbookWidget profileId={p.id} />,
      ),
    };

    // Shoutbox
    const shoutboxSection = {
      id: LAYOUT_IDS.SHOUTBOX,
      node: wrapSection(
        LAYOUT_IDS.SHOUTBOX,
        <ShoutboxWidget profileId={p.id} />,
      ),
    };

    return [
      avatarSection,
      detailsSection,
      connectSection,
      hitCounterSection,
      musicSection,
      aboutSection,
      customHtmlSection,
      widgetsSection,
      topFriendsSection,
      guestbookSection,
      shoutboxSection,
    ].filter(Boolean) as { id: string; node: React.ReactNode }[];
    // `wrapSection` is memoized on the specific profile fields it needs, so
    // adding it here as a dep correctly causes sections to rebuild when the
    // selected section changes (for inline edit activation) or profile data
    // changes (for display).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    p.avatar_url, p.display_name, p.username, p.headline,
    p.location, p.mood, p.relationship_status, p.website,
    p.hit_count, p.created_at, p.profile_song_url,
    p.bio, p.custom_html, p.id,
    top8Friends, scopedCssClass,
    wrapSection,
  ]);

  return (
    <div className="preview-panel-root">
      {/* ── Sticky banner ───────────────────────────────────────────────── */}
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
        {isEditMode && (
          <span
            style={{
              background: "rgba(255,255,255,0.2)",
              borderRadius: "4px",
              padding: "1px 5px",
              fontSize: "9px",
              fontWeight: "normal",
            }}
          >
            🖱 Drag · Tap to edit inline
          </span>
        )}
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

      {/* ── Profile page replica ──────────────────────────────────────── */}
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
        {fontUrl && (
          <style dangerouslySetInnerHTML={{ __html: `@import url('${fontUrl}');` }} />
        )}
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

          {isEditMode ? (
            /* ── FREEFORM CANVAS (edit mode) ──────────────────────── */
            <FreeformCanvas
              layout={effectiveLayout}
              sections={sections}
              selectedId={selectedId ?? null}
              onSelect={(id) => handleSectionClick(id)}
              onLayoutChange={onLayoutChange ?? (() => {})}
              onLayoutCommit={onLayoutCommit ?? (() => {})}
            />
          ) : (
            /* ── NORMAL FLOW (preview/public) ─────────────────────── */
            <div className="fp-layout">
              {/* ── LEFT RAIL ── */}
              <aside className="fp-left">
                {sections.find((s) => s.id === LAYOUT_IDS.AVATAR_BOX)?.node}
                {sections.find((s) => s.id === LAYOUT_IDS.DETAILS)?.node}
                {sections.find((s) => s.id === LAYOUT_IDS.CONNECT)?.node}
                {sections.find((s) => s.id === LAYOUT_IDS.HIT_COUNTER)?.node}
              </aside>

              {/* ── RIGHT COLUMN ── */}
              <main className="fp-right">
                {sections.find((s) => s.id === LAYOUT_IDS.MUSIC_PLAYER)?.node}
                {sections.find((s) => s.id === LAYOUT_IDS.ABOUT_ME)?.node}
                {sections.find((s) => s.id === LAYOUT_IDS.CUSTOM_HTML)?.node}
                {sections.find((s) => s.id === LAYOUT_IDS.WIDGETS)?.node}
                {sections.find((s) => s.id === LAYOUT_IDS.TOP_FRIENDS)?.node}
                {sections.find((s) => s.id === LAYOUT_IDS.GUESTBOOK)?.node}
                {sections.find((s) => s.id === LAYOUT_IDS.SHOUTBOX)?.node}
                <p className="fp-coming-soon-note">
                  💬 Testimonials — coming soon
                </p>
              </main>
            </div>
          )}
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
