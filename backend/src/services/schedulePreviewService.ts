import { randomUUID } from "crypto";
import type { ScheduleResult } from "../types/scheduleTypes.js";
import { createScheduleFromIds } from "./scheduleService.js";

// Bump this to invalidate cached previews when logic changes
const PREVIEW_VERSION = "v2";

interface SchedulePreview {
  id: string;
  recipeKey: string;
  recipeIds: string[];
  schedule: ScheduleResult;
  createdAt: number;
}

const previewsByKey = new Map<string, SchedulePreview>();
const previewsById = new Map<string, SchedulePreview>();

function normalizeRecipeIds(recipeIds: string[]): string[] {
  const unique = Array.from(new Set(recipeIds));
  return unique.sort();
}

/**
 * Generate or reuse a cached schedule preview for the given recipe ids.
 * Caches previews locally to avoid regenerating schedules for the same set.
 */
export async function getOrCreatePreview(recipeIds: string[]): Promise<{ previewId: string; schedule: ScheduleResult }> {
  const normalized = normalizeRecipeIds(recipeIds);
  if (normalized.length === 0) {
    throw new Error("No valid recipe ids provided");
  }
  const key = `${PREVIEW_VERSION}:${normalized.join(",")}`;

  const existing = previewsByKey.get(key);
  if (existing) {
    return { previewId: existing.id, schedule: existing.schedule };
  }

  const schedule = await createScheduleFromIds(normalized);
  const id = randomUUID();
  const preview: SchedulePreview = {
    id,
    recipeKey: key,
    recipeIds: normalized,
    schedule,
    createdAt: Date.now(),
  };

  previewsByKey.set(key, preview);
  previewsById.set(id, preview);

  return { previewId: id, schedule };
}

/** Fetch a stored preview by id, if it exists. */
export function getPreviewById(previewId: string): ScheduleResult | undefined {
  return previewsById.get(previewId)?.schedule;
}
