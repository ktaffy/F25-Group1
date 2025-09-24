import { Router } from "express";
import * as recipeController from "../controllers/recipeController.js";

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
 *         schema:
 *           type: integer
 *           default: 5
 *         description: How many recipes to fetch
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags (diet, cuisine, etc.)
 *     responses:
 *       200:
 *         description: A list of random recipes
 */
router.get("/random", recipeController.getRandomRecipes);

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
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/search", recipeController.searchRecipes);

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
 *       404:
 *         description: Recipe not found or invalid
 */
router.get("/:id", recipeController.getRecipe);

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
router.get("/:id/steps", recipeController.getRecipeSteps);

export default router;
