import { supabase } from "../config/supabase.js";
import type { Recipe } from "../types/recipeTypes.js";

/**
 * Get all recipes with optional pagination and filters
 * @param params - filters and pagination
 * @returns recipes array
*/
export async function fetchRecipes(params?: {
    limit?: number;
    offset?: number;
    dishType?: string;
    source?: 'spoonacular' | 'user';
}) {
    let query = supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

    if (params?.limit) {
        query = query.limit(params.limit);
    }

    if (params?.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    if (params?.dishType) {
        query = query.contains('dish_types', [params.dishType]);
    }

    if (params?.source) {
        query = query.eq('source', params.source);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
}

/**
 * Get random recipes
 * @param limit - number of random recipes to fetch
 * @returns random recipes array
 */
export async function fetchRandomRecipes(limit = 10) {
    console.log('=== Fetching random recipes ===');
    console.log('Limit:', limit);
    console.log('Supabase URL:', process.env.SUPABASE_URL);

    const { data, error } = await supabase
        .rpc('get_random_recipes', { recipe_limit: limit });

    if (error) throw error;
    return data || [];
  }

/**
 * Get a single recipe by ID
 * @param id - recipe id
 * @returns recipe object
*/
export async function fetchRecipeById(id: string): Promise<Recipe | null> {
    const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return data;
}
/**
 * Get a single recipe by ID from database (minimal data for scheduling)
 * Same signature as Spoonacular's fetchRecipeById but uses database
 * @param id - recipe id (text - can be numeric string or UUID)
 * @returns object with at least { title: string } property
 */
export async function fetchRecipeByIdForSchedule(id: string): Promise<{ title: string }> {
    const { data, error } = await supabase
        .from('recipes')
        .select('id, title, instructions')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error(`Recipe not found: ${id}`);

    return { title: data.title };
}

/**
 * Get parsed steps for a recipe from database
 * Same purpose as Spoonacular's fetchSteps but uses database instructions field
 * @param id - recipe id (text - can be numeric string or UUID)  
 * @returns array of instruction objects with steps array
 */
export async function fetchStepsFromDb(id: string): Promise<Array<{ steps: Array<{ step: string }> }>> {
    const { data, error } = await supabase
        .from('recipes')
        .select('instructions')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error(`Recipe not found: ${id}`);

    const stepTexts = parseInstructionText(data.instructions);

    return [{
        steps: stepTexts.map((step: string) => ({ step }))
    }];
}

/**
 * Robustly parse instructions stored as:
 * - newline separated text
 * - "Step X: ..." lines
 * - HTML lists (<ol><li>...</li></ol>)
 * - JSON-stringified arrays or objects
 */
function parseInstructionText(raw: any): string[] {
    if (!raw) return [];

    // If the value is a JSON stringified array/object, try to parse it first.
    if (typeof raw === "string" && /^[\\[{]/.test(raw.trim())) {
        try {
            const parsed = JSON.parse(raw);
            raw = parsed;
        } catch {
            // fall through to treat as plain text
        }
    }

    if (Array.isArray(raw)) {
        return raw
            .map((s: any) => (typeof s === "string" ? s : s?.step))
            .filter((s: any): s is string => Boolean(s))
            .map((s: string) => s.trim())
            .filter(Boolean);
    }

    const text = String(raw);

    // HTML list items
    const liMatches = Array.from(text.matchAll(/<li[^>]*>(.*?)<\/li>/gis)).map(m => m[1]);
    if (liMatches.length > 0) {
        return liMatches
            .map(stripHtmlTags)
            .map(cleanNumbering)
            .filter(Boolean);
    }

    // Split on newlines
    const newlineParts = text
        .split(/\r?\n/)
        .map(p => p.trim())
        .filter(Boolean);
    if (newlineParts.length > 1) {
        return newlineParts.map(cleanNumbering);
    }

    // Split on "Step X" markers
    const stepParts = text
        .split(/step\s*\d+[:.)-]?\s*/i)
        .map(p => p.trim())
        .filter(Boolean);
    if (stepParts.length > 1) {
        return stepParts.map(cleanNumbering);
    }

    return [cleanNumbering(text)];
}

function stripHtmlTags(str: string): string {
    return str.replace(/<\/?[^>]+(>|$)/g, '').trim();
}

function cleanNumbering(str: string): string {
    return str.replace(/^\d+\s*[\.\)\-:]\s*/, '').trim();
}

/**
 * Search recipes by title
 * @param searchTerm - search query
 * @param limit - max results
 * @param filters - optional creator/source filters
 * @returns matching recipes
*/
export async function fetchSearchRecipes(
    searchTerm: string,
    limit = 20,
    filters?: {
        createdBy?: 'mine' | 'others' | 'app',
        userId?: string,
        mealType?: string
    }
) {
    let query = supabase
        .from('recipes')
        .select('*')
        .ilike('title', `%${searchTerm}%`)
        .limit(limit);

    if (filters?.mealType) {
        query = query.contains('dish_types', [filters.mealType]);
    }

    if (filters?.createdBy === 'mine') {
        if (filters.userId) {
            query = query
                .eq('source', 'user')
                .eq('user_id', filters.userId);
        } else {
            query = query.eq('source', 'user');
        }
    } else if (filters?.createdBy === 'others') {
        query = query.eq('source', 'user');
        if (filters.userId) {
            query = query.neq('user_id', filters.userId);
        }
    } else if (filters?.createdBy === 'app') {
        query = query.eq('source', 'spoonacular');
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
}

/**
 * Get user's favorite recipes
 * @param userId - user id
 * @returns array of favorited recipes
 */
export async function fetchUserFavorites(userId: string) {
    const { data, error } = await supabase
        .from('user_favorites')
        .select(`
      recipe_id,
      created_at,
      recipes (*)
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || [])
        .map((item): Recipe | null => ((item.recipes ?? null) as unknown as Recipe | null))
        .filter((recipe): recipe is Recipe => Boolean(recipe));
}

type UpsertRecipeInput = {
    id: string;
    title: string;
    image?: string | null;
    servings?: number | null;
    ready_in_minutes?: number | null;
    summary?: string | null;
    ingredients?: any[] | null;
    instructions?: string | null;
    dish_types?: string[] | null;
    source?: 'spoonacular' | 'user' | null;
    source_url?: string | null;
};

export async function upsertRecipe(record: UpsertRecipeInput) {
    const { data, error } = await supabase
        .from('recipes')
        .upsert(record, { onConflict: 'id' })
        .select('*')
        .single();

    if (error) throw error;
    return data;
}

/**
 * Add recipe to user's favorites
 * @param userId - user id
 * @param recipeId - recipe id
*/
export async function addFavorite(userId: string, recipeId: string) {
    const { error } = await supabase
        .from('user_favorites')
        .insert({
            user_id: userId,
            recipe_id: recipeId
        });

    if (error && error.code !== '23505') { // Ignore duplicate key errors, already in favorited
        throw error;
    }

    return { success: true };
}

/**
 * Remove recipe from user's favorites
 * @param userId - user id
 * @param recipeId - recipe id
 */
export async function removeFavorite(userId: string, recipeId: string) {
    const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_id', recipeId);

    if (error) throw error;
    return { success: true };
}

/**
 * Check if a recipe is favorited by user
 * @param userId - user id
 * @param recipeId - recipe id
 * @returns boolean
 */
export async function isFavorited(userId: string, recipeId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('recipe_id', recipeId)
        .maybeSingle();

    if (error) throw error;
    return !!data;
}

/**
 * Create a new user recipe
 * @param userId - user id
 * @param recipe - recipe data
 * @returns created recipe
 */
export async function createUserRecipe(userId: string, recipe: {
    title: string;
    image?: string;
    servings: number;
    ready_in_minutes: number;
    summary?: string;
    ingredients: any[];
    instructions: string;
    dish_types?: string[];
}) {
    const { data, error } = await supabase
        .from('recipes')
        .insert({
            ...recipe,
            id: crypto.randomUUID(),
            source: 'user',
            user_id: userId,
            source_url: null
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Update a user's recipe
 * @param userId - user id
 * @param recipeId - recipe id
 * @param updates - fields to update
 */
export async function updateUserRecipe(
    userId: string,
    recipeId: string,
    updates: Partial<Recipe>
) {
    const { data, error } = await supabase
        .from('recipes')
        .update(updates)
        .eq('id', recipeId)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a user's recipe
 * @param userId - user id
 * @param recipeId - recipe id
 */
export async function deleteUserRecipe(userId: string, recipeId: string) {
    const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)
        .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
}

/**
 * Add a rating/review to a recipe.
 * @param userId - user id
 * @param recipeId - recipe id (MUST be 'text' to match the recipes table PK)
 * @param rating - the score (1-5)
 */
export async function addReview(userId: string, recipeId: string, rating: number) {
    const { error } = await supabase
        .from('reviews')
        .insert({
            user_id: userId,
            recipe_id: recipeId,
            rating: rating
        });

    if (error && error.code !== '23505') {
        throw error;
    }

    return { success: true };
}

/**
 * Get all reviews for a single recipe.
 * @param recipeId - recipe id (MUST be 'text' to match the recipes table PK)
 * @returns array of reviews
 */
export async function fetchRecipeReviews(recipeId: string) {
    const { data, error } = await supabase
        .from('reviews')
        .select(`
            user_id,
            rating,
            created_at
        `)
        .eq('recipe_id', recipeId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Delete a user's review for a recipe.
 * @param userId - user id
 * @param recipeId - recipe id (MUST be 'text' to match the recipes table PK)
 * @returns boolean indicating if any row was deleted
 */
export async function deleteReview(userId: string, recipeId: string): Promise<boolean> {
    const { count, error } = await supabase
        .from('reviews')
        .delete({ count: 'exact' })
        .eq('user_id', userId)
        .eq('recipe_id', recipeId);

    if (error) throw error;
    return count === 1;
}
