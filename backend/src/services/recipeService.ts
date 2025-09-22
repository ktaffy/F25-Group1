import { fetchRandomRecipes, fetchSearchRecipes, fetchRecipeById, fetchSteps } from "./spoonacularService.js";
import { formatRecipe } from "./recipeFormatter.js";
import type { Recipe } from "../types/recipe.js";

/**
 * Validate that a formatted recipe has enough info to be usable.
 * @param recipe - formatted recipe
 * @returns true if valid, false otherwise
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
 * Get random recipes (formatted + validated).
 * @param number - how many recipes
 * @param tags - filters
 * @returns formatted recipes
 */
export async function getRandomRecipes(number = 5, tags?: string): Promise<Recipe[]> {
    const data = await fetchRandomRecipes(number, tags);
    return data.recipes.map(formatRecipe).filter(validateRecipe);
}

/**
 * Search for recipes (formatted + validated).
 * @param params - search filters
 * @returns { totalResults, items }
 */
export async function searchRecipes(params: any): Promise<{ totalResults: number; items: Recipe[] }> {
    const data = await fetchSearchRecipes(params);

    console.log(data.results);
    const items = data.results
        .map(formatRecipe)
        .filter(validateRecipe);

    console.log(items);
    return {
        totalResults: data.totalResults ?? items.length,
        items,
    };
}

/**
 * Get a single recipe by ID (formatted + validated).
 * @param id - recipe id
 * @returns formatted recipe or null
 */
export async function getRecipe(id: number): Promise<Recipe | null> {
    const raw = await fetchRecipeById(id);
    const formatted = formatRecipe(raw);
    return validateRecipe(formatted) ? formatted : null;
}

/**
 * Get steps for a recipe by ID.
 * @param id - recipe id
 * @returns step strings
 */
export async function getRecipeSteps(id: number): Promise<string[]> {
    const data = await fetchSteps(id);
    return (data[0]?.steps || []).map((step: any) => step.step);
}
