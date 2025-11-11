import type { Recipe, Ingredient, InstructionStep } from "../types/recipeTypes.js";

/**
 * Converts a raw database recipe object into a Recipe.
 * @param raw The raw JSON from Supabase.
 * @returns A cleaned Recipe object.
 */
export function formatRecipe(raw: any): Recipe {
  const ingredients: Ingredient[] = (raw.ingredients || []).map((ing: any) => ({
    id: ing.id || 0,
    name: ing.name,
    amount: ing.amount,
    unit: ing.unit,
    original: ing.original,
    image: ing.image || '',
  }));

  let instructions: InstructionStep[] = [];
  if (raw.instructions) {
    const steps = raw.instructions.split('\n').filter((s: string) => s.trim());
    instructions = steps.map((step: string, index: number) => ({
      number: index + 1,
      step: step.replace(/^\d+\.\s*/, ''),
    }));
  }

  return {
    id: raw.id,
    title: raw.title,
    image: raw.image,
    readyInMinutes: raw.ready_in_minutes,
    servings: raw.servings,
    sourceUrl: raw.source_url,
    summary: raw.summary,
    diets: [],
    dishTypes: raw.dish_types || [],
    ingredients,
    instructions,
    averageRating: raw.averageRating,
    reviewCount: raw.reviewCount
  };
}