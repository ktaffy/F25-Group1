import type { Request, Response, NextFunction } from "express";
import * as recipeService from "../services/recipeService.js";

export async function getRandomRecipes(req: Request, res: Response, next: NextFunction) {
  try {
    const { number, tags } = req.query;
    const recipes = await recipeService.getRandomRecipes(Number(number) || 5, tags as string);
    res.json(recipes);
  } catch (err) {
    next(err);
  }
}

export async function searchRecipes(req: Request, res: Response, next: NextFunction) {
  try {
    const results = await recipeService.searchRecipes(req.query);
    res.json(results);
  } catch (err) {
    next(err);
  }
}

export async function getRecipe(req: Request, res: Response, next: NextFunction) {
  try {
    const recipe = await recipeService.getRecipe(Number(req.params.id));
    if (!recipe) {
      res.status(404).json({ error: "Recipe not found or invalid" });
      return;
    }
    res.json(recipe);
  } catch (err) {
    next(err);
  }
}

export async function getRecipeSteps(req: Request, res: Response, next: NextFunction) {
  try {
    const steps = await recipeService.getRecipeSteps(Number(req.params.id));
    res.json(steps);
  } catch (err) {
    next(err);
  }
}
