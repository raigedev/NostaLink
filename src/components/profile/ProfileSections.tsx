"use client";

import type { Profile } from "@/app/actions/profile";
import WidgetRenderer from "./WidgetRenderer";
import type { WidgetConfig } from "@/types/widget";

interface Friend {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Props {
  profile: Profile;
  topFriends?: Friend[];
}

export default function ProfileSections({ profile, topFriends }: Props) {
  const widgets = (profile.widgets ?? []) as unknown as WidgetConfig[];

  if (widgets.length === 0) {
    return null;
  }

  const sorted = [...widgets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="space-y-4">
      {sorted.map((widget, i) => (
        <WidgetRenderer
          key={widget.id ?? i}
          widget={widget}
          profileId={profile.id}
          mood={profile.mood}
          hitCount={profile.hit_count}
          customHtml={profile.custom_html}
          topFriends={topFriends}
        />
      ))}
    </div>
  );
}
