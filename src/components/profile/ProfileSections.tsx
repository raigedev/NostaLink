"use client";

import type { Profile } from "@/app/actions/profile";

interface Props {
  profile: Profile;
}

export default function ProfileSections({ profile }: Props) {
  const widgets = profile.widgets ?? [];

  if (widgets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {widgets.map((widget, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border"
          style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}
        >
          <p className="text-sm text-gray-500">Widget: {String(widget.type ?? "unknown")}</p>
        </div>
      ))}
    </div>
  );
}
