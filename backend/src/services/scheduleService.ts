import type { ScheduleResult } from "../types/scheduleTypes.js";
import { generateSchedule } from "../clients/openaiClient.js";
import { fetchRecipeById as fetchSpoonacularRecipeById, fetchSteps } from "../clients/spoonacularClient.js";
import { fetchRecipeByIdForSchedule, fetchStepsFromDb } from "../clients/supabaseClient.js";

/**
 * Create a cooking schedule from Spoonacular recipe IDs.
 * - Fetches steps for each recipe
 * - Sends everything to OpenAI
 * - Returns a globally interleaved schedule
 * @param recipeIds 
 * @returns schedule in specified format
 */
export async function createScheduleFromIds(recipeIds: string[]): Promise<ScheduleResult> {
  const recipes: { recipeId: string; recipeName: string; steps: { text: string; durationSec?: number }[] }[] = [];
  const hasUserRecipe = recipeIds.some(id => !isPureNumeric(id));

  for (const id of recipeIds) {
    let recipeName = "";
    let steps: { text: string; durationSec?: number }[] = [];
    let handled = false;

    // Always try Supabase first (covers user recipes even if IDs are numeric)
    try {
      const recipe = await fetchRecipeByIdForSchedule(id);
      const analyzed = await fetchStepsFromDb(id);

      recipeName = recipe.title;
      for (const instr of analyzed) {
        for (const step of instr.steps) {
          steps.push({
            text: step.step,
            durationSec: parseDurationSec(step.step),
          });
        }
      }
      handled = true;
    } catch (err) {
      handled = false;
    }

    // Fallback to Spoonacular for numeric IDs if not found in Supabase
    if (!handled && isPureNumeric(id)) {
      const numericId = Number(id);
      const recipe = await fetchSpoonacularRecipeById(numericId);
      const analyzed = await fetchSteps(numericId);

      recipeName = recipe.title;
      for (const instr of analyzed) {
        for (const step of instr.steps) {
          const duration = parseDurationSec(step.step) ?? parseSpoonacularLength(step.length);
          steps.push({
            text: step.step,
            durationSec: duration,
          });
        }
      }
      handled = true;
    }

    if (!handled) {
      continue; // skip if we couldn't resolve this id
    }

    recipes.push({
      recipeId: String(id),
      recipeName,
      steps,
    });
  }

  if (recipes.length === 0) {
    throw new Error("No recipes resolved for scheduling");
  }

  // Let OpenAI handle interleaving + timing.
  try {
    const schedule = await generateSchedule(recipes);
    if (schedule?.items?.length) {
      return schedule;
    }
  } catch (err) {
    console.error("OpenAI schedule failed:", err);
  }

  // If all recipes were Spoonacular, fail loudly so we don't silently skip AI
  if (!hasUserRecipe) {
    throw new Error("OpenAI schedule empty for Spoonacular recipes");
  }

  // Fallback: simple linear schedule if AI generation fails or returns empty
  return buildSimpleSchedule(recipes);
}

function buildSimpleSchedule(recipes: { recipeId: string; recipeName: string; steps: { text: string; durationSec?: number }[] }[]): ScheduleResult {
  const items: ScheduleResult["items"] = [];
  let cursor = 0;
  const defaultStepSec = 60;

  recipes.forEach(({ recipeId, recipeName, steps }) => {
    steps.forEach((step, idx) => {
      const duration = Number.isFinite(step.durationSec) ? Number(step.durationSec) : defaultStepSec;
      const startSec = cursor;
      const endSec = cursor + duration;
      items.push({
        recipeId,
        recipeName,
        stepIndex: idx,
        text: step.text,
        attention: "foreground",
        startSec,
        endSec,
      });
      cursor = endSec;
    });
  });

  return {
    items,
    totalDurationSec: cursor,
  };
}

function isPureNumeric(id: string): boolean {
  const trimmed = String(id).trim();
  return /^\d+$/.test(trimmed);
}

function parseDurationSec(text?: string): number | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase();
  // match ranges like 18-22 minutes or 5–6 minutes
  const rangeMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs|h|minute|minutes|min|m)\b/);
  if (rangeMatch) {
    const upper = parseFloat(rangeMatch[2]);
    const unit = rangeMatch[3];
    return unit.startsWith("hour") || unit.startsWith("hr") || unit === "h"
      ? Math.round(upper * 3600)
      : Math.round(upper * 60);
  }

  // single number with unit
  const singleMatch = lower.match(/(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs|h|minute|minutes|min|m)\b/);
  if (singleMatch) {
    const num = parseFloat(singleMatch[1]);
    const unit = singleMatch[2];
    return unit.startsWith("hour") || unit.startsWith("hr") || unit === "h"
      ? Math.round(num * 3600)
      : Math.round(num * 60);
  }

  // inline (~4 min)
  const approxMatch = lower.match(/~\s*(\d+(?:\.\d+)?)\s*(minute|minutes|min|m)\b/);
  if (approxMatch) {
    const num = parseFloat(approxMatch[1]);
    return Math.round(num * 60);
  }

  return undefined;
}

function parseSpoonacularLength(lengthObj: any): number | undefined {
  if (!lengthObj || typeof lengthObj.number !== "number") return undefined;
  const num = lengthObj.number;
  const unit = String(lengthObj.unit || "").toLowerCase();
  if (unit.startsWith("hour")) return Math.round(num * 3600);
  if (unit.startsWith("minute") || unit === "min" || unit === "m") return Math.round(num * 60);
  return undefined;
}
