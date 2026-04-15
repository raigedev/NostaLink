/**
 * Generates sensible default layout positions for a profile page.
 *
 * The default mirrors the existing two-column CSS layout:
 *   left rail  (x=0, w=24%) – avatar, details, connect, hit-counter
 *   right main (x=26, w=74%) – music, about-me, custom-html, widgets,
 *                               top-friends, guestbook, shoutbox
 *
 * This ensures existing profiles without layout_data are automatically
 * assigned a layout that matches their current appearance.
 */

import type { LayoutData, LayoutItem } from "@/types/layout";
import { LAYOUT_IDS } from "@/types/layout";

/** Approximate rendered heights (in px) for each section.
 *  Used to calculate default y-offsets so sections don't overlap. */
const DEFAULT_HEIGHTS: Record<string, number> = {
  [LAYOUT_IDS.AVATAR_BOX]:   200,
  [LAYOUT_IDS.DETAILS]:      140,
  [LAYOUT_IDS.CONNECT]:       90,
  [LAYOUT_IDS.HIT_COUNTER]:  100,
  [LAYOUT_IDS.MUSIC_PLAYER]:  70,
  [LAYOUT_IDS.ABOUT_ME]:     130,
  [LAYOUT_IDS.CUSTOM_HTML]:  120,
  [LAYOUT_IDS.WIDGETS]:      200,
  [LAYOUT_IDS.TOP_FRIENDS]:  240,
  [LAYOUT_IDS.GUESTBOOK]:    220,
  [LAYOUT_IDS.SHOUTBOX]:     180,
};

const GAP = 12; // px gap between stacked items

/** Left column: x=0%, w=24% */
const LEFT_X = 0;
const LEFT_W = 24;

/** Right column: x=26%, w=74% */
const RIGHT_X = 26;
const RIGHT_W = 74;

function stack(ids: string[], x: number, w: number, startY = 0): LayoutItem[] {
  let y = startY;
  return ids.map((id) => {
    const item: LayoutItem = { id: id as LayoutItem["id"], x, y, w };
    y += (DEFAULT_HEIGHTS[id] ?? 150) + GAP;
    return item;
  });
}

/**
 * Returns the default layout matching the existing two-column profile design.
 * Every major section is included; all are visible by default.
 */
export function getDefaultLayout(): LayoutData {
  const leftItems = stack(
    [
      LAYOUT_IDS.AVATAR_BOX,
      LAYOUT_IDS.DETAILS,
      LAYOUT_IDS.CONNECT,
      LAYOUT_IDS.HIT_COUNTER,
    ],
    LEFT_X,
    LEFT_W,
  );

  const rightItems = stack(
    [
      LAYOUT_IDS.MUSIC_PLAYER,
      LAYOUT_IDS.ABOUT_ME,
      LAYOUT_IDS.CUSTOM_HTML,
      LAYOUT_IDS.WIDGETS,
      LAYOUT_IDS.TOP_FRIENDS,
      LAYOUT_IDS.GUESTBOOK,
      LAYOUT_IDS.SHOUTBOX,
    ],
    RIGHT_X,
    RIGHT_W,
  );

  return {
    version: 1,
    items: [...leftItems, ...rightItems],
  };
}

/**
 * Merges existing layout data with the default layout so that any sections
 * missing from the stored data are added at sensible positions below the
 * current content.
 */
export function mergeWithDefaults(stored: LayoutData): LayoutData {
  const defaults = getDefaultLayout();
  const storedIds = new Set(stored.items.map((i) => i.id));

  // Find the maximum y + approximate height in stored items to place new ones below
  const maxY = stored.items.reduce((acc, item) => {
    const h = DEFAULT_HEIGHTS[item.id] ?? 150;
    return Math.max(acc, item.y + h + GAP);
  }, 0);

  let appendY = maxY;
  const extra: LayoutItem[] = [];

  for (const def of defaults.items) {
    if (!storedIds.has(def.id)) {
      extra.push({ ...def, y: appendY });
      appendY += (DEFAULT_HEIGHTS[def.id] ?? 150) + GAP;
    }
  }

  return {
    version: 1,
    items: [...stored.items, ...extra],
  };
}

/**
 * Returns a safe y position for a newly added widget, placed just below
 * the lowest existing item.
 */
export function getNewItemPosition(
  currentLayout: LayoutData,
  w = RIGHT_W,
): { x: number; y: number; w: number } {
  const maxY = currentLayout.items.reduce((acc, item) => {
    const h = DEFAULT_HEIGHTS[item.id] ?? 150;
    return Math.max(acc, item.y + h + GAP);
  }, 0);

  return { x: RIGHT_X, y: maxY, w };
}
