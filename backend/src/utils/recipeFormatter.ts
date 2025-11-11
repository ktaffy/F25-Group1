import type { Recipe, Ingredient, InstructionStep } from "../types/recipeTypes.js";

/**
 * Converts a raw database recipe object into a Recipe.
 * @param raw The raw JSON from Supabase.
 * @returns A cleaned Recipe object.
 */
export function formatRecipe(raw: any): Recipe {
  const ingredientsSource = Array.isArray(raw.ingredients)
    ? raw.ingredients
    : typeof raw.ingredients === "string"
      ? raw.ingredients
          .split(/\n/)
          .map((line: string) => line.trim())
          .filter(Boolean)
          .map((line: string, index: number) => ({
            id: index,
            name: line,
            amount: 0,
            unit: "",
            original: line,
          }))
      : [];

  const ingredients: Ingredient[] = ingredientsSource.map((ing: any, idx: number) => ({
    id: ing.id ?? idx,
    name: ing.name ?? ing.original ?? "",
    amount: ing.amount ?? 0,
    unit: ing.unit ?? "",
    original: ing.original ?? "",
    image: ing.image || "",
  }));

  let instructions: InstructionStep[] = [];
  if (Array.isArray(raw.instructions)) {
    instructions = raw.instructions.map((step: any, index: number) => ({
      number: step.number ?? index + 1,
      step: typeof step === "string" ? step : step.step ?? "",
    }));
  } else if (typeof raw.instructions === "string") {
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
