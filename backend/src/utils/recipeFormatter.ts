import type { Recipe, Ingredient, InstructionStep } from "../types/recipeTypes.js";

/**
 * Converts a raw Spoonacular recipe object into a simplified Recipe.
 * @param raw The raw JSON from Spoonacular.
 * @returns A cleaned Recipe object.
 */
export function formatRecipe(raw: any): Recipe {
  const ingredients: Ingredient[] = (raw.extendedIngredients || []).map((ing: any) => ({
    id: ing.id,
    name: ing.name,
    amount: ing.amount,
    unit: ing.unit,
    original: ing.original,
    image: ing.image,
  }));

  const instructions: InstructionStep[] = (raw.analyzedInstructions?.[0]?.steps || []).map(
    (step: any) => ({
      number: step.number,
      step: step.step,
    })
  );

  return {
    id: raw.id,
    title: raw.title,
    image: raw.image,
    readyInMinutes: raw.readyInMinutes,
    servings: raw.servings,
    sourceUrl: raw.sourceUrl,
    summary: raw.summary,
    diets: raw.diets || [],
    dishTypes: raw.dishTypes || [],
    ingredients,
    instructions,
  };
}
