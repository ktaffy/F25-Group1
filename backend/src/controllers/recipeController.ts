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
    const results = await recipeService.searchRecipes(req.query);
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

export async function getUserFavorites(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const favorites = await recipeService.getUserFavorites(userId as string);
    res.json(favorites)
  } catch (err) {
    next(err);
  }
}

export async function addFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.body;
    const { recipeId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    await recipeService.addFavorite(userId, recipeId as string);
    res.json({ success: true, message: 'Recipe added to favorites' });
  } catch (err) {
    if (err instanceof recipeService.RecipeNotFoundError) {
      return notFound(res, "Recipe not found or unavailable");
    }
    next(err);
  }
}

export async function removeFavorite(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.body;
    const { recipeId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    await recipeService.removeFavorite(userId, recipeId as string);
    res.json({ success: true, message: 'Recipe removed from favorites' });
  } catch (err) {
    next(err);
  }
}

export async function checkFavorited(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.query;
    const { recipeId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const isFavorited = await recipeService.isFavorited(userId as string, recipeId as string);
    res.json({ isFavorited });
  } catch (err) {
    next(err);
  }
}

export async function createUserRecipe(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, ...recipeData } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const recipe = await recipeService.createUserRecipe(userId, recipeData);
    res.status(201).json(recipe);
  } catch (err) {
    next(err);
  }
}

export async function updateUserRecipe(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, ...updates } = req.body;
    const { recipeId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const recipe = await recipeService.updateUserRecipe(userId, recipeId as string, updates);
    res.json(recipe);
  } catch (err) {
    next(err);
  }
}

export async function deleteUserRecipe(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.body;
    const { recipeId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    await recipeService.deleteUserRecipe(userId, recipeId as string);
    res.json({ success: true, message: 'Recipe deleted' });
  } catch (err) {
    next(err);
  }
}

export async function addReview(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, rating } = req.body;
    const { recipeId } = req.params;

    if (!userId || rating === undefined) {
      return res.status(400).json({ error: 'userId and rating are required' });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    await recipeService.addReview(userId as string, recipeId as string, numericRating);

    res.status(201).json({ success: true, message: 'Review successfully added' });

  } catch (err) {
    next(err);
  }
}

export async function getRecipeReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const { recipeId } = req.params;

    const reviews = await recipeService.getRecipeReviews(recipeId as string);

    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

export async function deleteReview(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.body;
    const { recipeId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const deleted = await recipeService.deleteReview(userId as string, recipeId as string);

    if (deleted) {
      res.json({ success: true, message: 'Review successfully deleted' });
    } else {
      return notFound(res, "Review not found or user not authorized");
    }

  } catch (err) {
    next(err);
  }
}
