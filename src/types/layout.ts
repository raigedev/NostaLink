/**
 * Responsive freeform layout system for profile customization.
 *
 * Layout uses percentage-based x and w (relative to canvas width) and
 * pixel-based y (from canvas top), so it adapts naturally to different
 * screen sizes while maintaining relative positions.
 */

/** IDs for all draggable profile sections */
export const LAYOUT_IDS = {
  AVATAR_BOX:   "avatar-box",
  DETAILS:      "details",
  CONNECT:      "connect",
  HIT_COUNTER:  "hit-counter",
  MUSIC_PLAYER: "music-player",
  ABOUT_ME:     "about-me",
  CUSTOM_HTML:  "custom-html",
  WIDGETS:      "widgets",
  TOP_FRIENDS:  "top-friends",
  GUESTBOOK:    "guestbook",
  SHOUTBOX:     "shoutbox",
} as const;

export type LayoutId = typeof LAYOUT_IDS[keyof typeof LAYOUT_IDS] | `widget-${string}`;

/** A single positioned element in the layout */
export interface LayoutItem {
  /** Stable element identifier (one of LAYOUT_IDS or widget-{widgetId}) */
  id: LayoutId;
  /** Left position as percentage of canvas width (0–100) */
  x: number;
  /** Top position in pixels from canvas top */
  y: number;
  /** Width as percentage of canvas width (min 10, max 100) */
  w: number;
}

/** Full layout descriptor persisted with the profile */
export interface LayoutData {
  version: 1;
  /** Ordered list of positioned items (order determines stack/rendering) */
  items: LayoutItem[];
}

/** Minimum item width as a percentage */
export const MIN_ITEM_W = 15;
/** Maximum item width as a percentage */
export const MAX_ITEM_W = 100;
/** Minimum pixel height for the canvas */
export const CANVAS_MIN_HEIGHT = 1300;
