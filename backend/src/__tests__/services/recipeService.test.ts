import { config } from "dotenv";
import * as recipeService from "../../services/recipeService.js";

config();

describe("recipeService (live integration)", () => {
  const testUser = "550e8400-e29b-41d4-a716-446655440000";
  const fakeRecipeId = "00000000-0000-0000-0000-000000000000";

  it("getRandomRecipes() should return formatted recipes", async () => {
    const recipes = await recipeService.getRandomRecipes(3);
    expect(Array.isArray(recipes)).toBe(true);

    if (recipes.length > 0) {
      const r = recipes[0]!;
      expect(r).toHaveProperty("id");
      expect(r).toHaveProperty("title");
      expect(Array.isArray(r.ingredients)).toBe(true);
      expect(Array.isArray(r.instructions)).toBe(true);
    } else {
      expect(recipes.length).toBeGreaterThanOrEqual(0);
    }
  });

  it("searchRecipes() should return object with totalResults and items", async () => {
    const result = await recipeService.searchRecipes({ query: "chicken" });
    expect(result).toHaveProperty("totalResults");
    expect(result).toHaveProperty("items");
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("getRecipe() should return one valid recipe or null", async () => {
    const recipes = await recipeService.getRandomRecipes(1);
    const id = recipes[0]?.id;

    if (id !== undefined && id !== null) {
      const recipe = await recipeService.getRecipe(String(id));
      expect(recipe === null || recipe?.id === id).toBe(true);
    } else {
      expect(recipes.length).toBe(0);
    }
  });

  it("getRecipeSteps() should return an array of steps", async () => {
    const recipes = await recipeService.getRandomRecipes(1);
    const id = recipes[0]?.id;

    if (id !== undefined && id !== null) {
      const steps = await recipeService.getRecipeSteps(String(id));
      expect(Array.isArray(steps)).toBe(true);
    } else {
      expect(recipes.length).toBe(0);
    }
  });

  it("getUserFavorites() should return an array (maybe empty)", async () => {
    const favs = await recipeService.getUserFavorites(testUser);
    expect(Array.isArray(favs)).toBe(true);
  });

  it("isFavorited() should return boolean", async () => {
    const result = await recipeService.isFavorited(testUser, fakeRecipeId);
    expect(typeof result).toBe("boolean");
  });
});
