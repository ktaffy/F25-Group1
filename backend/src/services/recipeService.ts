import { fetchRandomRecipes, fetchSearchRecipes, fetchRecipeById, fetchSteps } from "../clients/spoonacularClient.js";
import { formatRecipe } from "../utils/recipeFormatter.js";
import type { Recipe } from "../types/recipeTypes.js";

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
export async function getRandomRecipes(number = 5, tags?: string): Promise<Recipe[]> {
  const data = await fetchRandomRecipes(number, tags);
  return data.recipes.map(formatRecipe).filter(validateRecipe);
}

/**
 * Searches for recipes with given number and filters. 
 * @param params 
 * @returns Promise<{ totalResults: number; items: Recipe[] }>
 */
export async function searchRecipes(params: any): Promise<{ totalResults: number; items: Recipe[] }> {
  const data = await fetchSearchRecipes(params);
  const items = data.results.map(formatRecipe).filter(validateRecipe);

  return {
    totalResults: data.totalResults ?? items.length,
    items,
  };
}

/**
 * Get a single formatted and validated recipe by ID.
 * @param id 
 * @returns recipe object
 */
export async function getRecipe(id: number): Promise<Recipe | null> {
  const raw = await fetchRecipeById(id);
  const formatted = formatRecipe(raw);
  return validateRecipe(formatted) ? formatted : null;
}

/**
 * Gets an array of steps for a recipe by ID.
 * @param id 
 * @returns steps array
 */
export async function getRecipeSteps(id: number): Promise<string[]> {
  const data = await fetchSteps(id);
  return (data[0]?.steps || []).map((step: any) => step.step);
}
