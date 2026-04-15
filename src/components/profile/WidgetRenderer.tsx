"use client";

import dynamic from "next/dynamic";
import type { WidgetConfig } from "@/types/widget";

export type { WidgetConfig };

const ClockWidget = dynamic(() => import("./widgets/ClockWidget"), { ssr: false });
const WeatherWidget = dynamic(() => import("./widgets/WeatherWidget"), { ssr: false });
const HitCounterWidget = dynamic(() => import("./widgets/HitCounterWidget"), { ssr: false });
const MoodWidget = dynamic(() => import("./widgets/MoodWidget"), { ssr: false });
const CountdownWidget = dynamic(() => import("./widgets/CountdownWidget"), { ssr: false });
const HoroscopeWidget = dynamic(() => import("./widgets/HoroscopeWidget"), { ssr: false });
const MusicPlaylistWidget = dynamic(() => import("./widgets/MusicPlaylistWidget"), { ssr: false });
const PhotoSlideshowWidget = dynamic(() => import("./widgets/PhotoSlideshowWidget"), { ssr: false });
const GuestbookWidget = dynamic(() => import("./widgets/GuestbookWidget"), { ssr: false });
const ShoutboxWidget = dynamic(() => import("./widgets/ShoutboxWidget"), { ssr: false });
const Top8FriendsWidget = dynamic(() => import("./widgets/Top8FriendsWidget"), { ssr: false });
const CustomHTMLWidget = dynamic(() => import("./widgets/CustomHTMLWidget"), { ssr: false });

interface Props {
  widget: WidgetConfig;
  profileId: string;
  mood?: string | null;
  hitCount?: number;
  customHtml?: string | null;
  topFriends?: Array<{ username: string; display_name: string | null; avatar_url: string | null }>;
}

export default function WidgetRenderer({
  widget,
  profileId,
  mood,
  hitCount,
  customHtml,
  topFriends,
}: Props) {
  if (widget.visible === false) return null;

  const s = widget.settings ?? {};

  switch (widget.type) {
    case "clock":
      return <ClockWidget style={(s.style as "digital" | "analog") ?? "digital"} timezone={(s.timezone as string) ?? "UTC"} />;

    case "weather":
      return <WeatherWidget city={(s.city as string) ?? ""} />;

    case "hit_counter":
      return <HitCounterWidget count={hitCount ?? 0} />;

    case "mood":
      return <MoodWidget mood={mood ?? ""} />;

    case "countdown":
      return <CountdownWidget targetDate={(s.targetDate as string) ?? ""} label={(s.label as string) ?? ""} />;

    case "horoscope":
      return <HoroscopeWidget sign={(s.sign as string) ?? "aries"} />;

    case "music_playlist":
      return <MusicPlaylistWidget />;

    case "photo_slideshow":
      return (
        <PhotoSlideshowWidget
          photos={s.photos as string[] | undefined}
          transition={(s.transition as "fade" | "slide" | "none") ?? "fade"}
          interval={(s.interval as "slow" | "normal" | "fast") ?? "normal"}
          displayMode={(s.displayMode as "fill" | "fit") ?? "fill"}
        />
      );

    case "guestbook":
      return <GuestbookWidget profileId={profileId} />;

    case "shoutbox":
      return <ShoutboxWidget profileId={profileId} />;

    case "top8":
      return <Top8FriendsWidget friends={topFriends} />;

    case "custom_html":
      return <CustomHTMLWidget html={customHtml ?? ""} />;

    default:
      return (
        <div className="fp-section">
          <div className="fp-section-body">
            <p style={{ fontSize: "12px", color: "var(--fp-panel-text-muted)" }}>Unknown widget: {widget.type}</p>
          </div>
        </div>
      );
  }
}
