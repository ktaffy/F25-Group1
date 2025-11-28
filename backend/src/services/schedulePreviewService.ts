import { randomUUID } from "crypto";
import type { ScheduleResult } from "../types/scheduleTypes.js";
import { createScheduleFromIds } from "./scheduleService.js";

interface SchedulePreview {
  id: string;
  recipeKey: string;
  recipeIds: number[];
  schedule: ScheduleResult;
  createdAt: number;
}

const previewsByKey = new Map<string, SchedulePreview>();
const previewsById = new Map<string, SchedulePreview>();

function normalizeRecipeIds(recipeIds: number[]): number[] {
  const numericIds = recipeIds
    .map(Number)
    .filter((id) => Number.isFinite(id));

  const unique = Array.from(new Set(numericIds));
  return unique.sort((a, b) => a - b);
}

/**
 * Generate or reuse a cached schedule preview for the given recipe ids.
 * Caches previews locally to avoid regenerating schedules for the same set.
 */
export async function getOrCreatePreview(recipeIds: number[]): Promise<{ previewId: string; schedule: ScheduleResult }> {
  const normalized = normalizeRecipeIds(recipeIds);
  if (normalized.length === 0) {
    throw new Error("No valid recipe ids provided");
  }
  const key = normalized.join(",");

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
