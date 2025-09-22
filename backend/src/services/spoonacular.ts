import axios from "axios";
import { env } from "../config/env.js";

const BASE = "https://api.spoonacular.com";

/**
 * Helper function to call Spoonacular with the apiKey. 
 * @param url
 * @param params 
 * @returns the result of the query
 */
async function request<T>(url: string, params: Record<string, any> = {}): Promise<T> {
  const { data } = await axios.get<T>(`${BASE}${url}`, {
    params: { ...params, apiKey: env.spoonKey },
  });
  return data;
}

/**
 * Get random recipes.
 * @param number - how many recipes
 * @param tags - filters 
 * @returns Recipes. 
 */
export async function randomRecipes(number = 5, tags?: string) {
  const data = await request<{ recipes: any[] }>("/recipes/random", {
    number,
    tags,
    limitLicense: true,
  });
  return data.recipes;
}

/**
 * Get results for a search given filters. 
 * @param params - filters
 * @returns { totalResults, items }
 */
export async function searchRecipes(params: any) {
  const data = await request<{
    totalResults: number;
    results: any[];
  }>("/recipes/complexSearch", {
    ...params,
    addRecipeInformation: true,
    limitLicense: true,
  });

  return {
    totalResults: data.totalResults,
    items: data.results,
  };
}

/**
 * Gets a singular recipe given id
 * @param id - unique id
 * @returns recipe
 */
export async function getRecipe(id: number) {
  return await request(`/recipes/${id}/information`, { includeNutrition: false });
}

/**
 * Get steps for recipe
 * @param id - recipe id
 * @returns steps or empty array
 */
export async function getSteps(id: number) {
  const data = await request<any[]>(`/recipes/${id}/analyzedInstructions`);
  return data[0]?.steps || [];
}
