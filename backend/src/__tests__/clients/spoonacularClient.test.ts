import * as spoonacular from '../../clients/spoonacularClient.js';
import { config } from 'dotenv';

config(); // load .env for SPOONACULAR_KEY

describe('spoonacularClient (live API integration)', () => {
  // Make sure the API key is set
  beforeAll(() => {
    if (!process.env.SPOONACULAR_KEY && !process.env.SPOON_KEY && !process.env.SPOONACULAR_API_KEY) {
      throw new Error('❌ SPOONACULAR_KEY not set in environment');
    }
  });

  it('fetchRandomRecipes should return at least one recipe', async () => {
    const res = await spoonacular.fetchRandomRecipes(1);
    expect(res).toHaveProperty('recipes');
    expect(Array.isArray(res.recipes)).toBe(true);
    expect(res.recipes.length).toBeGreaterThan(0);
  });

  it('fetchSearchRecipes should return search results', async () => {
    const res = await spoonacular.fetchSearchRecipes({ query: 'pasta', number: 1 });
    expect(res).toHaveProperty('results');
    expect(Array.isArray(res.results)).toBe(true);
  });

  it('fetchRecipeById should return recipe details', async () => {
    // Use a known recipe ID (e.g., 716429 = Pasta with Garlic)
    const recipe = await spoonacular.fetchRecipeById(716429);
    expect(recipe).toHaveProperty('title');
    expect(typeof recipe.title).toBe('string');
  });

  it('fetchSteps should return analyzed instructions', async () => {
    const steps = await spoonacular.fetchSteps(716429);
    expect(Array.isArray(steps)).toBe(true);
    if (steps.length > 0) {
      expect(steps[0]).toHaveProperty('steps');
    }
  });

  it('handles invalid recipe ID gracefully', async () => {
    await expect(spoonacular.fetchRecipeById(999999999)).rejects.toThrow();
  });
});
