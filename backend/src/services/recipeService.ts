import { 
  fetchRandomRecipes, 
  fetchSearchRecipes as fetchSupabaseSearchRecipes, 
  fetchRecipeById, 
  fetchUserFavorites, 
  addFavorite as addFavoriteDb,
  removeFavorite as removeFavoriteDb,
  isFavorited as isFavoritedDb,
  createUserRecipe as createUserRecipeDb,
  updateUserRecipe as updateUserRecipeDb,
  deleteUserRecipe as deleteUserRecipeDb,
  addReview as addReviewDb,
  fetchRecipeReviews as fetchRecipeReviewsDb,
  deleteReview as deleteReviewDb
} from "../clients/supabaseClient.js";
import { fetchSearchRecipes as fetchSpoonacularSearchRecipes } from "../clients/spoonacularClient.js";
import { formatRecipe } from "../utils/recipeFormatter.js";
import type { Recipe, InstructionStep, Ingredient } from "../types/recipeTypes.js";

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

type SearchQueryParams = {
  query?: string | string[];
  limit?: string | string[];
  number?: string | string[];
  cuisine?: string | string[];
  diet?: string | string[];
  type?: string | string[];
};

function firstParam(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function formatSpoonacularRecipe(raw: any): Recipe {
  const ingredients: Ingredient[] = (raw.extendedIngredients || []).map((ing: any) => ({
    id: ing.id || 0,
    name: ing.name || "",
    amount: ing.amount ?? 0,
    unit: ing.unit || "",
    original: ing.original || "",
    image: ing.image ? `https://spoonacular.com/cdn/ingredients_100x100/${ing.image}` : "",
  }));

  let instructions: InstructionStep[] = [];
  if (Array.isArray(raw.analyzedInstructions) && raw.analyzedInstructions.length > 0) {
    instructions = raw.analyzedInstructions.flatMap((instr: any) =>
      (instr.steps || []).map((step: any) => ({
        number: step.number || 0,
        step: step.step || "",
      }))
    );
  } else if (typeof raw.instructions === "string") {
    const steps = raw.instructions
      .split(/\n/)
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);
    instructions = steps.map((step: string, index: number) => ({
      number: index + 1,
      step: step.replace(/^\d+\.\s*/, ""),
    }));
  }

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
    averageRating: raw.spoonacularScore ? raw.spoonacularScore / 20 : 0,
    reviewCount: 0,
  };
}

/**
 * Gets a specific number of random recipes, optionally filtered by tags.
 * @param number 
 * @param tags 
 * @returns mapped, formatted, and validated recipes
 */
export async function getRandomRecipes(number = 5): Promise<Recipe[]> {
  const data = await fetchRandomRecipes(number);

  const formatted = data.map(formatRecipe);

  const validated = formatted.filter(validateRecipe);

  return validated;
}

/**
 * Searches for recipes with given number and filters. 
 * @param params 
 * @returns Promise<{ totalResults: number; items: Recipe[] }>
 */
export async function searchRecipes(params: SearchQueryParams = {}): Promise<{ totalResults: number; items: Recipe[] }> {
  const searchTerm = firstParam(params.query) || "";
  const cuisine = firstParam(params.cuisine);
  const diet = firstParam(params.diet);
  const mealType = firstParam(params.type);
  const limitParam = firstParam(params.number) ?? firstParam(params.limit);
  const pageSize = Number(limitParam) > 0 ? Number(limitParam) : 20;
  const hasAdvancedFilters = Boolean(cuisine || diet || mealType);

  if (hasAdvancedFilters) {
    const spoonacularParams: Record<string, string | number> = {
      number: pageSize,
    };

    if (searchTerm) spoonacularParams.query = searchTerm;
    if (cuisine) spoonacularParams.cuisine = cuisine;
    if (diet) spoonacularParams.diet = diet;
    if (mealType) spoonacularParams.type = mealType;

    const data = await fetchSpoonacularSearchRecipes(spoonacularParams);
    const items = (data.results || []).map(formatSpoonacularRecipe).filter(validateRecipe);

    return {
      totalResults: data.totalResults ?? items.length,
      items,
    };
  }

  const data = await fetchSupabaseSearchRecipes(searchTerm, pageSize);
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

/**
 * Get user's favorite recipes
 * @param userId 
 * @returns array of favorite recipes
*/
export async function getUserFavorites(userId: string): Promise<Recipe[]> {
  const data = await fetchUserFavorites(userId);
  return data.map(formatRecipe).filter(validateRecipe);
}

/**
 * Add recipe to user's favorites
 * @param userId 
 * @param recipeId 
 */
export async function addFavorite(userId: string, recipeId: string) {
  return await addFavoriteDb(userId, recipeId);
}

/**
 * Remove recipe from user's favorites
 * @param userId 
 * @param recipeId 
 */
export async function removeFavorite(userId: string, recipeId: string) {
  return await removeFavoriteDb(userId, recipeId);
}

/**
 * Check if recipe is favorited by user
 * @param userId 
 * @param recipeId 
 * @returns boolean
 */
export async function isFavorited(userId: string, recipeId: string): Promise<boolean> {
  return await isFavoritedDb(userId, recipeId);
}

/**
 * Create a new user recipe
 * @param userId 
 * @param recipe 
 * @returns created recipe
*/
export async function createUserRecipe(userId: string, recipe: any): Promise<Recipe> {
  const created = await createUserRecipeDb(userId, recipe);
  return formatRecipe(created);
}

/**
 * Update a user's recipe
 * @param userId 
 * @param recipeId 
 * @param updates 
 * @returns updated recipe
*/
export async function updateUserRecipe(userId: string, recipeId: string, updates: any): Promise<Recipe> {
  const updated = await updateUserRecipeDb(userId, recipeId, updates);
  return formatRecipe(updated);
}

/**
 * Delete a user's recipe
 * @param userId 
 * @param recipeId 
*/
export async function deleteUserRecipe(userId: string, recipeId: string) {
  return await deleteUserRecipeDb(userId, recipeId);
}

/**
 * Add a new rating/review for a recipe.
 * @param userId ID of the user submitting the review.
 * @param recipeId ID of the recipe being reviewed.
 * @param rating The score (1-5).
 */
export async function addReview(userId: string, recipeId: string, rating: number) {
  return await addReviewDb(userId, recipeId, rating);
}

type MinimalReview = {
  user_id: string;
  rating: number;
  created_at: string; // or Date object
}

/**
 * Get all ratings/reviews for a specific recipe.
 * @param recipeId ID of the recipe.
 * @returns Array of minimal review objects.
 */
export async function getRecipeReviews(recipeId: string): Promise<MinimalReview[]> {
  const data = await fetchRecipeReviewsDb(recipeId);
  return data;
}

/**
 * Delete a specific user's review for a recipe.
 * @param userId ID of the user whose review is being deleted.
 * @param recipeId ID of the recipe.
 * @returns boolean indicating success (true if a row was deleted, false otherwise).
 */
export async function deleteReview(userId: string, recipeId: string): Promise<boolean> {
  const success = await deleteReviewDb(userId, recipeId);

  return success;
}