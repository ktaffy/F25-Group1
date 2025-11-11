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
 * /recipes/favorites:
 *   get:
 *     summary: Get user's favorite recipes
 *     tags: [Favorites]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         description: User ID from Supabase auth
 *     responses:
 *       200:
 *         description: List of favorite recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Missing userId parameter
 */
router.get("/favorites", recipeController.getUserFavorites);

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
 * /recipes/favorites/{recipeId}:
 *   post:
 *     summary: Add recipe to favorites
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *           example: "716429"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *           example:
 *             userId: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Recipe added to favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing userId in request body
 */
router.post("/favorites/:recipeId", recipeController.addFavorite);

/**
 * @openapi
 * /recipes/favorites/{recipeId}:
 *   delete:
 *     summary: Remove recipe from favorites
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *           example: "716429"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *           example:
 *             userId: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Recipe removed from favorites
 *       400:
 *         description: Missing userId in request body
 */
router.delete("/favorites/:recipeId", recipeController.removeFavorite);

/**
 * @openapi
 * /recipes/{recipeId}/is-favorited:
 *   get:
 *     summary: Check if recipe is favorited
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *           example: "716429"
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Favorited status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorited:
 *                   type: boolean
 */
router.get("/:recipeId/is-favorited", recipeController.checkFavorited);

/**
 * @openapi
 * /recipes:
 *   post:
 *     summary: Create a new user recipe
 *     tags: [User Recipes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - title
 *               - ingredients
 *               - instructions
 *               - servings
 *               - ready_in_minutes
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               image:
 *                 type: string
 *               servings:
 *                 type: integer
 *               ready_in_minutes:
 *                 type: integer
 *               summary:
 *                 type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     unit:
 *                       type: string
 *                     original:
 *                       type: string
 *               instructions:
 *                 type: string
 *               dish_types:
 *                 type: array
 *                 items:
 *                   type: string
 *           example:
 *             userId: "550e8400-e29b-41d4-a716-446655440000"
 *             title: "My Homemade Pasta"
 *             servings: 4
 *             ready_in_minutes: 30
 *             summary: "Delicious homemade pasta recipe"
 *             ingredients:
 *               - name: "pasta"
 *                 amount: 500
 *                 unit: "g"
 *                 original: "500g pasta"
 *             instructions: "1. Boil water\n2. Cook pasta\n3. Serve"
 *             dish_types: ["dinner", "main course"]
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Missing required fields
 */
router.post("/", recipeController.createUserRecipe);

/**
 * @openapi
 * /recipes/{recipeId}:
 *   put:
 *     summary: Update a user recipe
 *     tags: [User Recipes]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               servings:
 *                 type: integer
 *               ready_in_minutes:
 *                 type: integer
 *               instructions:
 *                 type: string
 *           example:
 *             userId: "550e8400-e29b-41d4-a716-446655440000"
 *             title: "Updated Recipe Title"
 *             servings: 6
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 *       400:
 *         description: Missing userId
 */
router.put("/:recipeId", recipeController.updateUserRecipe);

/**
 * @openapi
 * /recipes/{recipeId}:
 *   delete:
 *     summary: Delete a user recipe
 *     tags: [User Recipes]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *           example:
 *             userId: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Recipe deleted successfully
 *       400:
 *         description: Missing userId
 */
router.delete("/:recipeId", recipeController.deleteUserRecipe);

/**
 * @openapi
 * /recipes/{recipeId}/reviews:
 *   post:
 *     summary: Submit a new rating for a recipe
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *         example: "716429"
 *         description: The ID of the recipe being reviewed.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - rating
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *                 description: The ID of the user submitting the review.
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *                 description: The score given to the recipe (1-5).
 *     responses:
 *       201:
 *         description: Review successfully added.
 *       400:
 *         description: Missing required fields or invalid rating value.
 *       409:
 *         description: Conflict, user has already reviewed this recipe.
 */
router.post("/:recipeId/reviews", recipeController.addReview);

/**
 * @openapi
 * /recipes/{recipeId}/reviews:
 *   get:
 *     summary: Get all ratings/reviews for a specific recipe
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *         example: "716429"
 *         description: The ID of the recipe to fetch reviews for.
 *     responses:
 *       200:
 *         description: A list of reviews for the recipe.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user_id:
 *                     type: string
 *                     format: uuid
 *                   rating:
 *                     type: integer
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */
router.get("/:recipeId/reviews", recipeController.getRecipeReviews);

/**
 * @openapi
 * /recipes/{recipeId}/reviews:
 *   delete:
 *     summary: Delete a user's rating/review for a recipe
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *         example: "716429"
 *         description: The ID of the recipe whose review is being deleted.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *                 description: The ID of the user whose review to delete.
 *     responses:
 *       200:
 *         description: Review successfully deleted.
 *       400:
 *         description: Missing userId in request body.
 *       404:
 *         description: Review not found or user not authorized.
 */
router.delete("/:recipeId/reviews", recipeController.deleteReview);

export default router;
