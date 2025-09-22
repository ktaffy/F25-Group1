import { Router } from "express";
import { getRandomRecipes, searchRecipes, getRecipe, getRecipeSteps } from "../services/recipeService.js";

const router = Router();

/**
 * @openapi
 * /recipes/random:
 *   get:
 *     summary: Get random recipes
 *     tags:
 *       - Recipes
 *     parameters:
 *       - in: query
 *         name: number
 *         schema: { type: integer, default: 5 }
 *         description: How many recipes to fetch
 *       - in: query
 *         name: tags
 *         schema: { type: string }
 *         description: Comma-separated tags (diet, cuisine, etc.)
 *     responses:
 *       200:
 *         description: A list of random recipes
 */
router.get("/random", async (req, res, next) => {
  try {
    const { number, tags } = req.query;
    const recipes = await getRandomRecipes(Number(number) || 5, tags as string);
    res.json(recipes);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /recipes/search:
 *   get:
 *     summary: Search recipes with filters
 *     tags:
 *       - Recipes
 *     parameters:
 *       - in: query
 *         name: query
 *         schema: { type: string }
 *         description: Search keyword (e.g., "pasta")
 *       - in: query
 *         name: diet
 *         schema: { type: string }
 *       - in: query
 *         name: cuisine
 *         schema: { type: string }
 *       - in: query
 *         name: intolerances
 *         schema: { type: string }
 *       - in: query
 *         name: includeIngredients
 *         schema: { type: string }
 *       - in: query
 *         name: excludeIngredients
 *         schema: { type: string }
 *       - in: query
 *         name: maxReadyInMinutes
 *         schema: { type: integer }
 *       - in: query
 *         name: sort
 *         schema: { type: string }
 *       - in: query
 *         name: number
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/search", async (req, res, next) => {
  try {
    const results = await searchRecipes(req.query);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /recipes/{id}:
 *   get:
 *     summary: Get recipe details by ID
 *     tags:
 *       - Recipes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Full recipe details
 */
router.get("/:id", async (req, res, next) => {
  try {
    const recipe = await getRecipe(Number(req.params.id));
    if (!recipe) {
      res.status(404).json({ error: "Recipe not found or invalid" });
      return;
    }
    res.json(recipe);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /recipes/{id}/steps:
 *   get:
 *     summary: Get steps for a recipe
 *     tags:
 *       - Recipes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Recipe steps
 */
router.get("/:id/steps", async (req, res, next) => {
  try {
    const steps = await getRecipeSteps(Number(req.params.id));
    res.json(steps);
  } catch (err) {
    next(err);
  }
});

export default router;
