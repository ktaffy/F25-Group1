import { Router } from "express";
import * as spoon from "../services/spoonacular.js";

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
router.get("/random", async (req, res) => {
  try {
    const { number, tags } = req.query;
    const recipes = await spoon.randomRecipes(Number(number) || 5, tags as string);
    res.json(recipes);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch random recipes" });
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
router.get("/search", async (req, res) => {
  try {
    const results = await spoon.searchRecipes(req.query);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Search failed" });
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
router.get("/:id", async (req, res) => {
  try {
    const recipe = await spoon.getRecipe(Number(req.params.id));
    res.json(recipe);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch recipe details" });
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
router.get("/:id/steps", async (req, res) => {
  try {
    const steps = await spoon.getSteps(Number(req.params.id));
    res.json(steps);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch recipe steps" });
  }
});

export default router;
