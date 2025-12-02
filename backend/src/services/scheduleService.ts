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

  for (const id of recipeIds) {
    const isNumeric = Number.isFinite(Number(id));

    let recipeName = "";
    let rawSteps: string[] = [];

    if (isNumeric) {
      const numericId = Number(id);
      const recipe = await fetchSpoonacularRecipeById(numericId);
      const analyzed = await fetchSteps(numericId);

      recipeName = recipe.title;
      for (const instr of analyzed) {
        for (const step of instr.steps) {
          rawSteps.push(step.step);
        }
      }
    } else {
      const recipe = await fetchRecipeByIdForSchedule(id);
      const analyzed = await fetchStepsFromDb(id);

      recipeName = recipe.title;
      for (const instr of analyzed) {
        for (const step of instr.steps) {
          rawSteps.push(step.step);
        }
      }
    }


    recipes.push({
      recipeId: String(id),
      recipeName,
      rawSteps,
    });
  }

  // Let OpenAI handle interleaving + timing
  return await generateSchedule(recipes);
}
