/**
 * Runtime validation and conversion utility for layout data
 * retrieved from the database (typed as `Record<string, unknown>`).
 */
import type { LayoutData, LayoutItem } from "@/types/layout";

/**
 * Safely parses raw JSONB data from the database into a typed `LayoutData`
 * object. Returns `null` if the data is null/undefined or fails validation.
 */
export function parseLayoutData(raw: Record<string, unknown> | null | undefined): LayoutData | null {
  if (!raw) return null;
  if (raw.version !== 1) return null;
  if (!Array.isArray(raw.items)) return null;

  const items: LayoutItem[] = [];
  for (const item of raw.items as unknown[]) {
    if (typeof item !== "object" || item === null) return null;
    const rec = item as Record<string, unknown>;
    if (
      typeof rec.id !== "string" ||
      typeof rec.x !== "number" ||
      typeof rec.y !== "number" ||
      typeof rec.w !== "number"
    ) {
      return null;
    }
    items.push({
      id: rec.id as LayoutItem["id"],
      x: rec.x,
      y: rec.y,
      w: rec.w,
    });
  }

  return { version: 1, items };
}
