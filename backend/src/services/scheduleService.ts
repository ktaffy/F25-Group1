import type { ScheduleResult } from "../types/scheduleTypes.js";
import { generateSchedule } from "../clients/openaiClient.js";
import { fetchRecipeById, fetchSteps } from "../clients/spoonacularClient.js";

/**
 * Create a cooking schedule from Spoonacular recipe IDs.
 * - Fetches steps for each recipe
 * - Sends everything to OpenAI
 * - Returns a globally interleaved schedule
 * @param recipeIds 
 * @returns schedule in specified format
 */
export async function createScheduleFromIds(recipeIds: number[]): Promise<ScheduleResult> {
  const recipes: { recipeId: string; recipeName: string; rawSteps: string[] }[] = [];

  for (const id of recipeIds) {
    const recipe = await fetchRecipeById(id);
    const analyzed = await fetchSteps(id);

    const rawSteps: string[] = [];
    for (const instr of analyzed) {
      for (const step of instr.steps) {
        rawSteps.push(step.step);
      }
    }

    recipes.push({
      recipeId: String(id),
      recipeName: recipe.title,
      rawSteps,
    });
  }

  // Let OpenAI handle interleaving + timing
  return await generateSchedule(recipes);
}
