import type { Request, Response, NextFunction } from "express";
import * as recipeService from "../services/recipeService.js";
import { notFound } from "../utils/respond.js";

export async function getRandomRecipes(req: Request, res: Response, next: NextFunction) {
  try {
    const { number } = req.query;
    const recipes = await recipeService.getRandomRecipes(Number(number) || 5);
    res.json(recipes);
  } catch (err) {
    next(err);
  }
}

export async function searchRecipes(req: Request, res: Response, next: NextFunction) {
  try {
    const { query, limit } = req.query;
    const results = await recipeService.searchRecipes(
      query as string || '',
      Number(limit) || 20
    );
    res.json(results);
  } catch (err) {
    next(err);
  }
}

export async function getRecipe(req: Request, res: Response, next: NextFunction) {
  try {
    const recipe = await recipeService.getRecipe(req.params.id || '');
    if (!recipe) {
      return notFound(res, "Recipe not found or invalid");
    }
    res.json(recipe);
  } catch (err) {
    next(err);
  }
}

export async function getRecipeSteps(req: Request, res: Response, next: NextFunction) {
  try {
    const steps = await recipeService.getRecipeSteps(req.params.id || '');
    res.json(steps);
  } catch (err) {
    next(err);
  }
}
