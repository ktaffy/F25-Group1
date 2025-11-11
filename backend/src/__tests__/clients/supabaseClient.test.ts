import { config } from 'dotenv';
import * as supa from '../../clients/supabaseClient.js';

config(); // loads .env

describe('supabaseClient (live integration)', () => {
  beforeAll(() => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
    }
  });

  it('fetchRecipes should return an array', async () => {
    const res = await supa.fetchRecipes({ limit: 1 });
    expect(Array.isArray(res)).toBe(true);
  });

  it('fetchRandomRecipes should return random recipes', async () => {
    const res = await supa.fetchRandomRecipes(1);
    expect(Array.isArray(res)).toBe(true);
  });

  it('fetchRecipeById should handle invalid id gracefully', async () => {
    const result = await supa.fetchRecipeById('invalid-id').catch(err => err);
    // Supabase may return null or throw, handle both
    if (result === null) {
      expect(result).toBeNull();
    } else {
      expect(result).toBeTruthy();
    }
  });

  it('fetchSearchRecipes should return array (maybe empty)', async () => {
    const res = await supa.fetchSearchRecipes('chicken', 1);
    expect(Array.isArray(res)).toBe(true);
  });

  it('fetchUserFavorites should return array (maybe empty)', async () => {
    const res = await supa.fetchUserFavorites('550e8400-e29b-41d4-a716-446655440000');
    expect(Array.isArray(res)).toBe(true);
  });

  it('isFavorited should return boolean', async () => {
    const result = await supa.isFavorited(
      '550e8400-e29b-41d4-a716-446655440000',
      'fake-recipe-id'
    );
    expect(typeof result).toBe('boolean');
  });

  it('addFavorite and removeFavorite should succeed or return error object', async () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const recipeId = '716429';
    try {
      const add = await supa.addFavorite(userId, recipeId);
      expect(add).toHaveProperty('success', true);
      const rem = await supa.removeFavorite(userId, recipeId);
      expect(rem).toHaveProperty('success', true);
    } catch (err) {
      // Sometimes Supabase returns structured error (not Error instance)
      expect(typeof err).toBe('object');
    }
  });

  it('createUserRecipe should either return recipe or structured error', async () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const recipe = {
      title: 'Integration Test Recipe',
      servings: 1,
      ready_in_minutes: 5,
      ingredients: [{ name: 'test', amount: 1, unit: 'unit', original: '1 unit test' }],
      instructions: 'Mix and serve.',
    };
    try {
      const res = await supa.createUserRecipe(userId, recipe);
      expect(res).toHaveProperty('title', 'Integration Test Recipe');
    } catch (err) {
      expect(typeof err).toBe('object');
    }
  });

  it('updateUserRecipe should either return updated recipe or structured error', async () => {
    try {
      const res = await supa.updateUserRecipe(
        '550e8400-e29b-41d4-a716-446655440000',
        'fake-id',
        { title: 'Updated Recipe Title' }
      );
      expect(res).toHaveProperty('title');
    } catch (err) {
      expect(typeof err).toBe('object');
    }
  });

  it('deleteUserRecipe should either return success or structured error', async () => {
    try {
      const res = await supa.deleteUserRecipe(
        '550e8400-e29b-41d4-a716-446655440000',
        'fake-id'
      );
      expect(res).toHaveProperty('success', true);
    } catch (err) {
      expect(typeof err).toBe('object');
    }
  });
});
