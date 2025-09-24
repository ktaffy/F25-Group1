import axios from "axios";
import { env } from "../config/env.js";
import type { Recipe } from "../types/recipeTypes.js";

const BASE = "https://api.spoonacular.com";

/**
 * Helper function to call Spoonacular with the apiKey.
 * @param url - API endpoint
 * @param params - query params
 * @returns the result of the query
 */
async function request<T>(url: string, params: Record<string, any> = {}): Promise<T> {
  const { data } = await axios.get<T>(`${BASE}${url}`, {
    params: { ...params, apiKey: env.spoonKey },
  });
  return data;
}

/**
 * Get random recipes (raw).
 * @param number - how many recipes
 * @param tags - filters
 * @returns raw recipes
 */
export async function fetchRandomRecipes(number = 5, tags?: string) {
  return await request<{ recipes: any[] }>("/recipes/random", {
    number,
    tags,
    limitLicense: true,
  });
}

/**
 * Get results for a search given filters (raw).
 * @param params - filters
 * @returns raw results
 */
export async function fetchSearchRecipes(params: any) {
  return await request<{ totalResults: number; results: any[] }>("/recipes/complexSearch", {
    ...params,
    addRecipeInformation: true,
    addRecipeInstructions: true,
    instructionsRequired: true,
    fillIngredients: true,
    limitLicense: true,
  });
}

/**
 * Gets a singular recipe given id (raw).
 * @param id - unique id
 * @returns raw recipe
 */
export async function fetchRecipeById(id: number): Promise<Recipe> {
  return await request(`/recipes/${id}/information`, { includeNutrition: false });
}

/**
 * Get analyzed steps for a recipe (raw).
 * @param id - recipe id
 * @returns raw step objects
 */
export async function fetchSteps(id: number) {
  return await request<any[]>(`/recipes/${id}/analyzedInstructions`);
}
