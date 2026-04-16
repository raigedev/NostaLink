"use client";

/**
 * InlineSectionEditor — renders an inline editing form inside a selected
 * profile section/card in the live preview.
 *
 * When `isEditMode && isSelected`, the section's normal display is replaced
 * with an in-place editing form. The form maintains its own local draft state
 * and calls `onApply(updates)` when the user clicks "Apply Changes".
 * `onCancel` deselects the section and discards local edits.
 *
 * Drag / resize events on the FreeformCanvas are stopped at this boundary so
 * interacting with form elements does not accidentally trigger layout moves.
 */

import { useState, useRef } from "react";
import type { Profile } from "@/app/actions/profile";
import { uploadAvatar, uploadCoverPhoto, uploadSlideshowPhoto } from "@/app/actions/profile";
import { LAYOUT_IDS } from "@/types/layout";
import type { WidgetConfig } from "@/types/widget";

const ZODIAC_SIGNS = [
  "aries","taurus","gemini","cancer","leo","virgo",
  "libra","scorpio","sagittarius","capricorn","aquarius","pisces",
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  sectionId: string;
  /** Merged profile + draft — used as initial values for inline form fields */
  profile: Profile;
  isSelected: boolean;
  isEditMode: boolean;
  onApply: (updates: Partial<Profile>) => Promise<{ error?: string } | null>;
  /** Called when the user cancels (deselects the section) */
  onCancel: () => void;
  /** The section's normal display node (shown when not in edit mode) */
  children: React.ReactNode;
}

interface FormProps {
  profile: Profile;
  onApply: (updates: Partial<Profile>) => Promise<{ error?: string } | null>;
  onCancel: () => void;
}

// ── Main Export ───────────────────────────────────────────────────────────────

/**
 * Wraps a profile section node. When the section is selected in edit mode the
 * children are hidden and replaced by an in-place editing form. When not
 * selected (or not in edit mode) the children are rendered as-is.
 */
export default function InlineSectionEditor({
  sectionId,
  profile,
  isSelected,
  isEditMode,
  onApply,
  onCancel,
  children,
}: Props) {
  if (!isEditMode || !isSelected) {
    return <>{children}</>;
  }

  // Stop FreeformCanvas drag/resize events from firing while interacting with
  // inline form controls.
  function stopEvent(e: React.SyntheticEvent) {
    e.stopPropagation();
  }

  // Check if the sectionId has a dedicated edit form
  const hasEditForm =
    sectionId === LAYOUT_IDS.AVATAR_BOX ||
    sectionId === LAYOUT_IDS.ABOUT_ME ||
    sectionId === LAYOUT_IDS.DETAILS ||
    sectionId === LAYOUT_IDS.MUSIC_PLAYER ||
    sectionId === LAYOUT_IDS.WIDGETS ||
    sectionId === LAYOUT_IDS.CUSTOM_HTML;

  return (
    <div onMouseDown={stopEvent} onTouchStart={stopEvent} onClick={stopEvent}>
      {sectionId === LAYOUT_IDS.AVATAR_BOX && (
        <AvatarInlineForm profile={profile} onApply={onApply} onCancel={onCancel} />
      )}
      {sectionId === LAYOUT_IDS.ABOUT_ME && (
        <AboutInlineForm profile={profile} onApply={onApply} onCancel={onCancel} />
      )}
      {sectionId === LAYOUT_IDS.DETAILS && (
        <DetailsInlineForm profile={profile} onApply={onApply} onCancel={onCancel} />
      )}
      {sectionId === LAYOUT_IDS.MUSIC_PLAYER && (
        <MusicInlineForm profile={profile} onApply={onApply} onCancel={onCancel} />
      )}
      {sectionId === LAYOUT_IDS.WIDGETS && (
        <WidgetInlineForm profile={profile} onApply={onApply} onCancel={onCancel} />
      )}
      {sectionId === LAYOUT_IDS.CUSTOM_HTML && (
        <CustomHtmlInlineForm profile={profile} onApply={onApply} onCancel={onCancel} />
      )}
      {!hasEditForm && (
        <NoEditForm sectionId={sectionId} onCancel={onCancel} children={children} />
      )}
    </div>
  );
}

// ── Shared UI Primitives ──────────────────────────────────────────────────────

/** Container that looks like an in-edit profile card */
function EditShell({
  title,
  children,
  onApply,
  onCancel,
  saving,
  error,
}: {
  title: string;
  children: React.ReactNode;
  onApply: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.98)",
        border: "2px solid #6366f1",
        borderRadius: "10px",
        overflow: "hidden",
        fontSize: "12px",
        boxShadow: "0 4px 20px rgba(99,102,241,0.15)",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "#fff",
          padding: "8px 12px",
          fontWeight: "600",
          fontSize: "11px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span>✏️</span>
        <span>{title}</span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "9px",
            fontWeight: "normal",
            background: "rgba(255,255,255,0.25)",
            borderRadius: "4px",
            padding: "1px 6px",
          }}
        >
          Editing
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "10px 12px" }}>
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "6px 8px",
              borderRadius: "6px",
              marginBottom: "8px",
              fontSize: "11px",
            }}
          >
            {error}
          </div>
        )}
        {children}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "8px 12px",
          display: "flex",
          gap: "8px",
          background: "#f9fafb",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          style={{
            padding: "5px 12px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            background: "#fff",
            color: "#6b7280",
            fontSize: "11px",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.5 : 1,
          }}
        >
          ✕ Cancel
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={saving}
          style={{
            flex: 1,
            padding: "5px 12px",
            borderRadius: "6px",
            border: "none",
            background: saving ? "#a5b4fc" : "#6366f1",
            color: "#fff",
            fontSize: "11px",
            fontWeight: "600",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving…" : "✓ Apply Changes"}
        </button>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: "10px",
        fontWeight: "600",
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: "3px",
      }}
    >
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "12px",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
  fontFamily: "inherit",
};

function InlineInput({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: string;
}) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        style={inputStyle}
      />
    </div>
  );
}

function InlineTextarea({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
}) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        style={{ ...inputStyle, resize: "vertical" }}
      />
    </div>
  );
}

function InlineSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Section-specific inline forms ─────────────────────────────────────────────

// ── Avatar / Identity Card ────────────────────────────────────────────────────

function AvatarInlineForm({ profile, onApply, onCancel }: FormProps) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [coverUrl, setCoverUrl] = useState(profile.cover_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadAvatar(fd);
    setUploadingAvatar(false);
    if ("error" in result) {
      setError(result.error ?? "Avatar upload failed");
    } else if (result.url) {
      setAvatarUrl(result.url);
    }
    // Reset input so the same file can be re-selected
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadCoverPhoto(fd);
    setUploadingCover(false);
    if ("error" in result) {
      setError(result.error ?? "Cover upload failed");
    } else if (result.url) {
      setCoverUrl(result.url);
    }
    if (coverInputRef.current) coverInputRef.current.value = "";
  }

  async function handleApply() {
    setSaving(true);
    setError(null);
    const result = await onApply({
      display_name: displayName,
      headline,
      // Include URL updates so the parent draft is refreshed even though the
      // upload actions already persisted them to the DB.
      ...(avatarUrl !== profile.avatar_url ? { avatar_url: avatarUrl } : {}),
      ...(coverUrl !== profile.cover_url ? { cover_url: coverUrl } : {}),
    });
    setSaving(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onCancel();
    }
  }

  return (
    <EditShell
      title="Identity Card"
      onApply={handleApply}
      onCancel={onCancel}
      saving={saving || uploadingAvatar || uploadingCover}
      error={error}
    >
      {/* Avatar + display name row */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "10px", alignItems: "flex-start" }}>
        {/* Avatar preview with click-to-upload */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <button
            type="button"
            title="Click to change avatar"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="avatar-upload-btn"
            style={{
              position: "relative",
              width: 56,
              height: 56,
              borderRadius: "50%",
              overflow: "hidden",
              background: "#e5e7eb",
              border: "2px solid #c7d2fe",
              padding: 0,
              cursor: uploadingAvatar ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span>👤</span>
            )}
            {/* Camera overlay on hover */}
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                opacity: uploadingAvatar ? 1 : 0,
                transition: "opacity 0.15s",
              }}
              className="avatar-upload-overlay"
            >
              {uploadingAvatar ? "…" : "📷"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            style={{
              padding: "3px 8px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              background: "#fff",
              fontSize: "10px",
              cursor: uploadingAvatar ? "wait" : "pointer",
              color: "#374151",
              whiteSpace: "nowrap",
            }}
          >
            {uploadingAvatar ? "Uploading…" : avatarUrl ? "Change Avatar" : "Upload Avatar"}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            aria-label="Upload avatar image"
            disabled={uploadingAvatar}
            style={{ display: "none" }}
            onChange={handleAvatarUpload}
          />
        </div>

        {/* Display name + upload hint */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <InlineInput
            label="Display Name"
            value={displayName}
            onChange={setDisplayName}
            placeholder="Your public name"
            maxLength={50}
          />
        </div>
      </div>

      <InlineInput
        label="Headline"
        value={headline}
        onChange={setHeadline}
        placeholder="A short tagline…"
        maxLength={150}
      />

      {/* Cover photo */}
      <div style={{ marginBottom: "4px" }}>
        <FieldLabel>Cover Photo</FieldLabel>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt="Cover"
              style={{
                width: 80,
                height: 30,
                objectFit: "cover",
                borderRadius: 4,
                border: "1px solid #d1d5db",
              }}
            />
          )}
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            style={{
              padding: "5px 10px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              background: "#fff",
              fontSize: "11px",
              cursor: uploadingCover ? "wait" : "pointer",
              color: "#374151",
            }}
          >
            {uploadingCover ? "Uploading…" : coverUrl ? "Change Cover" : "Upload Cover"}
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleCoverUpload}
          />
        </div>
      </div>
    </EditShell>
  );
}

// ── About Me ──────────────────────────────────────────────────────────────────

function AboutInlineForm({ profile, onApply, onCancel }: FormProps) {
  const [bio, setBio] = useState(profile.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    setSaving(true);
    setError(null);
    const result = await onApply({ bio });
    setSaving(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onCancel();
    }
  }

  return (
    <EditShell
      title="About Me"
      onApply={handleApply}
      onCancel={onCancel}
      saving={saving}
      error={error}
    >
      <InlineTextarea
        label="Bio"
        value={bio}
        onChange={setBio}
        placeholder="Tell people about yourself…"
        maxLength={500}
        rows={4}
      />
      <p style={{ fontSize: "10px", color: "#9ca3af", marginTop: "-4px" }}>
        {bio.length}/500 characters
      </p>
    </EditShell>
  );
}

// ── Details ───────────────────────────────────────────────────────────────────

function DetailsInlineForm({ profile, onApply, onCancel }: FormProps) {
  const [location, setLocation] = useState(profile.location ?? "");
  const [website, setWebsite] = useState(profile.website ?? "");
  const [mood, setMood] = useState(profile.mood ?? "");
  const [relationshipStatus, setRelationshipStatus] = useState(
    profile.relationship_status ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    setSaving(true);
    setError(null);
    const result = await onApply({
      location,
      website,
      mood,
      relationship_status: relationshipStatus,
    });
    setSaving(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onCancel();
    }
  }

  return (
    <EditShell
      title="Details"
      onApply={handleApply}
      onCancel={onCancel}
      saving={saving}
      error={error}
    >
      <InlineInput
        label="📍 Location"
        value={location}
        onChange={setLocation}
        placeholder="City, Country"
        maxLength={100}
      />
      <InlineInput
        label="🔗 Website"
        value={website}
        onChange={setWebsite}
        placeholder="https://yoursite.com"
        type="url"
      />
      <InlineInput
        label="😌 Mood"
        value={mood}
        onChange={setMood}
        placeholder="e.g. 💖 Feeling nostalgic"
        maxLength={100}
      />
      <InlineSelect
        label="💕 Relationship Status"
        value={relationshipStatus}
        onChange={setRelationshipStatus}
        options={[
          { value: "", label: "Prefer not to say" },
          { value: "single", label: "Single" },
          { value: "in_relationship", label: "In a relationship" },
          { value: "married", label: "Married" },
          { value: "complicated", label: "It's complicated" },
        ]}
      />
    </EditShell>
  );
}

// ── Music Player ──────────────────────────────────────────────────────────────

function MusicInlineForm({ profile, onApply, onCancel }: FormProps) {
  const [url, setUrl] = useState(profile.profile_song_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    setSaving(true);
    setError(null);
    const result = await onApply({ profile_song_url: url });
    setSaving(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onCancel();
    }
  }

  return (
    <EditShell
      title="Profile Music"
      onApply={handleApply}
      onCancel={onCancel}
      saving={saving}
      error={error}
    >
      <InlineInput
        label="Music URL"
        value={url}
        onChange={setUrl}
        placeholder="SoundCloud, YouTube, or direct audio URL…"
        type="url"
      />
      <p style={{ fontSize: "10px", color: "#9ca3af", marginTop: "-4px" }}>
        Supports SoundCloud, YouTube, and direct audio links
      </p>
    </EditShell>
  );
}

// ── Widgets ───────────────────────────────────────────────────────────────────

function WidgetInlineForm({ profile, onApply, onCancel }: FormProps) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(
    ((profile.widgets ?? []) as unknown as WidgetConfig[]).sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    ),
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateSetting(id: string, key: string, value: unknown) {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, settings: { ...w.settings, [key]: value } } : w,
      ),
    );
  }

  function toggleVisible(id: string) {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)),
    );
  }

  async function handleApply() {
    setSaving(true);
    setError(null);
    const result = await onApply({
      widgets: widgets as unknown as Profile["widgets"],
    });
    setSaving(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onCancel();
    }
  }

  return (
    <EditShell
      title="Widgets"
      onApply={handleApply}
      onCancel={onCancel}
      saving={saving}
      error={error}
    >
      {widgets.length === 0 ? (
        <p
          style={{
            fontSize: "11px",
            color: "#9ca3af",
            textAlign: "center",
            padding: "12px 0",
          }}
        >
          No widgets yet. Add widgets from the Widgets tab in the left panel.
        </p>
      ) : (
        <div style={{ maxHeight: "320px", overflowY: "auto" }}>
          {widgets.map((widget) => (
            <div
              key={widget.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                marginBottom: "6px",
                overflow: "hidden",
                opacity: widget.visible ? 1 : 0.55,
              }}
            >
              {/* Widget row header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "7px 10px",
                  background: "#f9fafb",
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={() =>
                  setExpandedId(expandedId === widget.id ? null : widget.id)
                }
              >
                <span style={{ fontSize: "14px" }}>{widget.icon}</span>
                <span style={{ flex: 1, fontSize: "12px", fontWeight: "500" }}>
                  {widget.label}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisible(widget.id);
                  }}
                  title={widget.visible ? "Hide" : "Show"}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    padding: "2px",
                  }}
                >
                  {widget.visible ? "👁" : "🙈"}
                </button>
                <span style={{ fontSize: "10px", color: "#9ca3af" }}>
                  {expandedId === widget.id ? "▲" : "▼"}
                </span>
              </div>

              {/* Expanded settings */}
              {expandedId === widget.id && (
                <div
                  style={{
                    padding: "10px",
                    borderTop: "1px solid #e5e7eb",
                    background: "#fff",
                  }}
                >
                  <InlineWidgetSettings widget={widget} onChange={updateSetting} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </EditShell>
  );
}

/** Full per-widget settings form — mirrors WidgetEditor's WidgetSettings */
function InlineWidgetSettings({
  widget,
  onChange,
}: {
  widget: WidgetConfig;
  onChange: (id: string, key: string, value: unknown) => void;
}) {
  const s = widget.settings;

  switch (widget.type) {
    case "clock":
      return (
        <div style={{ fontSize: "12px" }}>
          <InlineSelect
            label="Style"
            value={(s.style as string) ?? "digital"}
            onChange={(v) => onChange(widget.id, "style", v)}
            options={[
              { value: "digital", label: "Digital" },
              { value: "analog", label: "Analog" },
            ]}
          />
          <InlineInput
            label="Timezone"
            value={(s.timezone as string) ?? "UTC"}
            onChange={(v) => onChange(widget.id, "timezone", v)}
            placeholder="e.g. America/New_York"
          />
        </div>
      );

    case "weather":
      return (
        <InlineInput
          label="City"
          value={(s.city as string) ?? ""}
          onChange={(v) => onChange(widget.id, "city", v)}
          placeholder="e.g. Tokyo"
        />
      );

    case "countdown":
      return (
        <div>
          <InlineInput
            label="Target Date"
            value={(s.targetDate as string) ?? ""}
            onChange={(v) => onChange(widget.id, "targetDate", v)}
            type="datetime-local"
          />
          <InlineInput
            label="Label"
            value={(s.label as string) ?? ""}
            onChange={(v) => onChange(widget.id, "label", v)}
            placeholder="e.g. My Birthday!"
          />
        </div>
      );

    case "horoscope":
      return (
        <InlineSelect
          label="Zodiac Sign"
          value={(s.sign as string) ?? "aries"}
          onChange={(v) => onChange(widget.id, "sign", v)}
          options={ZODIAC_SIGNS.map((sign) => ({
            value: sign,
            label: sign.charAt(0).toUpperCase() + sign.slice(1),
          }))}
        />
      );

    case "photo_slideshow":
      return (
        <SlideshowInlineSettings
          widgetId={widget.id}
          photos={(s.photos as string[]) ?? []}
          transition={(s.transition as "fade" | "slide" | "none") ?? "fade"}
          interval={(s.interval as "slow" | "normal" | "fast") ?? "normal"}
          displayMode={(s.displayMode as "fill" | "fit") ?? "fill"}
          onChange={onChange}
        />
      );

    default:
      return (
        <p style={{ fontSize: "11px", color: "#9ca3af" }}>
          No configurable settings for this widget.
        </p>
      );
  }
}

/** Slideshow settings panel for the inline editor */
function SlideshowInlineSettings({
  widgetId,
  photos,
  transition,
  interval,
  displayMode,
  onChange,
}: {
  widgetId: string;
  photos: string[];
  transition: "fade" | "slide" | "none";
  interval: "slow" | "normal" | "fast";
  displayMode: "fill" | "fit";
  onChange: (id: string, key: string, value: unknown) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadSlideshowPhoto(fd);
      if ("error" in result) {
        setUploadError(result.error);
      } else {
        onChange(widgetId, "photos", [...photos, result.url]);
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      {/* Photo thumbnails */}
      <FieldLabel>Photos ({photos.length})</FieldLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
        {photos.map((url, i) => (
          <div key={i} style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Photo ${i + 1}`}
              style={{
                width: 48,
                height: 48,
                objectFit: "cover",
                borderRadius: 4,
                border: "1px solid #d1d5db",
              }}
            />
            <button
              type="button"
              onClick={() =>
                onChange(widgetId, "photos", photos.filter((_, j) => j !== i))
              }
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#ef4444",
                border: "1px solid #fff",
                color: "#fff",
                fontSize: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            width: 48,
            height: 48,
            borderRadius: 4,
            border: "2px dashed #d1d5db",
            background: "#f9fafb",
            color: "#9ca3af",
            fontSize: 18,
            cursor: uploading ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {uploading ? "…" : "+"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
      {uploadError && (
        <p style={{ fontSize: "10px", color: "#dc2626", marginBottom: "6px" }}>
          {uploadError}
        </p>
      )}

      <InlineSelect
        label="Transition"
        value={transition}
        onChange={(v) => onChange(widgetId, "transition", v)}
        options={[
          { value: "fade", label: "Fade" },
          { value: "slide", label: "Slide" },
          { value: "none", label: "None" },
        ]}
      />
      <InlineSelect
        label="Speed"
        value={interval}
        onChange={(v) => onChange(widgetId, "interval", v)}
        options={[
          { value: "slow", label: "Slow (6s)" },
          { value: "normal", label: "Normal (3s)" },
          { value: "fast", label: "Fast (1.5s)" },
        ]}
      />
      <InlineSelect
        label="Display Mode"
        value={displayMode}
        onChange={(v) => onChange(widgetId, "displayMode", v)}
        options={[
          { value: "fill", label: "Fill (crop)" },
          { value: "fit", label: "Fit (letterbox)" },
        ]}
      />
    </div>
  );
}

// ── Custom HTML ───────────────────────────────────────────────────────────────

function CustomHtmlInlineForm({ profile, onApply, onCancel }: FormProps) {
  const [html, setHtml] = useState(profile.custom_html ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    setSaving(true);
    setError(null);
    const result = await onApply({ custom_html: html });
    setSaving(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onCancel();
    }
  }

  return (
    <EditShell
      title="Custom HTML"
      onApply={handleApply}
      onCancel={onCancel}
      saving={saving}
      error={error}
    >
      <InlineTextarea
        label="HTML Code"
        value={html}
        onChange={setHtml}
        placeholder={"<div>Your HTML here…</div>"}
        rows={6}
      />
      <p style={{ fontSize: "10px", color: "#9ca3af", marginTop: "-4px" }}>
        HTML is sanitized before display
      </p>
    </EditShell>
  );
}

// ── Fallback: no inline editing for this section ──────────────────────────────

const SECTION_LABELS: Partial<Record<string, string>> = {
  [LAYOUT_IDS.CONNECT]:     "Connect",
  [LAYOUT_IDS.HIT_COUNTER]: "Hit Counter",
  [LAYOUT_IDS.GUESTBOOK]:   "Guestbook",
  [LAYOUT_IDS.SHOUTBOX]:    "Shoutbox",
  [LAYOUT_IDS.TOP_FRIENDS]: "Top Friends",
};

function NoEditForm({
  sectionId,
  onCancel,
  children,
}: {
  sectionId: string;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  const label = SECTION_LABELS[sectionId] ?? "Section";
  return (
    <div
      style={{
        border: "2px solid #6366f1",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(99,102,241,0.15)",
      }}
    >
      {/* Show original content */}
      <div style={{ pointerEvents: "none" }}>{children}</div>

      {/* Info footer */}
      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          background: "#f5f3ff",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "11px",
          color: "#6b7280",
        }}
      >
        <span>💡</span>
        <span>
          <strong>{label}</strong> — edit settings in the left panel
        </span>
        <button
          type="button"
          onClick={onCancel}
          style={{
            marginLeft: "auto",
            padding: "3px 10px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            background: "#fff",
            fontSize: "11px",
            cursor: "pointer",
            color: "#374151",
          }}
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
}
