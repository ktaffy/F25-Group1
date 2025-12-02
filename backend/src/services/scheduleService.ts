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
  const recipes: { recipeId: string; recipeName: string; rawSteps: string[] }[] = [];
  const hasUserRecipe = recipeIds.some(id => !Number.isFinite(Number(id)));

  for (const id of recipeIds) {
    let recipeName = "";
    let rawSteps: string[] = [];
    let handled = false;

    // Always try Supabase first (covers user recipes even if IDs are numeric)
    try {
      const recipe = await fetchRecipeByIdForSchedule(id);
      const analyzed = await fetchStepsFromDb(id);

      recipeName = recipe.title;
      for (const instr of analyzed) {
        for (const step of instr.steps) {
          rawSteps.push(step.step);
        }
      }
      handled = true;
    } catch (err) {
      handled = false;
    }

    // Fallback to Spoonacular for numeric IDs if not found in Supabase
    if (!handled && Number.isFinite(Number(id))) {
      const numericId = Number(id);
      const recipe = await fetchSpoonacularRecipeById(numericId);
      const analyzed = await fetchSteps(numericId);

      recipeName = recipe.title;
      for (const instr of analyzed) {
        for (const step of instr.steps) {
          rawSteps.push(step.step);
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
      rawSteps,
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

function buildSimpleSchedule(recipes: { recipeId: string; recipeName: string; rawSteps: string[] }[]): ScheduleResult {
  const items: ScheduleResult["items"] = [];
  let cursor = 0;
  const defaultStepSec = 60;

  recipes.forEach(({ recipeId, recipeName, rawSteps }) => {
    rawSteps.forEach((text, idx) => {
      const startSec = cursor;
      const endSec = cursor + defaultStepSec;
      items.push({
        recipeId,
        recipeName,
        stepIndex: idx,
        text,
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
