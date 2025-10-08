import { fetchRandomRecipes, fetchSearchRecipes, fetchRecipeById } from "../clients/supabaseClient.js";
import { formatRecipe } from "../utils/recipeFormatter.js";
import type { Recipe, InstructionStep } from "../types/recipeTypes.js";

/**
 * Internal helper to validate a recipe is usable. 
 * @param recipe of type recipe
 * @returns boolean t/f
 */
function validateRecipe(recipe: Recipe): boolean {
  return (
    !!recipe.id &&
    !!recipe.title &&
    recipe.ingredients.length > 0 &&
    recipe.instructions.length > 0
  );
}

/**
 * Gets a specific number of random recipes, optionally filtered by tags.
 * @param number 
 * @param tags 
 * @returns mapped, formatted, and validated recipes
 */
export async function getRandomRecipes(number = 5): Promise<Recipe[]> {
  const data = await fetchRandomRecipes(number);
  console.log('Raw data from Supabase:', data);

  const formatted = data.map(formatRecipe);
  console.log('After formatting:', formatted);

  const validated = formatted.filter(validateRecipe);
  console.log('After validation:', validated);

  return validated;
}

/**
 * Searches for recipes with given number and filters. 
 * @param params 
 * @returns Promise<{ totalResults: number; items: Recipe[] }>
 */
export async function searchRecipes(query: string, limit?: number): Promise<{ totalResults: number; items: Recipe[] }> {
  const data = await fetchSearchRecipes(query, limit);
  const items = data.map(formatRecipe).filter(validateRecipe);

  return {
    totalResults: items.length,
    items,
  };
}

/**
 * Get a single formatted and validated recipe by ID.
 * @param id 
 * @returns recipe object
 */
export async function getRecipe(id: string): Promise<Recipe | null> {
  const raw = await fetchRecipeById(id);
  const formatted = formatRecipe(raw);
  return validateRecipe(formatted) ? formatted : null;
}

/**
 * Gets an array of steps for a recipe by ID.
 * @param id 
 * @returns steps array
 */
export async function getRecipeSteps(id: string): Promise<string[]> {
  const recipe = await fetchRecipeById(id);

  if (Array.isArray(recipe.instructions)) {
    return recipe.instructions.map((step: InstructionStep) => step.step);
  }

  return (recipe.instructions as unknown as string)
    .split(/\n/)
    .map((step: string) => step.trim())
    .filter((step: string) => step.length > 0);
}